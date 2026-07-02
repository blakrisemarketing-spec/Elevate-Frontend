<?php
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}
$raw = file_get_contents('php://input');
$body = is_string($raw) ? json_decode($raw, true) : null;
$password = is_array($body) ? (string) ($body['password'] ?? '') : '';

if (ech_admin_login($password)) {
    ech_json(['ok' => true]);
}

$status = ech_admin_password() === '' ? 503 : 401;
ech_json(['ok' => false, 'message' => $status === 503 ? 'Admin password is not configured.' : 'Invalid password.'], $status);

