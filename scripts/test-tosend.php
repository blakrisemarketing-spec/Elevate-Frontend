<?php
/**
 * Local test harness — sends a real fulfilment email pair via toSend using the
 * exact api/email.php code path. Run: php scripts/test-tosend.php
 * Not deployed. Reports the toSend API result (success or exact error).
 */
declare(strict_types=1);
require __DIR__ . '/../api/config.php';
require __DIR__ . '/../api/email.php';

$ops = getenv('OPS_EMAIL') ?: 'elevatewithnll@gmail.com';
$item = ['name' => '[TEST] Curriculum Vitae (CV)', 'amountPesewas' => 35000, 'type' => 'service', 'deliverablePath' => null];

echo "TOSEND_API_KEY set: " . (getenv('TOSEND_API_KEY') ? 'yes' : 'NO') . "\n";
echo "MAIL_FROM: " . (getenv('MAIL_FROM') ?: '(default)') . "\n";
echo "Sending team + buyer emails to: $ops\n";

try {
    send_fulfilment($item, 'TEST_REF_LOCAL_123', 'Local Tester', $ops);
    echo "RESULT: send_fulfilment completed without throwing (toSend accepted the requests).\n";
} catch (Throwable $e) {
    echo "RESULT: ERROR — " . $e->getMessage() . "\n";
}
