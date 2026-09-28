<?php
/**
 * Paystack payment verification, Hostinger (LiteSpeed + PHP) endpoint.
 *
 * Deployed to /api/verify-payment.php. The browser sends a transaction
 * reference after the inline popup reports success; we DO NOT trust that.
 * We call Paystack's verify endpoint with the SECRET key (server-only) and
 * confirm: (1) Paystack says success, (2) the amount exactly matches the price
 * in the SIGNED QUOTE issued by api/price-quote.php, (3) currency is GHS.
 * Only then do we fulfil.
 *
 * Prices are regional (see api/pricing.php), so the expected amount can no
 * longer be read straight from the catalog: it depends on where the buyer is.
 * The region is decided server-side at quote time and sealed into an HMAC
 * token, and that token is the ONLY thing consulted here. There is
 * deliberately no fallback to the Ghana price for a missing or invalid quote,
 * since such a fallback would let anyone claim the cheapest region by simply
 * dropping the token. The quote is fetched before the Paystack popup opens, so
 * a quoting outage blocks checkout rather than stranding someone mid-payment.
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
require_once __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/store.php';
require_once __DIR__ . '/pricing.php';

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

$catalog = ech_catalog();
if (!isset($catalog[$serviceId]) || !is_array($catalog[$serviceId])) {
    respond(['ok' => false, 'message' => 'Unknown service.'], 400);
}
$item = $catalog[$serviceId];

// ── The signed quote is the sole source of the expected price ────
// It carries the PER-UNIT cedi charge for the region the server picked when
// the buyer loaded the page, so multi-session items multiply a signed unit
// instead of trusting a client-supplied total.
$quote = ech_quote_verify(trim((string) ($body['quote'] ?? '')));
if ($quote === null) {
    error_log(sprintf('[verify-payment] missing/invalid price quote ref=%s service=%s', $reference, $serviceId));
    respond(['ok' => false, 'message' => 'Your price quote expired. Please refresh the page and try again. If you were charged, contact us with your reference and we will resolve it.'], 400);
}
if ((string) $quote['sid'] !== $serviceId) {
    error_log(sprintf('[verify-payment] quote/service mismatch ref=%s quoted=%s claimed=%s', $reference, (string) $quote['sid'], $serviceId));
    respond(['ok' => false, 'message' => 'This price quote is for a different item.'], 400);
}
$region = (string) $quote['region'];
$unitAmount = (int) $quote['unit'];

// Per-unit items (e.g. the bootcamp drop-in) carry a `sessions` allow-list.
// The buyer ticks one or more; the expected amount is unit x (count ticked),
// and any submitted session not in the catalog list is rejected. This keeps
// the charged amount tamper-proof: you pay for exactly the sessions you claim.
$allowed = (isset($item['sessions']) && is_array($item['sessions'])) ? $item['sessions'] : [];
$sessions = is_array($body['sessions'] ?? null)
    ? array_values(array_unique(array_filter(array_map(fn($s) => trim((string) $s), $body['sessions']), fn($s) => $s !== '')))
    : [];
if (!empty($allowed)) {
    foreach ($sessions as $s) {
        if (!in_array($s, $allowed, true)) {
            respond(['ok' => false, 'message' => 'Unknown session selected.'], 400);
        }
    }
    $count = count($sessions);
    if ($count < 1) {
        respond(['ok' => false, 'message' => 'Please select at least one session.'], 400);
    }
    if ($count > count($allowed)) {
        respond(['ok' => false, 'message' => 'Too many sessions selected.'], 400);
    }
    $expectedAmount = $unitAmount * $count;
} else {
    $sessions = [];
    $expectedAmount = $unitAmount;
}

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
// What the buyer was shown, for the record. The billed amount stays GHS.
$regionPrice = ech_price_for($item, $region);
$unitCount = !empty($allowed) ? count($sessions) : 1;
$purchase = [
    'ts' => gmdate('c'),
    'reference' => $reference,
    'serviceId' => $serviceId,
    'itemName' => (string) ($item['name'] ?? ''),
    'type' => (string) ($item['type'] ?? ''),
    'amountPesewas' => $expectedAmount,
    'currency' => 'GHS',
    'region' => $region,
    'displayCurrency' => ECH_REGION_CURRENCY[$region] ?? 'GHS',
    'displayMinor' => $regionPrice['displayMinor'] * $unitCount,
    'buyerName' => $buyerName,
    'buyerEmail' => $buyerEmail,
    'sessions' => $sessions,
    'paystackStatus' => (string) ($txn['status'] ?? ''),
];
try {
    ech_purchase_insert($purchase); // idempotent on reference
    // Auto-convert: a verified purchase instantly moves the matching lead to
    // 'converted' in the CRM pipeline (best-effort; never blocks the buyer).
    if ($buyerEmail !== '') {
        try {
            ech_lead_mark_converted($buyerEmail);
        } catch (Throwable $e) {
            error_log('[verify-payment] auto-convert failed: ' . $e->getMessage());
        }
    }
} catch (Throwable $e) {
    // Never block a verified buyer on a ledger write: spool the record to the
    // deploy-surviving fallback dir and alert ops so it is recovered manually.
    error_log('[verify-payment] Supabase purchase insert failed, spooling: ' . $e->getMessage());
    ech_fallback_append('purchases-fallback.ndjson', $purchase);
    ech_ops_alert('Purchase DB write failed', 'Reference ' . $reference . ' spooled to fallback. ' . $e->getMessage());
}
try {
    send_fulfilment(
        $item, $reference, $buyerName, $buyerEmail, $sessions, $expectedAmount,
        $region, $regionPrice['displayMinor'] * $unitCount
    );
} catch (Throwable $e) {
    error_log('[verify-payment] fulfilment email failed (payment is still valid): ' . $e->getMessage());
}

respond([
    'ok' => true,
    'reference' => $reference,
    'item' => ['id' => $serviceId, 'name' => $item['name'] ?? '', 'type' => $item['type'] ?? ''],
    'deliverablePath' => $item['deliverablePath'] ?? null,
]);
