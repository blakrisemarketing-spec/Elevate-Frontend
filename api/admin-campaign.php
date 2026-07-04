<?php
/**
 * Admin: campaign visibility + controls.
 *
 *   GET                                  -> suppression list + recent sends
 *   POST {action: 'suppress', email}     -> pause all sends to an email (reason 'admin')
 *   POST {action: 'resume', email}       -> remove a suppression (incl. unsubscribes;
 *                                           the UI warns before overriding those)
 */
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/store.php';
ech_admin_require();

$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    try {
        $recent = [];
        foreach (ech_sends_recent(50) as $s) {
            $lead = is_array($s['leads'] ?? null) ? $s['leads'] : [];
            $recent[] = [
                'step' => (string) ($s['step'] ?? ''),
                'status' => (string) ($s['status'] ?? ''),
                'sentAt' => (string) ($s['sent_at'] ?? ''),
                'uid' => (string) ($lead['uid'] ?? ''),
                'name' => (string) ($lead['name'] ?? ''),
                'email' => (string) ($lead['email'] ?? ''),
            ];
        }
        ech_json([
            'ok' => true,
            'suppressions' => array_map(static fn($r) => [
                'email' => (string) $r['email'],
                'reason' => (string) $r['reason'],
                'ts' => (string) $r['created_at'],
            ], ech_suppression_list()),
            'recentSends' => $recent,
        ]);
    } catch (Throwable $e) {
        error_log('[admin-campaign] read failed: ' . $e->getMessage());
        ech_json(['ok' => false, 'message' => 'Campaign database is unreachable. Try again shortly.'], 503);
    }
}

if ($method !== 'POST') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$raw = file_get_contents('php://input');
$body = is_string($raw) ? json_decode($raw, true) : null;
if (!is_array($body)) {
    ech_json(['ok' => false, 'message' => 'Invalid request body.'], 400);
}
$action = (string) ($body['action'] ?? '');
$email = strtolower(trim((string) ($body['email'] ?? '')));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    ech_json(['ok' => false, 'message' => 'Invalid email.'], 400);
}

try {
    if ($action === 'suppress') {
        ech_suppress($email, 'admin');
        ech_json(['ok' => true, 'suppressed' => true]);
    }
    if ($action === 'resume') {
        ech_unsuppress($email);
        ech_json(['ok' => true, 'suppressed' => false]);
    }
    ech_json(['ok' => false, 'message' => 'Unknown action.'], 400);
} catch (Throwable $e) {
    error_log('[admin-campaign] action failed: ' . $e->getMessage());
    ech_json(['ok' => false, 'message' => 'Campaign database is unreachable. Try again shortly.'], 503);
}
