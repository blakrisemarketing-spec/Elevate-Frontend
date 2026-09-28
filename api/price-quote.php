<?php
/**
 * Regional price quote endpoint.
 *
 * POST { ids: ["career-cv-early", ...], tz?: "Europe/London" }
 *   -> { ok, region, currency, items: { id: {chargePesewas, displayMinor, quote} } }
 *
 * The checkout island calls this once per page to (a) render prices in the
 * visitor's currency and (b) obtain the signed quote it must present at
 * verification. The region comes from the request IP; `tz` is only ever a
 * tiebreak when IP resolution returns nothing at all.
 *
 * On a stock Hostinger box with no Cloudflare and no GeoLite2 database
 * installed, IP resolution WILL return nothing and the timezone hint becomes
 * the only signal, which a visitor can trivially change. That is deliberately
 * tolerable: every unresolved path falls back to the GH base price, so the
 * worst a spoofer achieves is the Ghana price everyone already pays today.
 * Installing the database turns the uplift on; it is never a security gate.
 */
declare(strict_types=1);

header('Content-Type: application/json');
// Per-visitor, so it must never land in a shared cache.
header('Cache-Control: private, max-age=3600');

$configFile = __DIR__ . '/config.php';
if (is_file($configFile)) {
    require $configFile;
}
require_once __DIR__ . '/pricing.php';

function quote_respond($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    quote_respond(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$raw = file_get_contents('php://input');
$body = is_string($raw) ? json_decode($raw, true) : null;
if (!is_array($body)) {
    quote_respond(['ok' => false, 'message' => 'Invalid request body.'], 400);
}

$ids = is_array($body['ids'] ?? null) ? $body['ids'] : [];
$ids = array_values(array_unique(array_filter(
    array_map(fn($v) => trim((string) $v), $ids),
    fn($v) => $v !== ''
)));
if (count($ids) === 0) {
    quote_respond(['ok' => false, 'message' => 'No items requested.'], 400);
}
if (count($ids) > 60) {
    quote_respond(['ok' => false, 'message' => 'Too many items requested.'], 400);
}

// ── Resolve the region, IP first ─────────────────────────────────
$country = ech_resolve_country();
$region = ech_region_from_country($country);
$source = $country !== '' ? 'ip' : 'default';

if ($country === '') {
    $tzRegion = ech_region_from_timezone(trim((string) ($body['tz'] ?? '')));
    if ($tzRegion !== null) {
        $region = $tzRegion;
        $source = 'timezone';
    }
}

if (ech_pricing_secret() === '') {
    error_log('[price-quote] PRICING_SECRET is not set; checkout cannot proceed');
    quote_respond(['ok' => false, 'message' => 'Pricing is not configured yet.'], 503);
}

$catalog = ech_catalog();
$items = [];
foreach ($ids as $id) {
    if (!isset($catalog[$id]) || !is_array($catalog[$id])) {
        continue; // Unknown ids are skipped, not fatal: pages outlive the catalog.
    }
    $price = ech_price_for($catalog[$id], $region);
    if ($price['chargePesewas'] <= 0) {
        continue; // Free/unpriced items have no quote to give.
    }
    $items[$id] = [
        'chargePesewas' => $price['chargePesewas'],
        'displayMinor' => $price['displayMinor'],
        'quote' => ech_quote_sign($id, $region, $price['chargePesewas']),
    ];
}

quote_respond([
    'ok' => true,
    'region' => $region,
    'currency' => ECH_REGION_CURRENCY[$region] ?? 'GHS',
    'source' => $source,
    'items' => $items,
]);

/**
 * Coarse IANA-timezone -> region guess. Returns null when the hint tells us
 * nothing useful, so the caller keeps the GH default rather than guessing.
 */
function ech_region_from_timezone(string $tz): ?string {
    if ($tz === '' || strlen($tz) > 64 || !preg_match('~^[A-Za-z_]+/[A-Za-z_/+-]+$~', $tz)) {
        return null;
    }
    if ($tz === 'Africa/Accra') return 'GH';
    if ($tz === 'Africa/Lagos') return 'NG';
    if ($tz === 'Europe/London') return 'UK';
    if (str_starts_with($tz, 'Africa/')) return 'AF';
    if (str_starts_with($tz, 'Europe/')) return 'EU';
    if (str_starts_with($tz, 'America/') || str_starts_with($tz, 'Asia/')
        || str_starts_with($tz, 'Australia/') || str_starts_with($tz, 'Pacific/')) {
        return 'INTL';
    }
    return null;
}
