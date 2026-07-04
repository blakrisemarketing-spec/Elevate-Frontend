<?php
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/store.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}
$raw = file_get_contents('php://input');
$body = is_array($json = json_decode(is_string($raw) ? $raw : '', true)) ? $json : [];
$email = strtolower(trim((string) ($body['email'] ?? '')));
$password = (string) ($body['password'] ?? '');

if ($password === '') {
    ech_json(['ok' => false, 'message' => 'Password is required.'], 400);
}

// Per-user login: match the email to an active admin and verify the hash.
if ($email !== '') {
    try {
        $user = ech_admin_user_by_email($email);
    } catch (Throwable $e) {
        error_log('[admin-login] user lookup failed: ' . $e->getMessage());
        $user = null;
    }
    if (is_array($user) && !empty($user['active']) && password_verify($password, (string) ($user['password_hash'] ?? ''))) {
        ech_admin_establish_session(['id' => $user['id'], 'email' => $user['email'], 'name' => $user['name']]);
        ech_admin_user_touch_login((int) $user['id']);
        ech_json(['ok' => true, 'user' => ech_admin_user_public($user)]);
    }
}

// Break-glass: the shared ADMIN_PASSWORD still works (e.g. if the users table
// is empty or Supabase is unreachable). Identity shows as the master admin.
if (ech_admin_login($password)) {
    ech_json(['ok' => true, 'user' => ['email' => $email !== '' ? $email : 'master', 'name' => 'Master admin']]);
}

usleep(400000); // small throttle on failed attempts
ech_json(['ok' => false, 'message' => 'Invalid email or password.'], 401);
