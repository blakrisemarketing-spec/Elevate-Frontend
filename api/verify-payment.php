<?php
/**
 * Paystack payment verification, Hostinger (LiteSpeed + PHP) endpoint.
 *
 * Deployed to /api/verify-payment.php. The browser sends a transaction
 * reference after the inline popup reports success; we DO NOT trust that.
 * We call Paystack's verify endpoint with the SECRET key (server-only) and
 * confirm: (1) Paystack says success, (2) the amount exactly matches the
 * server-side catalog price, (3) currency is GHS. Only then do we fulfil.
 *
 * Secrets are read from the environment (set them in hPanel, or in an
 * untracked api/config.php that putenv()s them, see .env.example):
 *   PAYSTACK_SECRET_KEY (required)
 *   TOSEND_API_KEY, OPS_EMAIL, MAIL_FROM, PUBLIC_APP_BASE_URL (fulfilment)
 *
 * The price table is api/catalog.json, generated at build from
 * src/checkout/catalog.ts so there is a single source of truth.
 */
declare(strict_types=1);

header('Content-Type: application/json');
header('Cache-Control: no-store');

// Optional untracked config file may putenv() the secrets on the server.
$configFile = __DIR__ . '/config.php';
if (is_file($configFile)) {
    require $configFile;
}
require __DIR__ . '/email.php';

function respond($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    respond(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$secret = getenv('PAYSTACK_SECRET_KEY') ?: '';
if ($secret === '') {
    error_log('[verify-payment] PAYSTACK_SECRET_KEY is not set');
    respond(['ok' => false, 'message' => 'Payments are not configured yet.'], 503);
}

$raw = file_get_contents('php://input');
$body = is_string($raw) ? json_decode($raw, true) : null;
if (!is_array($body)) {
    respond(['ok' => false, 'message' => 'Invalid request body.'], 400);
}

$reference = trim((string) ($body['reference'] ?? ''));
$serviceId = trim((string) ($body['serviceId'] ?? ''));
if ($reference === '' || $serviceId === '') {
    respond(['ok' => false, 'message' => 'Missing payment reference or service.'], 400);
}

$catalogPath = __DIR__ . '/catalog.json';
$catalog = is_file($catalogPath) ? json_decode((string) file_get_contents($catalogPath), true) : null;
if (!is_array($catalog) || !isset($catalog[$serviceId]) || !is_array($catalog[$serviceId])) {
    respond(['ok' => false, 'message' => 'Unknown service.'], 400);
}
$item = $catalog[$serviceId];
$expectedAmount = (int) ($item['amountPesewas'] ?? -1);

// ── Verify with Paystack (secret key, server-side only) ──────────
$ch = curl_init('https://api.paystack.co/transaction/verify/' . rawurlencode($reference));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $secret],
    CURLOPT_TIMEOUT => 20,
]);
$res = curl_exec($ch);
$curlErr = curl_error($ch);

if ($res === false) {
    error_log('[verify-payment] Paystack verify call failed: ' . $curlErr);
    respond(['ok' => false, 'message' => 'Could not reach Paystack to verify. Please try again.'], 502);
}

$verify = json_decode((string) $res, true);
$txn = is_array($verify) ? ($verify['data'] ?? null) : null;
$apiOk = is_array($verify) && (($verify['status'] ?? false) === true);
$paidOk = is_array($txn) && (($txn['status'] ?? '') === 'success');
$amountOk = is_array($txn) && ((int) ($txn['amount'] ?? -1) === $expectedAmount);
$currencyOk = is_array($txn) && (($txn['currency'] ?? 'GHS') === 'GHS');

if (!$apiOk || !$paidOk || !$amountOk || !$currencyOk) {
    error_log(sprintf(
        '[verify-payment] rejected ref=%s service=%s api=%d paid=%d amount=%d currency=%d reported=%s expected=%d',
        $reference, $serviceId, $apiOk ? 1 : 0, $paidOk ? 1 : 0, $amountOk ? 1 : 0, $currencyOk ? 1 : 0,
        (string) (is_array($txn) ? ($txn['amount'] ?? '?') : '?'), $expectedAmount
    ));
    respond(['ok' => false, 'message' => 'We could not verify this payment. If you were charged, contact us with your reference and we will resolve it.'], 402);
}

// ── Fulfilment (best-effort; never block the buyer's confirmation) ─
$buyerEmail = trim((string) ($body['email'] ?? (is_array($txn) ? ($txn['customer']['email'] ?? '') : '')));
$buyerName = trim((string) ($body['name'] ?? ''));
try {
    send_fulfilment($item, $reference, $buyerName, $buyerEmail);
} catch (Throwable $e) {
    error_log('[verify-payment] fulfilment email failed (payment is still valid): ' . $e->getMessage());
}

respond([
    'ok' => true,
    'reference' => $reference,
    'item' => ['id' => $serviceId, 'name' => $item['name'] ?? '', 'type' => $item['type'] ?? ''],
    'deliverablePath' => $item['deliverablePath'] ?? null,
]);
