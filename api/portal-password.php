<?php
/**
 * Portal: set / reset password via an emailed one-time link.
 *   POST {action:'request', email}        -> always ok (no account enumeration)
 *   POST {action:'check', token}          -> {ok, email, name} when the link is valid
 *   POST {action:'set', token, password}  -> sets the password and signs in
 */
declare(strict_types=1);

require __DIR__ . '/portal-auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}
ech_portal_require_same_origin();
$body = ech_request_json();
$action = (string) ($body['action'] ?? '');

ech_ops_run('portal-password', function () use ($action, $body) {
    if ($action === 'request') {
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $client = filter_var($email, FILTER_VALIDATE_EMAIL) ? ech_client_by_email($email) : null;
        if ($client && !empty($client['portal_enabled'])) {
            // Throttle: at most one live link per client per 2 minutes.
            $recent = ech_sb_select('ech_portal_tokens', 'select=created_at&client_id=eq.' . (int) $client['id'] . '&created_at=gte.' . rawurlencode(gmdate('c', time() - 120)) . '&limit=1');
            if (!$recent) {
                ech_portal_send_password_link($client, ((string) $client['password_hash']) === '' ? 'invite' : 'reset');
            }
        } else {
            usleep(300000);
        }
        ech_json(['ok' => true, 'message' => 'If that email has an Elevate account, a link is on its way. Check your inbox and spam folder.']);
    }

    $token = (string) ($body['token'] ?? '');
    $client = ech_portal_token_peek($token);
    if (!$client || empty($client['portal_enabled'])) {
        ech_json(['ok' => false, 'message' => 'This link has expired or was already used. Request a new one below.'], 400);
    }

    if ($action === 'check') {
        ech_json(['ok' => true, 'email' => (string) $client['email'], 'name' => (string) $client['name'], 'hasPassword' => ((string) $client['password_hash']) !== '']);
    }

    if ($action === 'set') {
        $password = (string) ($body['password'] ?? '');
        if ($err = ech_portal_password_ok($password)) {
            ech_json(['ok' => false, 'message' => $err], 400);
        }
        if (!ech_portal_token_consume($token)) {
            ech_json(['ok' => false, 'message' => 'This link has expired or was already used. Request a new one below.'], 400);
        }
        ech_sb_update('ech_clients', 'id=eq.' . (int) $client['id'], ['password_hash' => password_hash($password, PASSWORD_DEFAULT), 'updated_at' => gmdate('c')]);
        $fresh = ech_client_get((int) $client['id']) ?? $client;
        ech_activity_log(['actor' => 'client:' . (int) $client['id'], 'actor_name' => (string) $client['name'], 'client_id' => (int) $client['id'], 'kind' => 'portal', 'summary' => 'Portal password set']);
        ech_portal_login($fresh);
        ech_json(['ok' => true]);
    }

    ech_json(['ok' => false, 'message' => 'Unknown action.'], 400);
});
