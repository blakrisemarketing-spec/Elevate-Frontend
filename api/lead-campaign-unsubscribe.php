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
foreach (ech_campaign_load_leads() as $lead) {
    if ((string) ($lead['id'] ?? '') === $id) {
        $email = strtolower((string) ($lead['email'] ?? ''));
        break;
    }
}

if ($id === '' || $email === '' || $token === '' || !ech_campaign_verify_unsubscribe_token($id, $email, $token)) {
    http_response_code(400);
    echo '<!doctype html><title>Unsubscribe failed</title><p>This unsubscribe link is invalid or expired.</p>';
    exit;
}

ech_campaign_suppress_email($email, 'unsubscribe');
echo '<!doctype html><title>Unsubscribed</title><main style="font-family:Arial,sans-serif;max-width:640px;margin:48px auto;padding:24px;"><h1>You are unsubscribed</h1><p>You will no longer receive Grad School Bootcamp follow-up emails from this sequence.</p><p>If you still need help, you can contact the Elevate team directly.</p></main>';
