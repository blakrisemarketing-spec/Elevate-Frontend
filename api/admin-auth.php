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

function ech_runtime_secret(string $key): string {
    $value = getenv($key);
    if (is_string($value) && $value !== '') {
        return $value;
    }
    $envValue = $_ENV[$key] ?? null;
    if (is_string($envValue) && $envValue !== '') {
        return $envValue;
    }
    $serverValue = $_SERVER[$key] ?? null;
    if (is_string($serverValue) && $serverValue !== '') {
        return $serverValue;
    }
    if (defined($key)) {
        $constantValue = constant($key);
        if (is_scalar($constantValue) && (string) $constantValue !== '') {
            return (string) $constantValue;
        }
    }
    return '';
}

function ech_admin_password(): string {
    return ech_runtime_secret('ADMIN_PASSWORD');
}

function ech_admin_ttl(): int {
    $ttl = (int) (ech_runtime_secret('ADMIN_SESSION_TTL_SECONDS') ?: 86400);
    return $ttl > 0 ? $ttl : 86400;
}

function ech_admin_is_authenticated(): bool {
    ech_admin_session_start();
    $authed = !empty($_SESSION['ech_admin_authed']);
    $at = (int) ($_SESSION['ech_admin_at'] ?? 0);
    return $authed && $at > 0 && (time() - $at) <= ech_admin_ttl();
}

function ech_admin_require(): void {
    if (!ech_admin_is_authenticated()) {
        ech_json(['ok' => false, 'message' => 'Admin login required.'], 401);
    }
    $_SESSION['ech_admin_at'] = time();
    ech_admin_refresh_role();
}

/**
 * Re-read the signed-in user's role and active flag at most every 5 minutes,
 * so a demotion or deactivation takes effect without waiting for the session
 * to expire. Best-effort: a database blip keeps the cached role.
 */
function ech_admin_refresh_role(): void {
    $id = (int) ($_SESSION['ech_admin_user_id'] ?? 0);
    if ($id <= 0 || (time() - (int) ($_SESSION['ech_admin_role_at'] ?? 0)) < 300) {
        return;
    }
    if (!function_exists('ech_admin_user_get')) {
        require_once __DIR__ . '/store.php';
    }
    try {
        $row = ech_admin_user_get($id);
    } catch (Throwable $e) {
        return;
    }
    if (!$row || empty($row['active'])) {
        ech_admin_logout();
        ech_json(['ok' => false, 'message' => 'Admin login required.'], 401);
    }
    $_SESSION['ech_admin_role'] = ech_admin_normalize_role((string) ($row['role'] ?? ''));
    $_SESSION['ech_admin_role_at'] = time();
}

/** Establish an authenticated session for a resolved admin identity. */
function ech_admin_establish_session(array $user): void {
    ech_admin_session_start();
    session_regenerate_id(true);
    $_SESSION['ech_admin_authed'] = true;
    $_SESSION['ech_admin_at'] = time();
    $_SESSION['ech_admin_user_id'] = (int) ($user['id'] ?? 0);
    $_SESSION['ech_admin_email'] = (string) ($user['email'] ?? '');
    $_SESSION['ech_admin_name'] = (string) ($user['name'] ?? '');
    $_SESSION['ech_admin_role'] = ech_admin_normalize_role((string) ($user['role'] ?? ''));
    $_SESSION['ech_admin_role_at'] = time();
}

/** founder | partner | staff. Legacy 'admin' rows (pre-005) count as founder. */
function ech_admin_normalize_role(string $role): string {
    if ($role === 'admin' || $role === '') {
        return 'founder';
    }
    return in_array($role, ['founder', 'partner', 'staff'], true) ? $role : 'staff';
}

/** The signed-in admin's identity, or null when not authenticated. */
function ech_admin_current_user(): ?array {
    if (!ech_admin_is_authenticated()) {
        return null;
    }
    return [
        'id' => (int) ($_SESSION['ech_admin_user_id'] ?? 0),
        'email' => (string) ($_SESSION['ech_admin_email'] ?? ''),
        'name' => (string) ($_SESSION['ech_admin_name'] ?? ''),
        'role' => ech_admin_normalize_role((string) ($_SESSION['ech_admin_role'] ?? '')),
    ];
}

/** Can this role see revenue, spend and the growth dashboard? */
function ech_admin_role_sees_finance(string $role): bool {
    return in_array($role, ['founder', 'partner'], true);
}

/**
 * Require an authenticated admin whose role is in $roles. Returns the user.
 * Sessions created before roles existed carry no role and resolve to founder
 * (every pre-005 admin was a full admin).
 */
function ech_admin_require_role(array $roles): array {
    ech_admin_require();
    $user = ech_admin_current_user() ?? [];
    if (!in_array((string) ($user['role'] ?? ''), $roles, true)) {
        ech_json(['ok' => false, 'message' => 'Your role does not have access to this.'], 403);
    }
    return $user;
}

/** Break-glass login with the shared ADMIN_PASSWORD env var (no per-user row). */
function ech_admin_login(string $password): bool {
    $expected = ech_admin_password();
    if ($expected === '' || !hash_equals($expected, $password)) {
        return false;
    }
    ech_admin_establish_session(['id' => 0, 'email' => 'master', 'name' => 'Master admin', 'role' => 'founder']);
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
