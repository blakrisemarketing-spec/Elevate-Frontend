<?php
/**
 * Local test harness, sends a real fulfilment email pair via toSend using the
 * exact api/email.php code path. Run: php scripts/test-tosend.php
 * Not deployed. Reports the toSend API result (success or exact error).
 */
declare(strict_types=1);
require __DIR__ . '/../api/config.php';
require __DIR__ . '/../api/email.php';
require __DIR__ . '/../api/pricing.php'; // ech_format_price(), for the regional line

$ops = getenv('OPS_EMAIL') ?: 'hello@elevatecareerhub.com';
$item = ['name' => '[TEST] Curriculum Vitae (CV)', 'type' => 'service', 'deliverablePath' => null];

echo "TOSEND_API_KEY set: " . (getenv('TOSEND_API_KEY') ? 'yes' : 'NO') . "\n";
echo "MAIL_FROM: " . (getenv('MAIL_FROM') ?: '(default)') . "\n";
echo "Sending team + buyer emails to: $ops\n";

try {
    // US region, so the email exercises the "$50 (charged as ₵600)" wording
    // rather than only the plain Ghana path.
    send_fulfilment($item, 'TEST_REF_LOCAL_123', 'Local Tester', $ops, [], 60000, 'INTL', 5000);
    echo "RESULT: send_fulfilment completed without throwing (toSend accepted the requests).\n";
} catch (Throwable $e) {
    echo "RESULT: ERROR, " . $e->getMessage() . "\n";
}
