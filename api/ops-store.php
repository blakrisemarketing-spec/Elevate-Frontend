<?php
/**
 * Ops domain layer for the 2027 platform: clients, engagements (tracked client
 * work), steps, deliverables, applications, activity, offline sales, marketing
 * spend, goals and the growth/ops stats RPCs. Schema:
 * supabase/migrations/005_platform_2027.sql. Plan: docs/2027-platform-plan.md.
 *
 * Same conventions as store.php: service-key PostgREST calls through
 * supabase.php, throws on transport/HTTP failure so endpoints can return a
 * friendly 503, emails lowercased, money in pesewas.
 */
declare(strict_types=1);

require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/store.php';
require_once __DIR__ . '/email.php';

const ECH_ENGAGEMENT_STATUSES = ['intake', 'in_progress', 'client_review', 'revisions', 'delivered', 'closed', 'on_hold'];
const ECH_SCHOOL_STATUSES = ['shortlisted', 'preparing', 'submitted', 'interview', 'offer', 'waitlisted', 'rejected', 'accepted', 'withdrawn'];
const ECH_JOB_STATUSES = ['found', 'applied', 'interview', 'offer', 'rejected', 'accepted', 'withdrawn'];
const ECH_CHANNELS = ['meta', 'google_ads', 'organic_search', 'tiktok', 'linkedin', 'whatsapp', 'email', 'x', 'youtube', 'referral', 'events', 'partnerships', 'direct', 'other'];
const ECH_SALE_METHODS = ['momo', 'bank', 'cash', 'card', 'other'];
const ECH_DELIVERABLE_BUCKET = 'ech-deliverables';

/** Client-facing label for each engagement status. */
function ech_engagement_status_label(string $status): string {
    return [
        'intake' => 'Getting started',
        'in_progress' => 'In progress',
        'client_review' => 'Ready for your review',
        'revisions' => 'Revisions in progress',
        'delivered' => 'Delivered',
        'closed' => 'Completed',
        'on_hold' => 'On hold',
    ][$status] ?? $status;
}

// ── Fulfilment config (generated at build from src/checkout/fulfilment.ts) ─

function ech_fulfilment_config(): array {
    static $cfg = null;
    if (is_array($cfg)) {
        return $cfg;
    }
    $path = __DIR__ . '/fulfilment.json';
    $decoded = is_file($path) ? json_decode((string) file_get_contents($path), true) : null;
    $cfg = is_array($decoded) ? $decoded : ['families' => [], 'categories' => [], 'services' => []];
    return $cfg;
}

function ech_family_template(string $family): array {
    $cfg = ech_fulfilment_config();
    $t = $cfg['families'][$family] ?? ($cfg['families']['custom'] ?? null);
    return is_array($t) ? $t : ['label' => 'Custom work', 'turnaroundDays' => 7, 'steps' => ['Brief received', 'In progress', 'Delivered']];
}

/** Components a service expands into; unknown ids become one custom item. */
function ech_service_components(string $serviceId, string $fallbackTitle = ''): array {
    $svc = ech_fulfilment_config()['services'][$serviceId] ?? null;
    if (is_array($svc) && !empty($svc['components']) && is_array($svc['components'])) {
        return $svc['components'];
    }
    return [['key' => 'custom', 'family' => 'custom', 'title' => $fallbackTitle !== '' ? $fallbackTitle : ($serviceId !== '' ? $serviceId : 'Custom work')]];
}

/** Bundle titles read better with the bundle name: "Starter Bundle: CV". */
function ech_component_title(string $serviceId, array $component, int $componentCount): string {
    $title = (string) ($component['title'] ?? 'Work item');
    if ($componentCount <= 1) {
        return $title;
    }
    $svc = ech_fulfilment_config()['services'][$serviceId] ?? null;
    $name = is_array($svc) ? (string) ($svc['name'] ?? '') : '';
    return $name !== '' ? $name . ': ' . $title : $title;
}

// ── Small helpers ────────────────────────────────────────────────────────

function ech_in_list(array $ids): string {
    $ids = array_values(array_unique(array_filter(array_map('intval', $ids), fn($i) => $i > 0)));
    return '(' . implode(',', $ids ?: [0]) . ')';
}

/** Strip PostgREST filter metacharacters from free-text search input. */
function ech_search_term(string $q): string {
    $q = preg_replace('/[^\p{L}\p{N}@.+_\- ]/u', '', $q) ?? '';
    return mb_substr(trim($q), 0, 80);
}

function ech_date_or_null($v): ?string {
    $v = trim((string) $v);
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) ? $v : null;
}

function ech_actor(array $user): array {
    return [
        'actor' => (string) ($user['email'] ?? 'system'),
        'actor_name' => (string) (($user['name'] ?? '') !== '' ? $user['name'] : ($user['email'] ?? 'System')),
    ];
}

// ── Activity ─────────────────────────────────────────────────────────────

function ech_activity_log(array $row): void {
    try {
        ech_sb_insert('ech_activity', [
            'actor' => (string) ($row['actor'] ?? 'system'),
            'actor_name' => (string) ($row['actor_name'] ?? ''),
            'client_id' => isset($row['client_id']) ? (int) $row['client_id'] : null,
            'engagement_id' => isset($row['engagement_id']) ? (int) $row['engagement_id'] : null,
            'kind' => (string) ($row['kind'] ?? 'note'),
            'summary' => mb_substr((string) ($row['summary'] ?? ''), 0, 4000),
            'client_visible' => !empty($row['client_visible']),
            'meta' => (object) ($row['meta'] ?? []),
        ]);
    } catch (Throwable $e) {
        // The activity feed must never break the action it records.
        error_log('[ops] activity log failed: ' . $e->getMessage());
    }
}

function ech_activity_recent(int $limit = 60, ?array $clientIds = null): array {
    $q = 'select=*,client:ech_clients(id,name,email)&order=created_at.desc&limit=' . $limit;
    if ($clientIds !== null) {
        $q .= '&client_id=in.' . ech_in_list($clientIds);
    }
    return ech_sb_select('ech_activity', $q);
}

/**
 * Email the client a short "something changed" note pointing at the portal.
 * Best-effort; never throws. Respects portal_enabled.
 */
function ech_notify_client(int $clientId, string $subject, string $line): void {
    try {
        $client = ech_client_get($clientId);
        $key = ech_runtime_secret('TOSEND_API_KEY');
        if (!$client || empty($client['portal_enabled']) || $key === '') {
            return;
        }
        $base = rtrim((string) (ech_runtime_secret('PUBLIC_APP_BASE_URL') ?: 'https://elevatecareerhub.com'), '/');
        $name = trim((string) $client['name']) !== '' ? explode(' ', trim((string) $client['name']))[0] : 'there';
        $from = ech_parse_from((string) (ech_runtime_secret('MAIL_FROM') ?: 'Elevate Career Hub <noreply@elevatecareerhub.com>'));
        ech_tosend_send($key, $from, [['email' => (string) $client['email']]], $subject,
            '<p>Hi ' . ech_esc($name) . ',</p><p>' . ech_esc($line) . '</p>'
            . '<p><a href="' . ech_esc($base . '/portal/') . '">Open your client portal</a></p><p>Elevate Career Hub</p>');
    } catch (Throwable $e) {
        error_log('[ops] client notify failed: ' . $e->getMessage());
    }
}

// ── Clients ──────────────────────────────────────────────────────────────

function ech_client_by_email(string $email): ?array {
    $email = strtolower(trim($email));
    if ($email === '') {
        return null;
    }
    $rows = ech_sb_select('ech_clients', 'select=*&email=eq.' . rawurlencode($email) . '&limit=1');
    return $rows[0] ?? null;
}

function ech_client_get(int $id): ?array {
    if ($id <= 0) {
        return null;
    }
    $rows = ech_sb_select('ech_clients', 'select=*&id=eq.' . $id . '&limit=1');
    return $rows[0] ?? null;
}

function ech_client_by_google_sub(string $sub): ?array {
    if ($sub === '') {
        return null;
    }
    $rows = ech_sb_select('ech_clients', 'select=*&google_sub=eq.' . rawurlencode($sub) . '&limit=1');
    return $rows[0] ?? null;
}

/**
 * Find-or-create a client by email. Existing rows only have blank name/phone
 * filled in; acquisition channel and first purchase date are set once.
 */
function ech_client_ensure(string $email, string $name = '', string $phone = '', string $channel = 'direct', ?string $firstPurchaseAt = null): array {
    $email = strtolower(trim($email));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('A valid client email is required.');
    }
    $existing = ech_client_by_email($email);
    if ($existing) {
        $patch = [];
        if (trim((string) $existing['name']) === '' && trim($name) !== '') {
            $patch['name'] = mb_substr(trim($name), 0, 160);
        }
        if (trim((string) $existing['phone']) === '' && trim($phone) !== '') {
            $patch['phone'] = mb_substr(trim($phone), 0, 40);
        }
        if (empty($existing['first_purchase_at']) && $firstPurchaseAt !== null) {
            $patch['first_purchase_at'] = $firstPurchaseAt;
            if ((string) $existing['acquisition_channel'] === 'direct' && $channel !== '') {
                $patch['acquisition_channel'] = $channel;
            }
        }
        if ($patch) {
            $patch['updated_at'] = gmdate('c');
            $rows = ech_sb_update('ech_clients', 'id=eq.' . (int) $existing['id'], $patch);
            return $rows[0] ?? array_merge($existing, $patch);
        }
        return $existing;
    }
    $res = ech_sb_insert('ech_clients', [
        'email' => $email,
        'name' => mb_substr(trim($name), 0, 160),
        'phone' => mb_substr(trim($phone), 0, 40),
        'acquisition_channel' => in_array($channel, ECH_CHANNELS, true) ? $channel : 'direct',
        'first_purchase_at' => $firstPurchaseAt,
    ], ['onConflict' => 'email', 'ignoreDuplicates' => true]);
    if (!empty($res[0]) && is_array($res[0])) {
        return $res[0];
    }
    // Lost a race with a concurrent insert: read the winner.
    $row = ech_client_by_email($email);
    if (!$row) {
        throw new RuntimeException('Could not create client.');
    }
    return $row;
}

function ech_client_update(int $id, array $patch): array {
    $allowed = [];
    foreach (['name' => 160, 'phone' => 40, 'notes' => 8000] as $k => $max) {
        if (array_key_exists($k, $patch)) {
            $allowed[$k] = mb_substr(trim((string) $patch[$k]), 0, $max);
        }
    }
    if (isset($patch['acquisition_channel']) && in_array($patch['acquisition_channel'], ECH_CHANNELS, true)) {
        $allowed['acquisition_channel'] = $patch['acquisition_channel'];
    }
    if (array_key_exists('portal_enabled', $patch)) {
        $allowed['portal_enabled'] = (bool) $patch['portal_enabled'];
    }
    if (!$allowed) {
        return ech_client_get($id) ?? [];
    }
    $allowed['updated_at'] = gmdate('c');
    $rows = ech_sb_update('ech_clients', 'id=eq.' . $id, $allowed);
    return $rows[0] ?? [];
}

/** Client fields safe to send to the admin UI (never hashes). */
function ech_client_public(array $c): array {
    return [
        'id' => (int) ($c['id'] ?? 0),
        'email' => (string) ($c['email'] ?? ''),
        'name' => (string) ($c['name'] ?? ''),
        'phone' => (string) ($c['phone'] ?? ''),
        'acquisitionChannel' => (string) ($c['acquisition_channel'] ?? 'direct'),
        'firstPurchaseAt' => $c['first_purchase_at'] ?? null,
        'notes' => (string) ($c['notes'] ?? ''),
        'portalEnabled' => !empty($c['portal_enabled']),
        'hasPassword' => ((string) ($c['password_hash'] ?? '')) !== '',
        'hasGoogle' => !empty($c['google_sub']),
        'lastLoginAt' => $c['last_login_at'] ?? null,
        'createdAt' => (string) ($c['created_at'] ?? ''),
    ];
}

/**
 * Client list with per-client open-work count and lifetime revenue.
 * $onlyIds restricts the list (staff see only clients they work on).
 */
function ech_clients_query(string $q, int $limit, int $offset, ?array $onlyIds = null): array {
    $filter = 'select=*&order=created_at.desc&limit=' . $limit . '&offset=' . $offset;
    $q = ech_search_term($q);
    if ($q !== '') {
        $like = rawurlencode('*' . $q . '*');
        $filter .= '&or=(name.ilike.' . $like . ',email.ilike.' . $like . ',phone.ilike.' . $like . ')';
    }
    if ($onlyIds !== null) {
        $filter .= '&id=in.' . ech_in_list($onlyIds);
    }
    $rows = ech_sb_select('ech_clients', $filter);
    $ids = array_map(fn($r) => (int) $r['id'], $rows);
    $open = [];
    $revenue = [];
    if ($ids) {
        foreach (ech_sb_select('ech_engagements', 'select=client_id,status&client_id=in.' . ech_in_list($ids)) as $e) {
            if (!in_array($e['status'], ['delivered', 'closed'], true)) {
                $open[(int) $e['client_id']] = ($open[(int) $e['client_id']] ?? 0) + 1;
            }
        }
        foreach (ech_sb_select('ech_revenue_v', 'select=client_id,amount_pesewas&client_id=in.' . ech_in_list($ids)) as $r) {
            $revenue[(int) $r['client_id']] = ($revenue[(int) $r['client_id']] ?? 0) + (int) $r['amount_pesewas'];
        }
    }
    $items = array_map(fn($r) => ech_client_public($r) + [
        'openWork' => $open[(int) $r['id']] ?? 0,
        'revenuePesewas' => $revenue[(int) $r['id']] ?? 0,
    ], $rows);
    return ['hasMore' => count($rows) === $limit, 'items' => $items];
}

// ── Engagements ──────────────────────────────────────────────────────────

const ECH_ENGAGEMENT_SELECT = 'select=*,client:ech_clients(id,name,email,phone),owner:ech_admin_users(id,name,email),steps:ech_engagement_steps(id,position,label,done,done_at,done_by)';

function ech_engagement_public(array $e): array {
    $steps = is_array($e['steps'] ?? null) ? $e['steps'] : [];
    usort($steps, fn($a, $b) => ((int) $a['position']) <=> ((int) $b['position']));
    $done = count(array_filter($steps, fn($s) => !empty($s['done'])));
    $owner = is_array($e['owner'] ?? null) ? $e['owner'] : null;
    $client = is_array($e['client'] ?? null) ? $e['client'] : null;
    $due = $e['due_on'] ?? null;
    $isOpen = !in_array($e['status'], ['delivered', 'closed'], true);
    return [
        'id' => (int) $e['id'],
        'clientId' => (int) $e['client_id'],
        'client' => $client ? ['id' => (int) $client['id'], 'name' => (string) $client['name'], 'email' => (string) $client['email'], 'phone' => (string) ($client['phone'] ?? '')] : null,
        'sourceKind' => (string) $e['source_kind'],
        'sourceRef' => (string) $e['source_ref'],
        'serviceId' => (string) $e['service_id'],
        'family' => (string) $e['family'],
        'title' => (string) $e['title'],
        'status' => (string) $e['status'],
        'ownerId' => $owner ? (int) $owner['id'] : null,
        'ownerName' => $owner ? ((string) $owner['name'] !== '' ? (string) $owner['name'] : (string) $owner['email']) : '',
        'dueOn' => $due,
        'overdue' => $isOpen && $due !== null && $due < gmdate('Y-m-d'),
        'clientMessage' => (string) $e['client_message'],
        'steps' => array_map(fn($s) => [
            'id' => (int) $s['id'], 'label' => (string) $s['label'], 'done' => !empty($s['done']),
            'doneAt' => $s['done_at'] ?? null, 'doneBy' => (string) ($s['done_by'] ?? ''),
        ], $steps),
        'stepsDone' => $done,
        'stepsTotal' => count($steps),
        'createdAt' => (string) $e['created_at'],
        'statusUpdatedAt' => (string) $e['status_updated_at'],
        'deliveredAt' => $e['delivered_at'] ?? null,
    ];
}

function ech_engagement_get(int $id): ?array {
    $rows = ech_sb_select('ech_engagements', ECH_ENGAGEMENT_SELECT . '&id=eq.' . $id . '&limit=1');
    return $rows[0] ?? null;
}

/**
 * Board query. $f: status (one or ''), ownerId (int, 0 = unassigned, null =
 * any), clientId, q (title search), includeClosed (bool).
 */
function ech_engagements_query(array $f): array {
    $q = ECH_ENGAGEMENT_SELECT . '&order=due_on.asc.nullslast,created_at.asc&limit=500';
    if (!empty($f['status']) && in_array($f['status'], ECH_ENGAGEMENT_STATUSES, true)) {
        $q .= '&status=eq.' . $f['status'];
    } elseif (empty($f['includeClosed'])) {
        // Board default: everything open, plus work delivered in the last 30 days.
        $since = rawurlencode(gmdate('c', time() - 30 * 86400));
        $q .= '&or=(status.not.in.(delivered,closed),delivered_at.gte.' . $since . ')';
        $q .= '&status=neq.closed';
    }
    if (array_key_exists('ownerId', $f) && $f['ownerId'] !== null) {
        $q .= ((int) $f['ownerId'] === 0) ? '&owner_id=is.null' : '&owner_id=eq.' . (int) $f['ownerId'];
    }
    if (!empty($f['clientId'])) {
        $q .= '&client_id=eq.' . (int) $f['clientId'];
    }
    $term = ech_search_term((string) ($f['q'] ?? ''));
    if ($term !== '') {
        $q .= '&title=ilike.' . rawurlencode('*' . $term . '*');
    }
    return array_map('ech_engagement_public', ech_sb_select('ech_engagements', $q));
}

/**
 * Create the engagement(s) a sale implies. Idempotent per
 * (source_kind, source_ref, component_key): re-running for the same purchase
 * creates nothing new. Returns the engagements created on this call.
 */
function ech_engagements_create_for_sale(int $clientId, string $sourceKind, string $sourceRef, string $serviceId, string $itemName, ?string $occurredAt = null): array {
    $components = ech_service_components($serviceId, $itemName);
    $created = [];
    $base = $occurredAt !== null ? (strtotime($occurredAt) ?: time()) : time();
    foreach ($components as $comp) {
        $family = (string) ($comp['family'] ?? 'custom');
        $tpl = ech_family_template($family);
        $isDigital = $family === 'digital';
        $now = gmdate('c');
        $row = [
            'client_id' => $clientId,
            'source_kind' => $sourceKind,
            'source_ref' => $sourceRef,
            'component_key' => (string) ($comp['key'] ?? $family),
            'service_id' => $serviceId,
            'family' => $family,
            'title' => mb_substr(ech_component_title($serviceId, $comp, count($components)), 0, 200),
            'status' => $isDigital ? 'delivered' : ($family === 'event' ? 'in_progress' : 'intake'),
            'due_on' => $isDigital ? null : gmdate('Y-m-d', $base + max(1, (int) ($tpl['turnaroundDays'] ?? 7)) * 86400),
            'delivered_at' => $isDigital ? $now : null,
            'started_at' => $family === 'event' ? $now : null,
            'created_at' => gmdate('c', $base),
        ];
        $res = ech_sb_insert('ech_engagements', $row, ['onConflict' => 'source_kind,source_ref,component_key', 'ignoreDuplicates' => true]);
        if (empty($res[0]['id'])) {
            continue; // already existed
        }
        $eng = $res[0];
        $steps = [];
        foreach (array_values((array) ($tpl['steps'] ?? [])) as $i => $label) {
            $steps[] = [
                'engagement_id' => (int) $eng['id'], 'position' => $i, 'label' => (string) $label,
                'done' => $isDigital, 'done_at' => $isDigital ? $now : null, 'done_by' => $isDigital ? 'system' : '',
            ];
        }
        if ($steps) {
            ech_sb_insert('ech_engagement_steps', $steps);
        }
        $created[] = $eng;
    }
    if ($created) {
        ech_activity_log([
            'client_id' => $clientId,
            'kind' => 'work_created',
            'summary' => 'Work started: ' . implode(', ', array_map(fn($e) => (string) $e['title'], $created)),
            'client_visible' => true,
            'meta' => ['source' => $sourceKind, 'ref' => $sourceRef, 'serviceId' => $serviceId],
        ]);
    }
    return $created;
}

/** A one-off piece of work not tied to a sale (e.g. a goodwill revision). */
function ech_engagement_create_manual(int $clientId, string $title, string $family, ?int $ownerId, ?string $dueOn, array $actor): array {
    $tpl = ech_family_template($family);
    $res = ech_sb_insert('ech_engagements', [
        'client_id' => $clientId,
        'source_kind' => 'manual',
        'source_ref' => 'manual-' . bin2hex(random_bytes(8)),
        'component_key' => $family,
        'family' => $family,
        'title' => mb_substr(trim($title), 0, 200),
        'owner_id' => $ownerId,
        'due_on' => $dueOn ?? gmdate('Y-m-d', time() + max(1, (int) ($tpl['turnaroundDays'] ?? 7)) * 86400),
    ]);
    $eng = $res[0] ?? null;
    if (!$eng) {
        throw new RuntimeException('Could not create work item.');
    }
    $steps = [];
    foreach (array_values((array) ($tpl['steps'] ?? [])) as $i => $label) {
        $steps[] = ['engagement_id' => (int) $eng['id'], 'position' => $i, 'label' => (string) $label];
    }
    if ($steps) {
        ech_sb_insert('ech_engagement_steps', $steps);
    }
    ech_activity_log(ech_actor($actor) + [
        'client_id' => $clientId, 'engagement_id' => (int) $eng['id'], 'kind' => 'work_created',
        'summary' => 'Work added: ' . $eng['title'], 'client_visible' => true,
    ]);
    return $eng;
}

/**
 * Patch an engagement: status, owner_id, due_on, title, client_message.
 * Status changes stamp lifecycle timestamps and post a client-visible update.
 */
function ech_engagement_update(int $id, array $patch, array $actor): array {
    $current = ech_engagement_get($id);
    if (!$current) {
        throw new InvalidArgumentException('Work item not found.');
    }
    $set = [];
    $now = gmdate('c');
    if (isset($patch['status']) && in_array($patch['status'], ECH_ENGAGEMENT_STATUSES, true) && $patch['status'] !== $current['status']) {
        $s = $patch['status'];
        $set['status'] = $s;
        $set['status_updated_at'] = $now;
        if ($s === 'in_progress' && empty($current['started_at'])) {
            $set['started_at'] = $now;
        }
        if ($s === 'delivered') {
            $set['delivered_at'] = $now;
        }
        if ($s === 'closed') {
            $set['closed_at'] = $now;
            if (empty($current['delivered_at'])) {
                $set['delivered_at'] = $now;
            }
        }
    }
    if (array_key_exists('ownerId', $patch)) {
        $owner = $patch['ownerId'] === null || (int) $patch['ownerId'] <= 0 ? null : (int) $patch['ownerId'];
        if ($owner !== ($current['owner_id'] ?? null)) {
            $set['owner_id'] = $owner;
        }
    }
    if (array_key_exists('dueOn', $patch)) {
        $set['due_on'] = ech_date_or_null($patch['dueOn']);
    }
    if (isset($patch['title']) && trim((string) $patch['title']) !== '') {
        $set['title'] = mb_substr(trim((string) $patch['title']), 0, 200);
    }
    if (array_key_exists('clientMessage', $patch)) {
        $set['client_message'] = mb_substr(trim((string) $patch['clientMessage']), 0, 2000);
    }
    if (!$set) {
        return ech_engagement_public($current);
    }
    $set['updated_at'] = $now;
    ech_sb_update('ech_engagements', 'id=eq.' . $id, $set);

    $who = ech_actor($actor);
    $clientId = (int) $current['client_id'];
    if (isset($set['status'])) {
        ech_activity_log($who + [
            'client_id' => $clientId, 'engagement_id' => $id, 'kind' => 'status',
            'summary' => $current['title'] . ': ' . ech_engagement_status_label($set['status']),
            'client_visible' => true,
            'meta' => ['from' => $current['status'], 'to' => $set['status']],
        ]);
        if (in_array($set['status'], ['client_review', 'delivered'], true)) {
            ech_notify_client($clientId, $set['status'] === 'delivered' ? 'Your ' . $current['title'] . ' is complete' : 'Your ' . $current['title'] . ' is ready for review',
                $set['status'] === 'delivered'
                    ? 'Good news: ' . $current['title'] . ' has been delivered. Your files are in your client portal.'
                    : $current['title'] . ' is ready for you to review. Open your portal to see it and send us any changes.');
        }
    }
    if (array_key_exists('owner_id', $set)) {
        ech_activity_log($who + [
            'client_id' => $clientId, 'engagement_id' => $id, 'kind' => 'assigned',
            'summary' => $current['title'] . ' assigned' . ($set['owner_id'] ? '' : ' (unassigned)'),
            'meta' => ['ownerId' => $set['owner_id']],
        ]);
    }
    if (isset($set['client_message']) && $set['client_message'] !== '' && $set['client_message'] !== $current['client_message']) {
        ech_activity_log($who + [
            'client_id' => $clientId, 'engagement_id' => $id, 'kind' => 'update',
            'summary' => $current['title'] . ': ' . $set['client_message'], 'client_visible' => true,
        ]);
    }
    return ech_engagement_public(ech_engagement_get($id) ?? $current);
}

function ech_step_set(int $stepId, bool $done, array $actor): array {
    $rows = ech_sb_select('ech_engagement_steps', 'select=*&id=eq.' . $stepId . '&limit=1');
    $step = $rows[0] ?? null;
    if (!$step) {
        throw new InvalidArgumentException('Step not found.');
    }
    ech_sb_update('ech_engagement_steps', 'id=eq.' . $stepId, [
        'done' => $done,
        'done_at' => $done ? gmdate('c') : null,
        'done_by' => $done ? (string) ($actor['email'] ?? '') : '',
    ]);
    $eng = ech_engagement_get((int) $step['engagement_id']);
    if ($eng && $done) {
        // Moving the first step out of intake implicitly starts the work.
        if ($eng['status'] === 'intake') {
            return ech_engagement_update((int) $eng['id'], ['status' => 'in_progress'], $actor);
        }
        ech_activity_log(ech_actor($actor) + [
            'client_id' => (int) $eng['client_id'], 'engagement_id' => (int) $eng['id'], 'kind' => 'step',
            'summary' => $eng['title'] . ': ' . $step['label'], 'client_visible' => true,
        ]);
    }
    return ech_engagement_public($eng ?? []);
}

function ech_engagement_delete(int $id): void {
    foreach (ech_sb_select('ech_deliverables', 'select=object_path&engagement_id=eq.' . $id) as $d) {
        ech_sb_storage_delete(ECH_DELIVERABLE_BUCKET, (string) $d['object_path']);
    }
    ech_sb_delete('ech_engagements', 'id=eq.' . $id);
}

function ech_staff_client_ids(int $adminId): array {
    $rows = ech_sb_select('ech_engagements', 'select=client_id&owner_id=eq.' . $adminId);
    return array_values(array_unique(array_map(fn($r) => (int) $r['client_id'], $rows)));
}

function ech_ops_summary(): array {
    $data = ech_sb_rpc('ech_ops_summary');
    return is_array($data) ? $data : [];
}

// ── Deliverables ─────────────────────────────────────────────────────────

function ech_sb_storage_delete(string $bucket, string $object): void {
    try {
        ech_sb_request('DELETE', '/storage/v1/object/' . rawurlencode($bucket) . '/' . str_replace('%2F', '/', rawurlencode($object)));
    } catch (Throwable $e) {
        error_log('[ops] storage delete failed: ' . $e->getMessage());
    }
}

function ech_deliverable_public(array $d): array {
    return [
        'id' => (int) $d['id'],
        'engagementId' => (int) $d['engagement_id'],
        'title' => (string) $d['title'],
        'fileName' => (string) $d['file_name'],
        'mime' => (string) $d['mime'],
        'sizeBytes' => (int) $d['size_bytes'],
        'version' => (int) $d['version'],
        'clientVisible' => !empty($d['client_visible']),
        'uploadedBy' => (string) $d['uploaded_by'],
        'createdAt' => (string) $d['created_at'],
    ];
}

function ech_deliverables_for_client(int $clientId, bool $onlyVisible = false): array {
    $q = 'select=*&client_id=eq.' . $clientId . '&order=created_at.desc';
    if ($onlyVisible) {
        $q .= '&client_visible=is.true';
    }
    return ech_sb_select('ech_deliverables', $q);
}

function ech_deliverable_get(int $id): ?array {
    $rows = ech_sb_select('ech_deliverables', 'select=*&id=eq.' . $id . '&limit=1');
    return $rows[0] ?? null;
}

/** Store an uploaded file for an engagement. Version = previous count + 1. */
function ech_deliverable_add(array $eng, string $title, string $fileName, string $mime, string $bytes, bool $visible, array $actor): array {
    $engId = (int) $eng['id'];
    $clientId = (int) $eng['client_id'];
    $existing = ech_sb_select('ech_deliverables', 'select=id&engagement_id=eq.' . $engId);
    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $object = 'c' . $clientId . '/e' . $engId . '/' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(6)) . ($ext !== '' ? '.' . $ext : '');
    if (!ech_sb_storage_upload(ECH_DELIVERABLE_BUCKET, $object, $bytes, $mime)) {
        throw new RuntimeException('File storage is unreachable.');
    }
    $res = ech_sb_insert('ech_deliverables', [
        'engagement_id' => $engId,
        'client_id' => $clientId,
        'title' => mb_substr(trim($title) !== '' ? trim($title) : $fileName, 0, 200),
        'object_path' => $object,
        'file_name' => mb_substr($fileName, 0, 200),
        'mime' => $mime,
        'size_bytes' => strlen($bytes),
        'version' => count($existing) + 1,
        'client_visible' => $visible,
        'uploaded_by' => (string) ($actor['email'] ?? ''),
    ]);
    $row = $res[0] ?? null;
    if (!$row) {
        ech_sb_storage_delete(ECH_DELIVERABLE_BUCKET, $object);
        throw new RuntimeException('Could not record the file.');
    }
    ech_activity_log(ech_actor($actor) + [
        'client_id' => $clientId, 'engagement_id' => $engId, 'kind' => 'deliverable',
        'summary' => ($visible ? 'New file ready: ' : 'File uploaded (internal): ') . $row['title'],
        'client_visible' => $visible,
        'meta' => ['deliverableId' => (int) $row['id']],
    ]);
    if ($visible) {
        ech_notify_client($clientId, 'A new file is ready: ' . $row['title'], $row['title'] . ' is ready to download in your client portal.');
    }
    return $row;
}

function ech_deliverable_set_visible(int $id, bool $visible, array $actor): array {
    $d = ech_deliverable_get($id);
    if (!$d) {
        throw new InvalidArgumentException('File not found.');
    }
    $rows = ech_sb_update('ech_deliverables', 'id=eq.' . $id, ['client_visible' => $visible]);
    if ($visible && empty($d['client_visible'])) {
        ech_activity_log(ech_actor($actor) + [
            'client_id' => (int) $d['client_id'], 'engagement_id' => (int) $d['engagement_id'], 'kind' => 'deliverable',
            'summary' => 'New file ready: ' . $d['title'], 'client_visible' => true,
            'meta' => ['deliverableId' => $id],
        ]);
        ech_notify_client((int) $d['client_id'], 'A new file is ready: ' . $d['title'], $d['title'] . ' is ready to download in your client portal.');
    }
    return $rows[0] ?? $d;
}

function ech_deliverable_delete(int $id): void {
    $d = ech_deliverable_get($id);
    if (!$d) {
        return;
    }
    ech_sb_storage_delete(ECH_DELIVERABLE_BUCKET, (string) $d['object_path']);
    ech_sb_delete('ech_deliverables', 'id=eq.' . $id);
}

/** Stream a deliverable to the browser (caller has already authorised). */
function ech_deliverable_stream(array $d): void {
    $bytes = ech_sb_storage_download(ECH_DELIVERABLE_BUCKET, (string) $d['object_path']);
    if ($bytes === null) {
        ech_json(['ok' => false, 'message' => 'File not found.'], 404);
    }
    $name = preg_replace('/[^A-Za-z0-9._ -]/', '_', (string) ($d['file_name'] ?: 'file')) ?? 'file';
    header('Content-Type: ' . ((string) $d['mime'] ?: 'application/octet-stream'));
    header('Content-Length: ' . (string) strlen($bytes));
    header('Content-Disposition: attachment; filename="' . $name . '"');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: private, no-store');
    echo $bytes;
    exit;
}

// ── Applications (school / job tracker) ──────────────────────────────────

function ech_application_public(array $a, bool $forClient = false): array {
    $out = [
        'id' => (int) $a['id'],
        'engagementId' => isset($a['engagement_id']) ? (int) $a['engagement_id'] : null,
        'kind' => (string) $a['kind'],
        'organization' => (string) $a['organization'],
        'title' => (string) $a['title'],
        'location' => (string) $a['location'],
        'url' => (string) $a['url'],
        'deadline' => $a['deadline'] ?? null,
        'status' => (string) $a['status'],
        'clientNotes' => (string) $a['client_notes'],
        'statusUpdatedAt' => (string) $a['status_updated_at'],
        'createdAt' => (string) $a['created_at'],
    ];
    if (!$forClient) {
        $out['internalNotes'] = (string) $a['internal_notes'];
    }
    return $out;
}

function ech_applications_for_client(int $clientId): array {
    return ech_sb_select('ech_applications', 'select=*&client_id=eq.' . $clientId . '&order=deadline.asc.nullslast,created_at.asc');
}

function ech_application_clean(array $in, string $kind): array {
    $statuses = $kind === 'job' ? ECH_JOB_STATUSES : ECH_SCHOOL_STATUSES;
    $out = [];
    foreach (['organization' => 200, 'title' => 200, 'location' => 120, 'client_notes' => 2000, 'internal_notes' => 4000] as $k => $max) {
        $src = ['client_notes' => 'clientNotes', 'internal_notes' => 'internalNotes'][$k] ?? $k;
        if (array_key_exists($src, $in)) {
            $out[$k] = mb_substr(trim((string) $in[$src]), 0, $max);
        }
    }
    if (array_key_exists('url', $in)) {
        $url = trim((string) $in['url']);
        $out['url'] = preg_match('#^https?://#i', $url) ? mb_substr($url, 0, 500) : '';
    }
    if (array_key_exists('deadline', $in)) {
        $out['deadline'] = ech_date_or_null($in['deadline']);
    }
    if (isset($in['status']) && in_array($in['status'], $statuses, true)) {
        $out['status'] = $in['status'];
    }
    if (array_key_exists('engagementId', $in)) {
        $out['engagement_id'] = (int) $in['engagementId'] > 0 ? (int) $in['engagementId'] : null;
    }
    return $out;
}

function ech_application_create(int $clientId, string $kind, array $in, array $actor): array {
    if (!in_array($kind, ['school', 'job'], true)) {
        throw new InvalidArgumentException('Unknown application type.');
    }
    $row = ech_application_clean($in, $kind);
    if (trim((string) ($row['organization'] ?? '')) === '') {
        throw new InvalidArgumentException($kind === 'job' ? 'Company is required.' : 'School is required.');
    }
    $row += ['client_id' => $clientId, 'kind' => $kind, 'status' => $kind === 'job' ? 'found' : 'shortlisted'];
    $res = ech_sb_insert('ech_applications', $row);
    $app = $res[0] ?? null;
    if (!$app) {
        throw new RuntimeException('Could not save application.');
    }
    ech_activity_log(ech_actor($actor) + [
        'client_id' => $clientId, 'engagement_id' => $app['engagement_id'] ?? null, 'kind' => 'application',
        'summary' => ($kind === 'job' ? 'Job added: ' : 'School added: ') . $app['organization'] . ($app['title'] !== '' ? ', ' . $app['title'] : ''),
        'client_visible' => true,
    ]);
    return $app;
}

function ech_application_update(int $id, array $in, array $actor): array {
    $rows = ech_sb_select('ech_applications', 'select=*&id=eq.' . $id . '&limit=1');
    $cur = $rows[0] ?? null;
    if (!$cur) {
        throw new InvalidArgumentException('Application not found.');
    }
    $patch = ech_application_clean($in, (string) $cur['kind']);
    if (!$patch) {
        return $cur;
    }
    $now = gmdate('c');
    $patch['updated_at'] = $now;
    $statusChanged = isset($patch['status']) && $patch['status'] !== $cur['status'];
    if ($statusChanged) {
        $patch['status_updated_at'] = $now;
    }
    $res = ech_sb_update('ech_applications', 'id=eq.' . $id, $patch);
    if ($statusChanged) {
        ech_activity_log(ech_actor($actor) + [
            'client_id' => (int) $cur['client_id'], 'engagement_id' => $cur['engagement_id'] ?? null, 'kind' => 'application',
            'summary' => $cur['organization'] . ': ' . str_replace('_', ' ', $patch['status']),
            'client_visible' => true,
            'meta' => ['from' => $cur['status'], 'to' => $patch['status']],
        ]);
        if (in_array($patch['status'], ['submitted', 'applied', 'interview', 'offer', 'waitlisted', 'accepted', 'rejected'], true)) ech_notify_client((int) $cur['client_id'], 'Application update: ' . $cur['organization'],
            'Your application to ' . $cur['organization'] . ($cur['title'] !== '' ? ' (' . $cur['title'] . ')' : '') . ' is now: ' . str_replace('_', ' ', $patch['status']) . '.');
    }
    return $res[0] ?? $cur;
}

function ech_application_delete(int $id): void {
    ech_sb_delete('ech_applications', 'id=eq.' . $id);
}

// ── Revenue: purchases + offline sales ───────────────────────────────────

/**
 * Wire a verified Paystack purchase into the platform: client record,
 * purchase.client_id, engagements. Idempotent; safe to re-run (sync action).
 */
function ech_purchase_link_and_fulfil(string $reference): ?array {
    $rows = ech_sb_select('ech_purchases', 'select=*&reference=eq.' . rawurlencode($reference) . '&limit=1');
    $p = $rows[0] ?? null;
    if (!$p || trim((string) $p['buyer_email']) === '') {
        return null;
    }
    $client = ech_client_ensure((string) $p['buyer_email'], (string) $p['buyer_name'], '', (string) ($p['channel'] ?: 'direct'), (string) $p['created_at']);
    if (empty($p['client_id'])) {
        ech_sb_update('ech_purchases', 'reference=eq.' . rawurlencode($reference), ['client_id' => (int) $client['id']]);
    }
    $created = ech_engagements_create_for_sale((int) $client['id'], 'paystack', $reference, (string) $p['service_id'], (string) $p['item_name'], (string) $p['created_at']);
    $client['__created'] = count($created);
    return $client;
}

function ech_offline_sale_create(array $in, array $actor): array {
    $email = strtolower(trim((string) ($in['email'] ?? '')));
    $amount = (int) round(((float) ($in['amountCedis'] ?? 0)) * 100);
    if ($amount <= 0) {
        throw new InvalidArgumentException('Amount must be more than zero.');
    }
    $method = in_array($in['method'] ?? '', ECH_SALE_METHODS, true) ? $in['method'] : 'momo';
    $channel = in_array($in['channel'] ?? '', ECH_CHANNELS, true) ? $in['channel'] : 'direct';
    $serviceId = trim((string) ($in['serviceId'] ?? ''));
    $svc = ech_fulfilment_config()['services'][$serviceId] ?? null;
    $itemName = trim((string) ($in['itemName'] ?? '')) ?: (is_array($svc) ? (string) $svc['name'] : '');
    if ($itemName === '') {
        throw new InvalidArgumentException('Pick a service or describe the item sold.');
    }
    $date = ech_date_or_null($in['date'] ?? '') ?? gmdate('Y-m-d');
    $occurredAt = $date . 'T12:00:00Z';

    $client = ech_client_ensure($email, (string) ($in['name'] ?? ''), (string) ($in['phone'] ?? ''), $channel, $occurredAt);
    $res = ech_sb_insert('ech_offline_sales', [
        'occurred_at' => $occurredAt,
        'client_id' => (int) $client['id'],
        'service_id' => $serviceId,
        'item_name' => mb_substr($itemName, 0, 200),
        'amount_pesewas' => $amount,
        'method' => $method,
        'channel' => $channel,
        'reference' => mb_substr(trim((string) ($in['reference'] ?? '')), 0, 120),
        'notes' => mb_substr(trim((string) ($in['notes'] ?? '')), 0, 2000),
        'recorded_by' => (string) ($actor['email'] ?? ''),
    ]);
    $sale = $res[0] ?? null;
    if (!$sale) {
        throw new RuntimeException('Could not record the sale.');
    }
    ech_activity_log(ech_actor($actor) + [
        'client_id' => (int) $client['id'], 'kind' => 'sale',
        'summary' => 'Offline sale recorded: ' . $itemName . ' (' . ech_format_cedis_plain($amount) . ', ' . $method . ')',
        'meta' => ['saleId' => (int) $sale['id']],
    ]);
    if (!empty($in['createWork'])) {
        ech_engagements_create_for_sale((int) $client['id'], 'offline', (string) $sale['id'], $serviceId, $itemName, $occurredAt);
    }
    try {
        ech_lead_mark_converted($email);
    } catch (Throwable $e) {
        error_log('[ops] offline auto-convert failed: ' . $e->getMessage());
    }
    return $sale;
}

function ech_format_cedis_plain(int $pesewas): string {
    return 'GHS ' . number_format($pesewas / 100, ($pesewas % 100) === 0 ? 0 : 2);
}

/** Delete a sale and any untouched work it created (intake, no files). */
function ech_offline_sale_delete(int $id): array {
    $kept = 0;
    $removed = 0;
    foreach (ech_sb_select('ech_engagements', 'select=id,status&source_kind=eq.offline&source_ref=eq.' . $id) as $e) {
        $files = ech_sb_select('ech_deliverables', 'select=id&engagement_id=eq.' . (int) $e['id'] . '&limit=1');
        if ($e['status'] === 'intake' && !$files) {
            ech_sb_delete('ech_engagements', 'id=eq.' . (int) $e['id']);
            $removed++;
        } else {
            $kept++;
        }
    }
    ech_sb_delete('ech_offline_sales', 'id=eq.' . $id);
    return ['workRemoved' => $removed, 'workKept' => $kept];
}

function ech_offline_sales_list(int $year): array {
    $from = rawurlencode(sprintf('%04d-01-01T00:00:00Z', $year));
    $to = rawurlencode(sprintf('%04d-01-01T00:00:00Z', $year + 1));
    return ech_sb_select('ech_offline_sales', 'select=*,client:ech_clients(id,name,email)&occurred_at=gte.' . $from . '&occurred_at=lt.' . $to . '&order=occurred_at.desc&limit=1000');
}

function ech_revenue_for_client(int $clientId): array {
    return ech_sb_select('ech_revenue_v', 'select=*&client_id=eq.' . $clientId . '&order=occurred_at.desc');
}

// ── Marketing spend + goals ──────────────────────────────────────────────

function ech_spend_create(array $in, array $actor): array {
    $amount = (int) round(((float) ($in['amountCedis'] ?? 0)) * 100);
    $channel = (string) ($in['channel'] ?? '');
    if ($amount <= 0 || !in_array($channel, ECH_CHANNELS, true)) {
        throw new InvalidArgumentException('Pick a channel and an amount above zero.');
    }
    $date = ech_date_or_null($in['date'] ?? '') ?? gmdate('Y-m-d');
    $res = ech_sb_insert('ech_marketing_spend', [
        'spent_on' => $date,
        'channel' => $channel,
        'campaign' => mb_substr(trim((string) ($in['campaign'] ?? '')), 0, 200),
        'amount_pesewas' => $amount,
        'notes' => mb_substr(trim((string) ($in['notes'] ?? '')), 0, 2000),
        'recorded_by' => (string) ($actor['email'] ?? ''),
    ]);
    return $res[0] ?? [];
}

function ech_spend_list(int $year): array {
    return ech_sb_select('ech_marketing_spend', 'select=*&spent_on=gte.' . $year . '-01-01&spent_on=lte.' . $year . '-12-31&order=spent_on.desc&limit=1000');
}

function ech_spend_delete(int $id): void {
    ech_sb_delete('ech_marketing_spend', 'id=eq.' . $id);
}

function ech_goals_for_year(int $year): array {
    return ech_sb_select('ech_goals', 'select=*&period=like.' . $year . '*&order=period.asc');
}

function ech_goal_set(string $period, int $revenuePesewas, ?int $clientsTarget): array {
    if (!preg_match('/^\d{4}(-(0[1-9]|1[0-2]))?$/', $period)) {
        throw new InvalidArgumentException('Invalid goal period.');
    }
    $res = ech_sb_insert('ech_goals', [
        'period' => $period,
        'revenue_target_pesewas' => max(0, $revenuePesewas),
        'clients_target' => $clientsTarget,
        'updated_at' => gmdate('c'),
    ], ['onConflict' => 'period', 'merge' => true]);
    return $res[0] ?? [];
}

function ech_goal_delete(string $period): void {
    if (preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $period)) {
        ech_sb_delete('ech_goals', 'period=eq.' . $period);
    }
}

function ech_growth_stats(int $year): array {
    $data = ech_sb_rpc('ech_growth_stats', ['p_year' => $year]);
    return is_array($data) ? $data : [];
}

// ── Portal tokens (set / reset password links) ───────────────────────────

function ech_portal_token_create(int $clientId, int $ttlSeconds): string {
    $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    ech_sb_insert('ech_portal_tokens', [
        'token_hash' => hash('sha256', $token),
        'client_id' => $clientId,
        'purpose' => 'set_password',
        'expires_at' => gmdate('c', time() + $ttlSeconds),
    ]);
    return $token;
}

/** Validate a token without consuming it. Returns the client row or null. */
function ech_portal_token_peek(string $token): ?array {
    if (!preg_match('/^[A-Za-z0-9_-]{40,60}$/', $token)) {
        return null;
    }
    $rows = ech_sb_select('ech_portal_tokens', 'select=*&token_hash=eq.' . hash('sha256', $token) . '&limit=1');
    $t = $rows[0] ?? null;
    if (!$t || !empty($t['used_at']) || strtotime((string) $t['expires_at']) < time()) {
        return null;
    }
    return ech_client_get((int) $t['client_id']);
}

/** Atomically mark a token used; true only for the first caller. */
function ech_portal_token_consume(string $token): bool {
    $rows = ech_sb_update(
        'ech_portal_tokens',
        'token_hash=eq.' . hash('sha256', $token) . '&used_at=is.null&expires_at=gt.' . rawurlencode(gmdate('c')),
        ['used_at' => gmdate('c')]
    );
    return count($rows) === 1;
}

/** Email a set-password link. $kind: 'invite' (7 days) or 'reset' (1 hour). */
function ech_portal_send_password_link(array $client, string $kind): bool {
    $ttl = $kind === 'invite' ? 7 * 86400 : 3600;
    $token = ech_portal_token_create((int) $client['id'], $ttl);
    $base = rtrim((string) (ech_runtime_secret('PUBLIC_APP_BASE_URL') ?: 'https://elevatecareerhub.com'), '/');
    $link = $base . '/portal/#token=' . rawurlencode($token);
    $name = trim((string) $client['name']) !== '' ? (string) $client['name'] : 'there';
    $subject = $kind === 'invite' ? 'Your Elevate client portal is ready' : 'Reset your Elevate portal password';
    $html = '<p>Hi ' . ech_esc($name) . ',</p>'
        . ($kind === 'invite'
            ? '<p>Your Elevate Career Hub client portal is ready. Track the progress of your work, download your documents and follow your applications in one place.</p>'
            : '<p>We received a request to reset your client portal password.</p>')
        . '<p><a href="' . ech_esc($link) . '" style="display:inline-block;background:#0077B6;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">'
        . ($kind === 'invite' ? 'Set up my portal' : 'Choose a new password') . '</a></p>'
        . '<p>This link works once and expires in ' . ($kind === 'invite' ? '7 days' : '1 hour') . '. You can also sign in with Google using this email address.</p>'
        . ($kind === 'reset' ? '<p>If you did not ask for this, you can ignore this email.</p>' : '')
        . '<p>Elevate Career Hub</p>';
    $key = ech_runtime_secret('TOSEND_API_KEY');
    if ($key === '') {
        error_log('[portal] TOSEND_API_KEY missing, would email ' . $kind . ' link to ' . $client['email'] . ': ' . $link);
        return false;
    }
    $from = ech_parse_from((string) (ech_runtime_secret('MAIL_FROM') ?: 'Elevate Career Hub <noreply@elevatecareerhub.com>'));
    ech_tosend_send($key, $from, [['email' => (string) $client['email']]], $subject, $html);
    return true;
}

// ── Endpoint helpers ─────────────────────────────────────────────────────

function ech_request_json(): array {
    $raw = file_get_contents('php://input');
    $body = is_string($raw) ? json_decode($raw, true) : null;
    if (!is_array($body)) {
        ech_json(['ok' => false, 'message' => 'Invalid request body.'], 400);
    }
    return $body;
}

/** Run an endpoint action, mapping domain errors to 400 and outages to 503. */
function ech_ops_run(string $tag, callable $fn): void {
    try {
        $fn();
    } catch (InvalidArgumentException $e) {
        ech_json(['ok' => false, 'message' => $e->getMessage()], 400);
    } catch (Throwable $e) {
        error_log('[' . $tag . '] failed: ' . $e->getMessage());
        ech_json(['ok' => false, 'message' => 'The database is unreachable right now. Try again shortly.'], 503);
    }
}

/**
 * Staff may only touch clients they have work assigned for. Founders and
 * partners see everything. Exits 403 on a miss.
 */
function ech_require_client_access(array $user, int $clientId): void {
    if (ech_admin_role_sees_finance((string) ($user['role'] ?? ''))) {
        return;
    }
    if (!in_array($clientId, ech_staff_client_ids((int) ($user['id'] ?? 0)), true)) {
        ech_json(['ok' => false, 'message' => 'This client is not assigned to you.'], 403);
    }
}
