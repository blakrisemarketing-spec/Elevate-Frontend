<?php
/**
 * Portal: Sign in with Google (OAuth 2.0 authorization-code flow, server side).
 *   GET ?start=1          -> redirect to Google's consent screen
 *   GET ?code=&state=     -> Google redirects back here; we exchange the code,
 *                            validate the ID token, match the client and sign in
 * A Google account signs in only if its VERIFIED email matches a client record
 * (someone who has bought from Elevate) or it was linked before (google_sub).
 *
 * Env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, PUBLIC_APP_BASE_URL.
 * Authorized redirect URI in Google Cloud: <PUBLIC_APP_BASE_URL>/api/portal-google.php
 */
declare(strict_types=1);

require __DIR__ . '/portal-auth.php';

const ECH_OAUTH_COOKIE = 'ech_portal_oauth';

function ech_portal_bounce(string $error = ''): void {
    header('Cache-Control: no-store');
    header('Location: /portal/' . ($error !== '' ? '?error=' . rawurlencode($error) : ''), true, 302);
    exit;
}

function ech_google_post(string $url, array $fields): ?array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($fields),
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 12,
    ]);
    $res = curl_exec($ch);
    $data = is_string($res) ? json_decode($res, true) : null;
    return is_array($data) ? $data : null;
}

function ech_google_get(string $url): ?array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 12]);
    $res = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $data = is_string($res) ? json_decode($res, true) : null;
    return ($status === 200 && is_array($data)) ? $data : null;
}

$clientId = ech_runtime_secret('GOOGLE_CLIENT_ID');
$clientSecret = ech_runtime_secret('GOOGLE_CLIENT_SECRET');
if ($clientId === '' || $clientSecret === '') {
    ech_portal_bounce('google_unavailable');
}
$redirectUri = ech_portal_base_url() . '/api/portal-google.php';

if (!empty($_GET['start'])) {
    $state = ech_portal_b64(random_bytes(24));
    $nonce = ech_portal_b64(random_bytes(24));
    ech_portal_set_cookie(ECH_OAUTH_COOKIE, ech_portal_sign(['s' => $state, 'n' => $nonce, 'exp' => time() + 600]), time() + 600);
    $url = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
        'client_id' => $clientId,
        'redirect_uri' => $redirectUri,
        'response_type' => 'code',
        'scope' => 'openid email profile',
        'state' => $state,
        'nonce' => $nonce,
        'prompt' => 'select_account',
    ]);
    header('Cache-Control: no-store');
    header('Location: ' . $url, true, 302);
    exit;
}

if (!empty($_GET['error'])) {
    ech_portal_bounce('google_cancelled');
}

$code = (string) ($_GET['code'] ?? '');
$state = (string) ($_GET['state'] ?? '');
$cookie = ech_portal_verify((string) ($_COOKIE[ECH_OAUTH_COOKIE] ?? ''));
ech_portal_set_cookie(ECH_OAUTH_COOKIE, '', time() - 3600);
if ($code === '' || !$cookie || !hash_equals((string) ($cookie['s'] ?? ''), $state)) {
    ech_portal_bounce('google_state');
}

$tokens = ech_google_post('https://oauth2.googleapis.com/token', [
    'code' => $code,
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'redirect_uri' => $redirectUri,
    'grant_type' => 'authorization_code',
]);
$idToken = is_array($tokens) ? (string) ($tokens['id_token'] ?? '') : '';
if ($idToken === '') {
    error_log('[portal-google] token exchange failed');
    ech_portal_bounce('google_failed');
}

// Validate the ID token with Google (signature, expiry) and check our claims.
$info = ech_google_get('https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode($idToken));
$valid = is_array($info)
    && hash_equals($clientId, (string) ($info['aud'] ?? ''))
    && in_array((string) ($info['iss'] ?? ''), ['accounts.google.com', 'https://accounts.google.com'], true)
    && (int) ($info['exp'] ?? 0) > time()
    && hash_equals((string) ($cookie['n'] ?? ''), (string) ($info['nonce'] ?? ''))
    && in_array((string) ($info['email_verified'] ?? ''), ['true', '1'], true)
    && (string) ($info['sub'] ?? '') !== '';
if (!$valid) {
    error_log('[portal-google] id token rejected');
    ech_portal_bounce('google_failed');
}

$sub = (string) $info['sub'];
$email = strtolower(trim((string) ($info['email'] ?? '')));

try {
    $client = ech_client_by_google_sub($sub);
    if (!$client) {
        $client = ech_client_by_email($email);
        if (!$client) {
            ech_portal_bounce('no_account');
        }
        if (!empty($client['google_sub']) && $client['google_sub'] !== $sub) {
            ech_portal_bounce('google_mismatch');
        }
        $patch = ['google_sub' => $sub, 'updated_at' => gmdate('c')];
        if (trim((string) $client['name']) === '' && !empty($info['name'])) {
            $patch['name'] = mb_substr((string) $info['name'], 0, 160);
        }
        ech_sb_update('ech_clients', 'id=eq.' . (int) $client['id'], $patch);
        $client = ech_client_get((int) $client['id']) ?? $client;
    }
    if (empty($client['portal_enabled'])) {
        ech_portal_bounce('disabled');
    }
    ech_portal_login($client);
} catch (Throwable $e) {
    error_log('[portal-google] sign-in failed: ' . $e->getMessage());
    ech_portal_bounce('unavailable');
}
ech_portal_bounce();
