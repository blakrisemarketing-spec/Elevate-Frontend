<?php
/**
 * Admin: the Work board (engagements = tracked client work).
 *   GET ?owner=me|unassigned|all|<id>&status=&q=&clientId=&includeClosed=1
 *       -> {items, summary, team, families}. Staff are always scoped to owner=me.
 *   POST {action:'create', clientId, title, family, ownerId?, dueOn?}   (founder/partner)
 *   POST {action:'update', id, status?, ownerId?, dueOn?, title?, clientMessage?}
 *   POST {action:'step', stepId, done}
 *   POST {action:'delete', id}                                          (founder/partner)
 *   POST {action:'sync', days}  -> create missing work for recent Paystack purchases (founder/partner)
 */
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/ops-store.php';
ech_admin_require();
$user = ech_admin_current_user() ?? [];
$senior = ech_admin_role_sees_finance((string) ($user['role'] ?? ''));
$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');

/** Staff may only act on work assigned to them. */
function ech_work_guard(array $user, bool $senior, int $engagementId): array {
    $eng = ech_engagement_get($engagementId);
    if (!$eng) {
        ech_json(['ok' => false, 'message' => 'Work item not found.'], 404);
    }
    if (!$senior && (int) ($eng['owner_id'] ?? 0) !== (int) ($user['id'] ?? -1)) {
        ech_json(['ok' => false, 'message' => 'This work item is not assigned to you.'], 403);
    }
    return $eng;
}

if ($method === 'GET') {
    ech_ops_run('admin-work', function () use ($user, $senior) {
        $owner = (string) ($_GET['owner'] ?? 'all');
        $f = [
            'status' => (string) ($_GET['status'] ?? ''),
            'q' => (string) ($_GET['q'] ?? ''),
            'clientId' => (int) ($_GET['clientId'] ?? 0),
            'includeClosed' => !empty($_GET['includeClosed']),
        ];
        if (!$senior || $owner === 'me') {
            $f['ownerId'] = (int) ($user['id'] ?? -1);
        } elseif ($owner === 'unassigned') {
            $f['ownerId'] = 0;
        } elseif (ctype_digit($owner)) {
            $f['ownerId'] = (int) $owner;
        }
        $team = array_values(array_map(fn($u) => [
            'id' => (int) $u['id'], 'name' => (string) $u['name'], 'email' => (string) $u['email'],
            'role' => ech_admin_normalize_role((string) ($u['role'] ?? '')),
        ], array_filter(ech_admin_users_list(), fn($u) => !empty($u['active']))));
        $families = [];
        foreach ((ech_fulfilment_config()['families'] ?? []) as $k => $fam) {
            $families[] = ['id' => $k, 'label' => (string) $fam['label']];
        }
        ech_json([
            'ok' => true,
            'items' => ech_engagements_query($f),
            'summary' => $senior ? ech_ops_summary() : null,
            'team' => $team,
            'families' => $families,
            'statuses' => ECH_ENGAGEMENT_STATUSES,
        ]);
    });
}

if ($method !== 'POST') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$body = ech_request_json();
$action = (string) ($body['action'] ?? '');

ech_ops_run('admin-work', function () use ($action, $body, $user, $senior) {
    if (in_array($action, ['create', 'delete', 'sync'], true) && !$senior) {
        ech_json(['ok' => false, 'message' => 'Only founders and partners can do that.'], 403);
    }
    switch ($action) {
        case 'create':
            $clientId = (int) ($body['clientId'] ?? 0);
            if (!ech_client_get($clientId)) {
                throw new InvalidArgumentException('Client not found.');
            }
            $title = trim((string) ($body['title'] ?? ''));
            if ($title === '') {
                throw new InvalidArgumentException('Give the work item a title.');
            }
            $family = (string) ($body['family'] ?? 'custom');
            if (!isset(ech_fulfilment_config()['families'][$family])) {
                $family = 'custom';
            }
            $owner = (int) ($body['ownerId'] ?? 0) > 0 ? (int) $body['ownerId'] : null;
            $eng = ech_engagement_create_manual($clientId, $title, $family, $owner, ech_date_or_null($body['dueOn'] ?? ''), $user);
            ech_json(['ok' => true, 'item' => ech_engagement_public(ech_engagement_get((int) $eng['id']) ?? $eng)]);
        case 'update':
            $id = (int) ($body['id'] ?? 0);
            ech_work_guard($user, $senior, $id);
            $patch = array_intersect_key($body, array_flip(['status', 'ownerId', 'dueOn', 'title', 'clientMessage']));
            if (!$senior) {
                unset($patch['ownerId']); // staff cannot reassign work
            }
            ech_json(['ok' => true, 'item' => ech_engagement_update($id, $patch, $user)]);
        case 'step':
            $stepId = (int) ($body['stepId'] ?? 0);
            $rows = ech_sb_select('ech_engagement_steps', 'select=engagement_id&id=eq.' . $stepId . '&limit=1');
            if (!$rows) {
                throw new InvalidArgumentException('Step not found.');
            }
            ech_work_guard($user, $senior, (int) $rows[0]['engagement_id']);
            ech_json(['ok' => true, 'item' => ech_step_set($stepId, !empty($body['done']), $user)]);
        case 'delete':
            ech_engagement_delete((int) ($body['id'] ?? 0));
            ech_json(['ok' => true]);
        case 'sync':
            $days = max(1, min(365, (int) ($body['days'] ?? 30)));
            $since = rawurlencode(gmdate('c', time() - $days * 86400));
            $purchases = ech_sb_select('ech_purchases', 'select=reference&created_at=gte.' . $since . '&order=created_at.asc&limit=1000');
            $created = 0;
            foreach ($purchases as $p) {
                $c = ech_purchase_link_and_fulfil((string) $p['reference']);
                $created += (int) ($c['__created'] ?? 0);
            }
            ech_json(['ok' => true, 'purchases' => count($purchases), 'created' => $created]);
    }
    ech_json(['ok' => false, 'message' => 'Unknown action.'], 400);
});
