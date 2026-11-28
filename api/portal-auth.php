<?php
/**
 * Client portal auth (separate from admin auth).
 *
 * Sessions are a stateless HMAC-signed cookie (`ech_portal`), not PHP
 * sessions: they survive Hostinger redeploys and session GC, and need no
 * table. The signature covers the client id, expiry and a credential
 * fingerprint, so changing the password (or unlinking Google) signs every
 * other device out.
 *
 * Every portal query is scoped by the client id taken from this cookie, never
 * from the request.
 *
 * Env: PORTAL_SESSION_SECRET (recommended; falls back to a key derived from
 * SUPABASE_SERVICE_KEY), GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
 * PUBLIC_APP_BASE_URL.
 */
declare(strict_types=1);

require_once __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/ops-store.php';

const ECH_PORTAL_COOKIE = 'ech_portal';
const ECH_PORTAL_TTL = 30 * 86400;

function ech_portal_secret(): string {
    $s = ech_runtime_secret('PORTAL_SESSION_SECRET');
    if ($s !== '') {
        return $s;
    }
    $k = ech_runtime_secret('SUPABASE_SERVICE_KEY');
    if ($k === '') {
        throw new RuntimeException('Portal is not configured.');
    }
    return hash('sha256', 'ech-portal-session|' . $k);
}

function ech_portal_b64(string $raw): string {
    return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
}

function ech_portal_unb64(string $s): string {
    return (string) base64_decode(strtr($s, '-_', '+/'), true);
}

/** Signed "payload.signature" token; payload is JSON. */
function ech_portal_sign(array $payload): string {
    $p = ech_portal_b64((string) json_encode($payload));
    return $p . '.' . ech_portal_b64(hash_hmac('sha256', $p, ech_portal_secret(), true));
}

function ech_portal_verify(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 2) {
        return null;
    }
    $expected = ech_portal_b64(hash_hmac('sha256', $parts[0], ech_portal_secret(), true));
    if (!hash_equals($expected, $parts[1])) {
        return null;
    }
    $data = json_decode(ech_portal_unb64($parts[0]), true);
    if (!is_array($data) || (int) ($data['exp'] ?? 0) < time()) {
        return null;
    }
    return $data;
}

function ech_portal_is_https(): bool {
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
}

function ech_portal_set_cookie(string $name, string $value, int $expires): void {
    setcookie($name, $value, [
        'expires' => $expires,
        'path' => '/',
        'secure' => ech_portal_is_https(),
        'httponly' => true,
        // Lax (not Strict) so the Google OAuth redirect back to us carries the
        // state cookie. POSTs are JSON-only + Origin-checked, so Lax is safe.
        'samesite' => 'Lax',
    ]);
}

/** Changes whenever the client's credentials change. */
function ech_portal_fingerprint(array $client): string {
    return substr(hash('sha256', (string) ($client['password_hash'] ?? '') . '|' . (string) ($client['google_sub'] ?? '')), 0, 16);
}

function ech_portal_login(array $client): void {
    $exp = time() + ECH_PORTAL_TTL;
    ech_portal_set_cookie(ECH_PORTAL_COOKIE, ech_portal_sign([
        'cid' => (int) $client['id'],
        'exp' => $exp,
        'fp' => ech_portal_fingerprint($client),
    ]), $exp);
    try {
        ech_sb_update('ech_clients', 'id=eq.' . (int) $client['id'], ['last_login_at' => gmdate('c')]);
    } catch (Throwable $e) {
        error_log('[portal] touch login failed: ' . $e->getMessage());
    }
    ech_activity_log(['actor' => 'client:' . (int) $client['id'], 'actor_name' => (string) $client['name'], 'client_id' => (int) $client['id'], 'kind' => 'portal_login', 'summary' => 'Signed in to the portal']);
}

function ech_portal_logout(): void {
    ech_portal_set_cookie(ECH_PORTAL_COOKIE, '', time() - 3600);
}

/** The signed-in client (fresh from the database), or null. */
function ech_portal_client(): ?array {
    $raw = $_COOKIE[ECH_PORTAL_COOKIE] ?? '';
    if (!is_string($raw) || $raw === '') {
        return null;
    }
    $data = ech_portal_verify($raw);
    if (!$data) {
        return null;
    }
    $client = ech_client_get((int) ($data['cid'] ?? 0));
    if (!$client || empty($client['portal_enabled']) || !hash_equals(ech_portal_fingerprint($client), (string) ($data['fp'] ?? ''))) {
        return null;
    }
    return $client;
}

function ech_portal_require(): array {
    try {
        $client = ech_portal_client();
    } catch (Throwable $e) {
        error_log('[portal] session check failed: ' . $e->getMessage());
        ech_json(['ok' => false, 'message' => 'The portal is unavailable right now. Try again shortly.'], 503);
    }
    if (!$client) {
        ech_json(['ok' => false, 'message' => 'Please sign in.'], 401);
    }
    return $client;
}

/**
 * Reject cross-site POSTs. Browsers always send Origin on fetch POSTs; a
 * missing header (curl, server-to-server) is allowed since it carries no
 * ambient cookies from a victim's browser.
 */
function ech_portal_require_same_origin(): void {
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin === '') {
        return;
    }
    $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
    $originHost = (string) parse_url($origin, PHP_URL_HOST);
    $port = parse_url($origin, PHP_URL_PORT);
    if ($port) {
        $originHost .= ':' . $port;
    }
    if ($host === '' || !hash_equals(strtolower($host), strtolower($originHost))) {
        ech_json(['ok' => false, 'message' => 'Cross-site request blocked.'], 403);
    }
}

function ech_portal_base_url(): string {
    $base = rtrim(ech_runtime_secret('PUBLIC_APP_BASE_URL'), '/');
    if ($base !== '') {
        return $base;
    }
    return (ech_portal_is_https() ? 'https://' : 'http://') . (string) ($_SERVER['HTTP_HOST'] ?? 'elevatecareerhub.com');
}

function ech_portal_password_ok(string $password): ?string {
    if (mb_strlen($password) < 8) {
        return 'Use at least 8 characters.';
    }
    if (mb_strlen($password) > 200) {
        return 'That password is too long.';
    }
    return null;
}
