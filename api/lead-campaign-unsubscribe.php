<?php
declare(strict_types=1);

ini_set('display_errors', '0');

$configFile = __DIR__ . '/config.php';
if (is_file($configFile)) {
    require $configFile;
}
require __DIR__ . '/lead-campaign.php';

$id = trim((string) ($_GET['id'] ?? ''));
$token = trim((string) ($_GET['token'] ?? ''));
$email = '';
try {
    $lead = $id !== '' ? ech_lead_by_uid($id) : null;
    $email = $lead ? strtolower((string) ($lead['email'] ?? '')) : '';
} catch (Throwable $e) {
    error_log('[unsubscribe] lead lookup failed: ' . $e->getMessage());
}

if ($id === '' || $email === '' || $token === '' || !ech_campaign_verify_unsubscribe_token($id, $email, $token)) {
    http_response_code(400);
    echo '<!doctype html><title>Unsubscribe failed</title><p>This unsubscribe link is invalid or expired.</p>';
    exit;
}

try {
    ech_suppress($email, 'unsubscribe');
} catch (Throwable $e) {
    error_log('[unsubscribe] suppress failed: ' . $e->getMessage());
    http_response_code(500);
    echo '<!doctype html><title>Unsubscribe failed</title><p>Something went wrong on our side. Please try the link again in a few minutes.</p>';
    exit;
}
echo '<!doctype html><title>Unsubscribed</title><main style="font-family:Arial,sans-serif;max-width:640px;margin:48px auto;padding:24px;"><h1>You are unsubscribed</h1><p>You will no longer receive Grad School Bootcamp follow-up emails from this sequence.</p><p>If you still need help, you can contact the Elevate team directly.</p></main>';
