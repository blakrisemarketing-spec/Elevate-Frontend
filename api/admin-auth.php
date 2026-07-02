<?php
/**
 * Shared admin auth helpers for the lightweight Hostinger PHP ops dashboard.
 */
declare(strict_types=1);

ini_set('display_errors', '0');

$configFile = __DIR__ . '/config.php';
if (is_file($configFile)) {
    require_once $configFile;
}

function ech_json($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function ech_admin_session_start(): void {
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_name('ech_admin');
    session_start();
}

function ech_admin_password(): string {
    return (string) (getenv('ADMIN_PASSWORD') ?: '');
}

function ech_admin_ttl(): int {
    $ttl = (int) (getenv('ADMIN_SESSION_TTL_SECONDS') ?: 86400);
    return $ttl > 0 ? $ttl : 86400;
}

function ech_admin_is_authenticated(): bool {
    ech_admin_session_start();
    $authed = !empty($_SESSION['ech_admin_authed']);
    $at = (int) ($_SESSION['ech_admin_at'] ?? 0);
    return $authed && $at > 0 && (time() - $at) <= ech_admin_ttl();
}

function ech_admin_require(): void {
    if (ech_admin_password() === '') {
        ech_json(['ok' => false, 'message' => 'Admin password is not configured.'], 503);
    }
    if (!ech_admin_is_authenticated()) {
        ech_json(['ok' => false, 'message' => 'Admin login required.'], 401);
    }
    $_SESSION['ech_admin_at'] = time();
}

function ech_admin_login(string $password): bool {
    $expected = ech_admin_password();
    if ($expected === '') {
        return false;
    }
    if (!hash_equals($expected, $password)) {
        return false;
    }
    ech_admin_session_start();
    session_regenerate_id(true);
    $_SESSION['ech_admin_authed'] = true;
    $_SESSION['ech_admin_at'] = time();
    return true;
}

function ech_admin_logout(): void {
    ech_admin_session_start();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'] ?? '', (bool) $p['secure'], (bool) $p['httponly']);
    }
    session_destroy();
}

function ech_private_data_dir(): string {
    $dir = __DIR__ . '/_data';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir;
}

function ech_normalize_phone(string $phone): string {
    $raw = trim($phone);
    $hasPlus = str_starts_with($raw, '+');
    $digits = preg_replace('/\D+/', '', $raw);
    if (!is_string($digits)) {
        $digits = '';
    }
    if ($hasPlus) {
        return '+' . ltrim($digits, '0');
    }
    if (str_starts_with($digits, '00')) {
        return '+' . ltrim(substr($digits, 2), '0');
    }
    if (str_starts_with($digits, '0')) {
        return '+233' . ltrim($digits, '0');
    }
    if (str_starts_with($digits, '233')) {
        return '+' . $digits;
    }
    return '+' . ltrim($digits, '0');
}

