<?php
/** Portal: email + password sign-in. POST {email, password}. */
declare(strict_types=1);

require __DIR__ . '/portal-auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}
ech_portal_require_same_origin();
$body = ech_request_json();
$email = strtolower(trim((string) ($body['email'] ?? '')));
$password = (string) ($body['password'] ?? '');

ech_ops_run('portal-login', function () use ($email, $password) {
    $client = $email !== '' ? ech_client_by_email($email) : null;
    $hash = (string) ($client['password_hash'] ?? '');
    if ($client && !empty($client['portal_enabled']) && $hash !== '' && password_verify($password, $hash)) {
        if (password_needs_rehash($hash, PASSWORD_DEFAULT)) {
            ech_sb_update('ech_clients', 'id=eq.' . (int) $client['id'], ['password_hash' => password_hash($password, PASSWORD_DEFAULT)]);
            $client = ech_client_get((int) $client['id']) ?? $client;
        }
        ech_portal_login($client);
        ech_json(['ok' => true]);
    }
    usleep(400000); // small throttle on failed attempts
    $msg = ($client && $hash === '')
        ? 'This account has no password yet. Use "Set or reset password" below, or sign in with Google.'
        : 'Email or password is incorrect.';
    ech_json(['ok' => false, 'message' => $msg], 401);
});
