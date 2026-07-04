<?php
/**
 * Admin: bulk lead actions.
 *   POST {action:'status', uids:[...], status}       -> set status on many leads
 *   POST {action:'suppress'|'unsuppress', uids:[...]} -> pause/resume nurture emails
 * Suppression resolves uids -> emails server-side so the client never has to.
 */
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/store.php';
ech_admin_require();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$raw = file_get_contents('php://input');
$body = is_string($raw) ? json_decode($raw, true) : null;
if (!is_array($body)) {
    ech_json(['ok' => false, 'message' => 'Invalid request body.'], 400);
}
$action = (string) ($body['action'] ?? '');
$uids = is_array($body['uids'] ?? null) ? array_values(array_filter(array_map('strval', $body['uids']))) : [];
if (empty($uids)) {
    ech_json(['ok' => false, 'message' => 'No leads selected.'], 400);
}
if (count($uids) > 1000) {
    ech_json(['ok' => false, 'message' => 'Too many leads selected (max 1000).'], 400);
}

try {
    if ($action === 'status') {
        $status = (string) ($body['status'] ?? '');
        $n = ech_leads_bulk_status($uids, $status);
        if ($n === 0) {
            ech_json(['ok' => false, 'message' => 'Nothing updated (check the status value).'], 400);
        }
        ech_json(['ok' => true, 'updated' => $n]);
    }

    if ($action === 'suppress' || $action === 'unsuppress') {
        $leads = ech_leads_by_uids($uids);
        $n = 0;
        foreach ($leads as $l) {
            $email = strtolower(trim((string) ($l['email'] ?? '')));
            if ($email === '') {
                continue;
            }
            if ($action === 'suppress') {
                ech_suppress($email, 'admin');
            } else {
                ech_unsuppress($email);
            }
            $n++;
        }
        ech_json(['ok' => true, 'affected' => $n]);
    }

    ech_json(['ok' => false, 'message' => 'Unknown action.'], 400);
} catch (Throwable $e) {
    error_log('[admin-leads-bulk] failed: ' . $e->getMessage());
    ech_json(['ok' => false, 'message' => 'Lead database is unreachable. Try again shortly.'], 503);
}
