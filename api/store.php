<?php
/**
 * Domain data access for the lead system, on top of api/supabase.php.
 *
 * Naming convention: the database is snake_case; everything returned to the
 * rest of the PHP code (and the admin client) is mapped back to the legacy
 * camelCase shapes so the email templates and UI keep working unchanged.
 */
declare(strict_types=1);

require_once __DIR__ . '/supabase.php';

// ── Leads ────────────────────────────────────────────────────────────────

/** Same uid derivation as the old ech_campaign_enroll_match_lead(). */
function ech_lead_uid(string $email, string $phoneNormalized): string {
    return 'gsm-' . gmdate('YmdHis') . '-'
        . substr(hash('sha256', strtolower($email) . '|' . $phoneNormalized . '|' . random_bytes(8)), 0, 16);
}

/** Build a leads-table row from the quiz-lead record + resolved matches. */
function ech_lead_row_build(array $record, array $pathways, array $scholarships, string $uid): array {
    $email = strtolower(trim((string) ($record['email'] ?? '')));
    $suspectedBot = !empty($record['suspectedBot']);
    return [
        'uid' => $uid,
        'created_at' => (string) ($record['ts'] ?? gmdate('c')),
        'ip' => (string) ($record['ip'] ?? ''),
        'ua' => (string) ($record['ua'] ?? ''),
        'name' => (string) ($record['name'] ?? ''),
        'email' => $email,
        'phone' => (string) ($record['phone'] ?? ''),
        'phone_normalized' => (string) ($record['phoneNormalized'] ?? ''),
        'consent' => !empty($record['consent']),
        'linkedin' => (string) ($record['linkedin'] ?? ''),
        'portfolio' => (string) ($record['portfolio'] ?? ''),
        'answers' => is_array($record['answers'] ?? null) ? $record['answers'] : (object) [],
        'pathway_ids' => array_values((array) ($record['pathwayIds'] ?? [])),
        'scholarship_ids' => array_values((array) ($record['scholarshipIds'] ?? [])),
        'pathways' => array_slice($pathways, 0, 5),
        'scholarships' => array_slice($scholarships, 0, 8),
        'cv_file' => (string) ($record['cvFile'] ?? ''),
        'cv_meta' => is_array($record['cvMeta'] ?? null) && !empty($record['cvMeta']) ? $record['cvMeta'] : (object) [],
        'suspected_bot' => $suspectedBot,
        'campaign_enrolled' => !$suspectedBot && $email !== '',
        'source' => (string) ($record['source'] ?? 'grad_school_match'),
    ] + ech_lead_attribution_cols($record);
}

/** Map the client-supplied attribution bag onto lead columns (all optional). */
function ech_lead_attribution_cols(array $record): array {
    $a = is_array($record['attribution'] ?? null) ? $record['attribution'] : [];
    $out = [];
    foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'referrer', 'landing_path'] as $k) {
        $out[$k] = (string) ($a[$k] ?? '');
    }
    return $out;
}

/**
 * Insert a lead. Returns:
 *   ['ok' => true, 'uid' => ...]                on success
 *   ['ok' => false, 'duplicate' => true]        on unique-phone violation
 * Throws on transport failure (caller falls back to the NDJSON spool).
 */
function ech_lead_insert(array $row): array {
    $res = ech_sb_insert('ech_leads', $row);
    if (isset($res['__conflict'])) {
        return ['ok' => false, 'duplicate' => true, 'detail' => (string) $res['__conflict']];
    }
    return ['ok' => true, 'uid' => (string) ($res[0]['uid'] ?? $row['uid'])];
}

function ech_lead_phone_exists(string $phoneNormalized): bool {
    if ($phoneNormalized === '' || $phoneNormalized === '+') {
        return false;
    }
    $rows = ech_sb_select('ech_leads', 'select=id&phone_normalized=eq.' . rawurlencode($phoneNormalized) . '&limit=1');
    return !empty($rows);
}

function ech_lead_by_uid(string $uid): ?array {
    if ($uid === '') {
        return null;
    }
    $rows = ech_sb_select('ech_leads', 'select=*&uid=eq.' . rawurlencode($uid) . '&limit=1');
    return $rows[0] ?? null;
}

function ech_lead_set_status(string $uid, string $status): bool {
    if (!in_array($status, ['new', 'contacted', 'interested', 'converted', 'lost'], true)) {
        return false;
    }
    $rows = ech_sb_update('ech_leads', 'uid=eq.' . rawurlencode($uid), [
        'status' => $status,
        'status_updated_at' => gmdate('c'),
    ]);
    return !empty($rows);
}

/** Map a DB lead row to the shape the admin client + email templates expect. */
function ech_lead_row_to_legacy(array $row): array {
    return [
        'id' => (string) ($row['uid'] ?? ''),
        'uid' => (string) ($row['uid'] ?? ''),
        'ts' => (string) ($row['created_at'] ?? ''),
        'createdAt' => (string) ($row['created_at'] ?? ''),
        'name' => (string) ($row['name'] ?? ''),
        'email' => (string) ($row['email'] ?? ''),
        'phone' => (string) (($row['phone'] ?? '') !== '' ? $row['phone'] : ($row['phone_normalized'] ?? '')),
        'phoneNormalized' => (string) ($row['phone_normalized'] ?? ''),
        'consent' => !empty($row['consent']),
        'linkedin' => (string) ($row['linkedin'] ?? ''),
        'portfolio' => (string) ($row['portfolio'] ?? ''),
        'answers' => is_array($row['answers'] ?? null) ? $row['answers'] : [],
        'pathwayIds' => is_array($row['pathway_ids'] ?? null) ? $row['pathway_ids'] : [],
        'scholarshipIds' => is_array($row['scholarship_ids'] ?? null) ? $row['scholarship_ids'] : [],
        'pathways' => is_array($row['pathways'] ?? null) ? $row['pathways'] : [],
        'scholarships' => is_array($row['scholarships'] ?? null) ? $row['scholarships'] : [],
        'cvFile' => (string) ($row['cv_file'] ?? ''),
        'cvMeta' => is_array($row['cv_meta'] ?? null) ? $row['cv_meta'] : [],
        'cvUploaded' => ($row['cv_file'] ?? '') !== '',
        'suspectedBot' => !empty($row['suspected_bot']),
        'campaignEnrolled' => !empty($row['campaign_enrolled']),
        'source' => (string) ($row['source'] ?? 'grad_school_match'),
        'status' => (string) ($row['status'] ?? 'new'),
        'statusUpdatedAt' => (string) ($row['status_updated_at'] ?? ''),
        'utmSource' => (string) ($row['utm_source'] ?? ''),
        'utmMedium' => (string) ($row['utm_medium'] ?? ''),
        'utmCampaign' => (string) ($row['utm_campaign'] ?? ''),
        'referrer' => (string) ($row['referrer'] ?? ''),
    ];
}

/** Admin list: rows + total, with per-row meta. */
function ech_leads_query(string $q, string $status, int $limit, int $offset): array {
    $data = ech_sb_rpc('ech_leads_with_meta', [
        'q' => $q,
        'status_filter' => $status,
        'lim' => $limit,
        'off' => $offset,
    ]);
    $items = [];
    foreach ((array) ($data['items'] ?? []) as $row) {
        if (!is_array($row)) {
            continue;
        }
        $items[] = ech_lead_row_to_legacy($row) + [
            'notesCount' => (int) ($row['notes_count'] ?? 0),
            'lastStep' => (string) ($row['last_step'] ?? ''),
            'suppressed' => !empty($row['suppressed']),
            'converted' => !empty($row['converted']),
        ];
    }
    return ['total' => (int) ($data['total'] ?? 0), 'items' => $items];
}

// ── Bulk lead actions ────────────────────────────────────────────────────

/** Set status on many leads at once (by uid). Returns updated count. */
function ech_leads_bulk_status(array $uids, string $status): int {
    $uids = array_values(array_filter(array_map('strval', $uids)));
    if (empty($uids) || !in_array($status, ['new', 'contacted', 'interested', 'converted', 'lost'], true)) {
        return 0;
    }
    $list = implode(',', array_map(static fn($u) => '"' . str_replace(['"', ','], '', $u) . '"', $uids));
    $rows = ech_sb_update('ech_leads', 'uid=in.(' . $list . ')', [
        'status' => $status,
        'status_updated_at' => gmdate('c'),
    ]);
    return count($rows);
}

/** Resolve a set of uids to their {uid,name,email,suppressed?} for segment/bulk ops. */
function ech_leads_by_uids(array $uids): array {
    $uids = array_values(array_filter(array_map('strval', $uids)));
    if (empty($uids)) {
        return [];
    }
    $out = [];
    foreach (array_chunk($uids, 80) as $chunk) {
        $list = implode(',', array_map(static fn($u) => '"' . str_replace(['"', ','], '', $u) . '"', $chunk));
        foreach (ech_sb_select('ech_leads', 'select=uid,name,email&uid=in.(' . $list . ')') as $r) {
            $out[] = $r;
        }
    }
    return $out;
}

// ── Saved views (shared admin filter presets) ────────────────────────────

function ech_view_list(): array {
    return ech_sb_select('ech_saved_views', 'select=id,name,filter,created_at&order=name.asc');
}

function ech_view_upsert(string $name, array $filter): array {
    $rows = ech_sb_insert('ech_saved_views', [
        'name' => $name,
        'filter' => (object) $filter,
        'created_at' => gmdate('c'),
    ], ['onConflict' => 'name', 'merge' => true]);
    return $rows[0] ?? [];
}

function ech_view_delete(int $id): void {
    ech_sb_delete('ech_saved_views', 'id=eq.' . $id);
}

// ── Broadcast audit log ──────────────────────────────────────────────────

function ech_broadcast_insert(string $subject, string $bodyHtml, array $filter, int $recipients, int $sent, int $skipped, string $status): array {
    $rows = ech_sb_insert('ech_broadcasts', [
        'subject' => $subject,
        'body_html' => $bodyHtml,
        'filter' => (object) $filter,
        'recipient_count' => $recipients,
        'sent_count' => $sent,
        'skipped_count' => $skipped,
        'status' => $status,
        'created_at' => gmdate('c'),
    ]);
    return $rows[0] ?? [];
}

function ech_broadcasts_list(int $limit = 50): array {
    return ech_sb_select('ech_broadcasts', 'select=id,created_at,subject,recipient_count,sent_count,skipped_count,status&order=created_at.desc&limit=' . max(1, min(200, $limit)));
}

// ── Notes ────────────────────────────────────────────────────────────────

function ech_note_add(int $leadId, string $body): array {
    $rows = ech_sb_insert('ech_lead_notes', ['lead_id' => $leadId, 'body' => $body]);
    return $rows[0] ?? [];
}

function ech_note_list(int $leadId): array {
    return ech_sb_select('ech_lead_notes', 'select=id,body,created_at&lead_id=eq.' . $leadId . '&order=created_at.desc');
}

function ech_note_delete(int $leadId, int $noteId): void {
    ech_sb_delete('ech_lead_notes', 'id=eq.' . $noteId . '&lead_id=eq.' . $leadId);
}

// ── Campaign ─────────────────────────────────────────────────────────────

/** Leads eligible for nurture sends (skip logic runs in SQL). */
function ech_campaign_active_leads(): array {
    $rows = ech_sb_rpc('ech_campaign_due_leads');
    return is_array($rows) ? $rows : [];
}

/**
 * Record a send. The UNIQUE (lead_id, step) key is the idempotency guard;
 * returns true only when this call actually inserted the row.
 */
function ech_send_mark(int $leadId, string $step, string $status = 'sent'): bool {
    $res = ech_sb_insert('ech_campaign_sends', [
        'lead_id' => $leadId,
        'step' => $step,
        'status' => $status,
        'sent_at' => gmdate('c'),
    ], ['onConflict' => 'lead_id,step', 'ignoreDuplicates' => true]);
    return !isset($res['__conflict']) && !empty($res);
}

function ech_sends_for(int $leadId): array {
    return ech_sb_select('ech_campaign_sends', 'select=step,status,sent_at&lead_id=eq.' . $leadId . '&order=sent_at.asc');
}

/** Set of already-recorded steps for a batch of lead ids: [leadId => [step => true]]. */
function ech_sends_map(array $leadIds): array {
    if (empty($leadIds)) {
        return [];
    }
    $ids = implode(',', array_map('intval', $leadIds));
    $rows = ech_sb_select('ech_campaign_sends', 'select=lead_id,step&lead_id=in.(' . $ids . ')');
    $map = [];
    foreach ($rows as $r) {
        $map[(int) $r['lead_id']][(string) $r['step']] = true;
    }
    return $map;
}

function ech_sends_recent(int $limit = 50): array {
    return ech_sb_select(
        'ech_campaign_sends',
        'select=step,status,sent_at,ech_leads(uid,name,email)&order=sent_at.desc&limit=' . max(1, min(200, $limit))
    );
}

// ── Suppressions ─────────────────────────────────────────────────────────

function ech_suppress(string $email, string $reason): void {
    $email = strtolower(trim($email));
    if ($email === '') {
        return;
    }
    ech_sb_insert('ech_campaign_suppressions', [
        'email' => $email,
        'reason' => $reason,
        'created_at' => gmdate('c'),
    ], ['onConflict' => 'email', 'merge' => true]);
}

function ech_unsuppress(string $email): void {
    $email = strtolower(trim($email));
    if ($email !== '') {
        ech_sb_delete('ech_campaign_suppressions', 'email=eq.' . rawurlencode($email));
    }
}

function ech_suppression_for(string $email): ?array {
    $email = strtolower(trim($email));
    if ($email === '') {
        return null;
    }
    $rows = ech_sb_select('ech_campaign_suppressions', 'select=*&email=eq.' . rawurlencode($email) . '&limit=1');
    return $rows[0] ?? null;
}

function ech_suppression_list(): array {
    return ech_sb_select('ech_campaign_suppressions', 'select=*&order=created_at.desc&limit=500');
}

// ── Purchases ────────────────────────────────────────────────────────────

/** Idempotent on reference; safe to call for a re-verified transaction. */
function ech_purchase_insert(array $purchase): void {
    ech_sb_insert('ech_purchases', [
        'reference' => (string) ($purchase['reference'] ?? ''),
        'service_id' => (string) ($purchase['serviceId'] ?? ''),
        'item_name' => (string) ($purchase['itemName'] ?? ''),
        'type' => (string) ($purchase['type'] ?? ''),
        'amount_pesewas' => (int) ($purchase['amountPesewas'] ?? 0),
        'currency' => (string) ($purchase['currency'] ?? 'GHS'),
        'buyer_name' => (string) ($purchase['buyerName'] ?? ''),
        'buyer_email' => strtolower(trim((string) ($purchase['buyerEmail'] ?? ''))),
        'sessions' => array_values((array) ($purchase['sessions'] ?? [])),
        'paystack_status' => (string) ($purchase['paystackStatus'] ?? ''),
        'created_at' => (string) ($purchase['ts'] ?? gmdate('c')),
    ], ['onConflict' => 'reference', 'ignoreDuplicates' => true]);
}

function ech_purchase_row_to_legacy(array $row): array {
    return [
        'ts' => (string) ($row['created_at'] ?? ''),
        'reference' => (string) ($row['reference'] ?? ''),
        'serviceId' => (string) ($row['service_id'] ?? ''),
        'itemName' => (string) ($row['item_name'] ?? ''),
        'type' => (string) ($row['type'] ?? ''),
        'amountPesewas' => (int) ($row['amount_pesewas'] ?? 0),
        'currency' => (string) ($row['currency'] ?? 'GHS'),
        'buyerName' => (string) ($row['buyer_name'] ?? ''),
        'buyerEmail' => (string) ($row['buyer_email'] ?? ''),
        'sessions' => is_array($row['sessions'] ?? null) ? $row['sessions'] : [],
        'paystackStatus' => (string) ($row['paystack_status'] ?? ''),
    ];
}

function ech_purchases_query(int $limit, int $offset): array {
    $rows = ech_sb_select('ech_purchases', 'select=*&order=created_at.desc&limit=' . $limit . '&offset=' . $offset);
    if (count($rows) < $limit && $offset === 0) {
        $total = count($rows);
    } else {
        $countRows = ech_sb_select('ech_purchases', 'select=count()');
        $total = (int) ($countRows[0]['count'] ?? (count($rows) + $offset));
    }
    return ['total' => $total, 'items' => array_map('ech_purchase_row_to_legacy', $rows)];
}

function ech_purchases_for_email(string $email): array {
    $email = strtolower(trim($email));
    if ($email === '') {
        return [];
    }
    $rows = ech_sb_select('ech_purchases', 'select=*&buyer_email=eq.' . rawurlencode($email) . '&order=created_at.desc');
    return array_map('ech_purchase_row_to_legacy', $rows);
}

// ── Scholarships (runtime feed) ──────────────────────────────────────────

function ech_scholarship_row_to_legacy(array $row): array {
    return [
        'id' => (string) ($row['id'] ?? ''),
        'name' => (string) ($row['name'] ?? ''),
        'region' => (string) ($row['region'] ?? ''),
        'fundingType' => (string) ($row['funding_type'] ?? ''),
        'blurb' => (string) ($row['blurb'] ?? ''),
        'regions' => is_array($row['regions'] ?? null) ? $row['regions'] : [],
        'fields' => is_array($row['fields'] ?? null) ? $row['fields'] : [],
        'degrees' => is_array($row['degrees'] ?? null) ? $row['degrees'] : [],
        'minClass' => (string) ($row['min_class'] ?? '2:1'),
        'idealExp' => (string) ($row['ideal_exp'] ?? 'any'),
        'funding' => is_array($row['funding'] ?? null) ? $row['funding'] : [],
        'tags' => is_array($row['tags'] ?? null) ? $row['tags'] : [],
        'weight' => (int) ($row['weight'] ?? 50),
        'genderEligibility' => (string) ($row['gender_eligibility'] ?? 'any'),
        'active' => !empty($row['active']),
    ];
}

function ech_scholarships_all(): array {
    $rows = ech_sb_select('ech_scholarships', 'select=*&order=sort_order.asc');
    return array_map('ech_scholarship_row_to_legacy', $rows);
}

function ech_scholarships_active(): array {
    $rows = ech_sb_select('ech_scholarships', 'select=*&active=is.true&order=sort_order.asc');
    return array_map('ech_scholarship_row_to_legacy', $rows);
}

function ech_scholarships_updated_at(): ?string {
    $rows = ech_sb_select('ech_app_settings', 'select=v&k=eq.scholarships_updated_at&limit=1');
    $v = $rows[0]['v'] ?? null;
    return is_string($v) && $v !== '' ? $v : null;
}

function ech_scholarships_cache_path(): string {
    return ech_data_root() . '/cache/scholarships.json';
}

function ech_scholarships_cache_write(array $items, ?string $updatedAt): void {
    @file_put_contents(ech_scholarships_cache_path(), json_encode([
        'updatedAt' => $updatedAt ?? gmdate('c'),
        'count' => count($items),
        'scholarships' => $items,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

/** Atomic feed replace via the scholarships_replace RPC, then refresh cache. */
function ech_scholarships_replace(array $clean): array {
    $count = (int) ech_sb_rpc('ech_scholarships_replace', ['items' => $clean]);
    $updatedAt = ech_scholarships_updated_at() ?? gmdate('c');
    ech_scholarships_cache_write($clean, $updatedAt);
    return ['count' => $count, 'updatedAt' => $updatedAt];
}

/** Active scholarships with the deploy-surviving cache file as fallback. */
function ech_scholarships_active_cached(): array {
    try {
        $items = ech_scholarships_active();
        return ['scholarships' => $items, 'updatedAt' => ech_scholarships_updated_at()];
    } catch (Throwable $e) {
        error_log('[store] scholarships from Supabase failed, using cache: ' . $e->getMessage());
        $cache = json_decode((string) @file_get_contents(ech_scholarships_cache_path()), true);
        if (is_array($cache) && is_array($cache['scholarships'] ?? null)) {
            return ['scholarships' => $cache['scholarships'], 'updatedAt' => $cache['updatedAt'] ?? null];
        }
        return ['scholarships' => [], 'updatedAt' => null];
    }
}

// ── App settings ─────────────────────────────────────────────────────────

function ech_setting_get(string $key): ?string {
    $rows = ech_sb_select('ech_app_settings', 'select=v&k=eq.' . rawurlencode($key) . '&limit=1');
    $v = $rows[0]['v'] ?? null;
    return is_string($v) ? $v : null;
}

function ech_setting_set(string $key, string $value): void {
    ech_sb_insert('ech_app_settings', [
        'k' => $key,
        'v' => $value,
        'updated_at' => gmdate('c'),
    ], ['onConflict' => 'k', 'merge' => true]);
}

// ── Stats ────────────────────────────────────────────────────────────────

function ech_stats_overview(): array {
    $data = ech_sb_rpc('ech_stats_overview');
    return is_array($data) ? $data : [];
}

// ── Fallback spool drain (auto-recovery after an outage) ─────────────────

/**
 * Import any leads captured into the NDJSON fallback spool while Supabase was
 * unreachable. Idempotent: duplicate uid/phone rows are skipped. Called at the
 * start of every campaign cron run; renames the spool on success.
 */
function ech_drain_lead_fallback(): array {
    $path = ech_data_root() . '/fallback/leads-fallback.ndjson';
    if (!is_file($path)) {
        return ['imported' => 0, 'skipped' => 0];
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    $imported = 0;
    $skipped = 0;
    foreach ($lines as $line) {
        $rec = json_decode($line, true);
        if (!is_array($rec)) {
            $skipped++;
            continue;
        }
        $uid = (string) ($rec['uid'] ?? ech_lead_uid((string) ($rec['email'] ?? ''), (string) ($rec['phoneNormalized'] ?? '')));
        $row = ech_lead_row_build(
            $rec,
            is_array($rec['pathwaysResolved'] ?? null) ? $rec['pathwaysResolved'] : [],
            is_array($rec['scholarshipsResolved'] ?? null) ? $rec['scholarshipsResolved'] : [],
            $uid
        );
        $res = ech_sb_insert('ech_leads', $row, ['onConflict' => 'uid', 'ignoreDuplicates' => true]);
        if (isset($res['__conflict'])) {
            $skipped++; // duplicate phone from a resubmission during the outage
        } elseif (!empty($res)) {
            $imported++;
        } else {
            $skipped++; // uid already imported by an earlier drain
        }
    }
    @rename($path, $path . '.imported-' . gmdate('Ymd-His'));
    return ['imported' => $imported, 'skipped' => $skipped];
}
