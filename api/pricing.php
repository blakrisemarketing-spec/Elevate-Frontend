<?php
/**
 * Regional pricing: geo resolution, the region price table, and signed quotes.
 *
 * The same item costs different amounts in different regions (see
 * src/checkout/catalog.ts). Everything is still CHARGED in GHS, because this
 * is a Ghana-registered Paystack account and Paystack's collection currency is
 * fixed by merchant country. The regional number is a different cedi amount,
 * shown to the buyer converted into their own currency.
 *
 * ── Why quotes are signed ───────────────────────────────────────────
 * Once price depends on region, region becomes worth lying about. The browser
 * therefore never gets to say where it is. price-quote.php resolves the region
 * from the request IP, then returns an HMAC-signed token carrying the per-unit
 * cedi price. verify-payment.php recomputes the expected amount from that
 * token's signature alone, so the existing "you cannot under-pay" guarantee
 * survives regionalisation intact.
 *
 * Env:
 *   PRICING_SECRET  (required) HMAC key for quote tokens. Any long random
 *                   string; rotating it invalidates in-flight quotes only.
 *   ECH_GEOIP_DB    (optional) path to a MaxMind GeoLite2-Country .mmdb.
 */
declare(strict_types=1);

require_once __DIR__ . '/admin-auth.php'; // ech_runtime_secret()

/** Regions, in display order. GH is the base region and the fallback. */
const ECH_PRICE_REGIONS = ['GH', 'NG', 'AF', 'UK', 'EU', 'INTL'];

/** Display currency per region. The CHARGE currency is always GHS. */
const ECH_REGION_CURRENCY = [
    'GH' => 'GHS', 'NG' => 'NGN', 'AF' => 'USD',
    'UK' => 'GBP', 'EU' => 'EUR', 'INTL' => 'USD',
];

/** Display symbol and decimal places per region. Naira amounts show none. */
const ECH_REGION_SYMBOL = [
    'GH' => '₵', 'NG' => '₦', 'AF' => '$', 'UK' => '£', 'EU' => '€', 'INTL' => '$',
];
const ECH_REGION_DECIMALS = [
    'GH' => 2, 'NG' => 0, 'AF' => 2, 'UK' => 2, 'EU' => 2, 'INTL' => 2,
];

/** How long a quote stays valid. Long enough to fill in a card, no longer. */
const ECH_QUOTE_TTL = 7200; // 2 hours

/** EU/EEA + Switzerland, priced in euro. */
const ECH_EU_COUNTRIES = [
    'AT','BE','BG','CH','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU',
    'IE','IS','IT','LI','LT','LU','LV','MT','NL','NO','PL','PT','RO','SE','SI','SK',
];

/** Africa (ISO-3166 alpha-2). GH and NG are handled before this list. */
const ECH_AFRICA_COUNTRIES = [
    'AO','BF','BI','BJ','BW','CD','CF','CG','CI','CM','CV','DJ','DZ','EG','EH',
    'ER','ET','GA','GM','GN','GQ','GW','KE','KM','LR','LS','LY','MA','MG','ML',
    'MR','MU','MW','MZ','NA','NE','RW','SC','SD','SL','SN','SO','SS','ST','SZ',
    'TD','TG','TN','TZ','UG','ZA','ZM','ZW',
];

/**
 * Map an ISO country code to a pricing region.
 * Unknown or empty resolves to GH: an unresolved visitor is UNDER-charged,
 * never over-charged, which is the safe direction to fail.
 */
function ech_region_from_country(string $cc): string {
    $cc = strtoupper(trim($cc));
    if ($cc === '' || strlen($cc) !== 2) return 'GH';
    if ($cc === 'GH') return 'GH';
    if ($cc === 'NG') return 'NG';
    if ($cc === 'GB') return 'UK';
    if (in_array($cc, ECH_EU_COUNTRIES, true)) return 'EU';
    if (in_array($cc, ECH_AFRICA_COUNTRIES, true)) return 'AF';
    return 'INTL';
}

/** The client's real IP, preferring proxy headers we actually sit behind. */
function ech_client_ip(): string {
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP'] as $h) {
        $v = trim((string) ($_SERVER[$h] ?? ''));
        if ($v !== '' && filter_var($v, FILTER_VALIDATE_IP)) return $v;
    }
    // X-Forwarded-For is a list; the client is the FIRST entry.
    $xff = trim((string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''));
    if ($xff !== '') {
        $first = trim(explode(',', $xff)[0]);
        if (filter_var($first, FILTER_VALIDATE_IP)) return $first;
    }
    $remote = trim((string) ($_SERVER['REMOTE_ADDR'] ?? ''));
    return filter_var($remote, FILTER_VALIDATE_IP) ? $remote : '';
}

/**
 * Resolve the visitor's ISO country, or '' if we genuinely cannot tell.
 * Order: Cloudflare header -> mod_geoip -> bundled GeoLite2 database.
 */
function ech_resolve_country(): string {
    $cf = strtoupper(trim((string) ($_SERVER['HTTP_CF_IPCOUNTRY'] ?? '')));
    if ($cf !== '' && $cf !== 'XX' && $cf !== 'T1' && strlen($cf) === 2) return $cf;

    foreach (['GEOIP_COUNTRY_CODE', 'HTTP_GEOIP_COUNTRY_CODE'] as $k) {
        $v = strtoupper(trim((string) ($_SERVER[$k] ?? '')));
        if ($v !== '' && strlen($v) === 2) return $v;
    }

    return ech_geoip_lookup(ech_client_ip());
}

/**
 * MaxMind GeoLite2-Country lookup via the pure-PHP reader (no C extension, so
 * it works on Hostinger's stock PHP). Absent database or reader is not an
 * error: we return '' and the caller falls back to the GH base price.
 */
function ech_geoip_lookup(string $ip): string {
    if ($ip === '') return '';

    $dbPath = ech_runtime_secret('ECH_GEOIP_DB');
    if ($dbPath === '') $dbPath = __DIR__ . '/geo/GeoLite2-Country.mmdb';
    if (!is_file($dbPath)) return '';

    $readerPath = __DIR__ . '/vendor/autoload.php';
    if (!is_file($readerPath)) return '';

    try {
        require_once $readerPath;
        if (!class_exists('\\MaxMind\\Db\\Reader')) return '';
        $reader = new \MaxMind\Db\Reader($dbPath);
        $record = $reader->get($ip);
        $reader->close();
        $cc = is_array($record) ? ($record['country']['iso_code'] ?? '') : '';
        return is_string($cc) ? strtoupper($cc) : '';
    } catch (Throwable $e) {
        error_log('[pricing] geoip lookup failed: ' . $e->getMessage());
        return '';
    }
}

/** Load the build-generated price table (api/catalog.json). */
function ech_catalog(): array {
    static $cache = null;
    if ($cache !== null) return $cache;
    $path = __DIR__ . '/catalog.json';
    $data = is_file($path) ? json_decode((string) file_get_contents($path), true) : null;
    $cache = is_array($data) ? $data : [];
    return $cache;
}

/**
 * The price for a catalog item in a region, falling back to GH when that
 * region has no entry. Mirrors resolvePrice() in src/checkout/catalog.ts;
 * the fallback rule MUST stay identical on both sides or the client would
 * display one number and the server would expect another.
 */
function ech_price_for(array $item, string $region): array {
    $prices = is_array($item['prices'] ?? null) ? $item['prices'] : [];
    $base = is_array($prices['GH'] ?? null) ? $prices['GH'] : ['chargePesewas' => 0, 'displayMinor' => 0];
    $picked = is_array($prices[$region] ?? null) ? $prices[$region] : $base;
    return [
        'chargePesewas' => (int) ($picked['chargePesewas'] ?? 0),
        'displayMinor' => (int) ($picked['displayMinor'] ?? 0),
    ];
}

/**
 * Format a minor-unit amount in a region's DISPLAY currency, e.g. "$50".
 * Mirrors formatPrice() in src/checkout/catalog.ts. Trailing ".00" is dropped
 * so prices read as "$50" rather than "$50.00".
 */
function ech_format_price(int $minor, string $region): string {
    $symbol = ECH_REGION_SYMBOL[$region] ?? '₵';
    $decimals = ECH_REGION_DECIMALS[$region] ?? 2;
    $major = $minor / 100;
    $formatted = number_format($major, $decimals, '.', ',');
    if ($decimals > 0) {
        $formatted = rtrim(rtrim($formatted, '0'), '.');
    }
    return $symbol . $formatted;
}

function ech_pricing_secret(): string {
    return ech_runtime_secret('PRICING_SECRET');
}

/** URL-safe base64 without padding, so tokens survive JSON and query strings. */
function ech_b64u_encode(string $raw): string {
    return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
}

function ech_b64u_decode(string $enc): string {
    $pad = strlen($enc) % 4;
    if ($pad > 0) $enc .= str_repeat('=', 4 - $pad);
    return (string) base64_decode(strtr($enc, '-_', '+/'), true);
}

/**
 * Sign a price quote. The payload carries the PER-UNIT cedi charge, so
 * multi-session items multiply a signed unit rather than trusting a total.
 */
function ech_quote_sign(string $serviceId, string $region, int $unitPesewas): string {
    $secret = ech_pricing_secret();
    if ($secret === '') {
        throw new RuntimeException('PRICING_SECRET is not set');
    }
    $payload = ech_b64u_encode((string) json_encode([
        'sid' => $serviceId,
        'region' => $region,
        'unit' => $unitPesewas,
        'exp' => time() + ECH_QUOTE_TTL,
    ]));
    $sig = ech_b64u_encode(hash_hmac('sha256', $payload, $secret, true));
    return $payload . '.' . $sig;
}

/**
 * Verify a quote token. Returns the decoded payload, or null if the signature
 * is wrong, the token is malformed, or it has expired.
 */
function ech_quote_verify(string $token): ?array {
    $secret = ech_pricing_secret();
    if ($secret === '' || $token === '') return null;

    $parts = explode('.', $token);
    if (count($parts) !== 2) return null;
    [$payload, $sig] = $parts;

    $expected = ech_b64u_encode(hash_hmac('sha256', $payload, $secret, true));
    if (!hash_equals($expected, $sig)) return null;

    $data = json_decode(ech_b64u_decode($payload), true);
    if (!is_array($data)) return null;
    if ((int) ($data['exp'] ?? 0) < time()) return null;
    if (!in_array((string) ($data['region'] ?? ''), ECH_PRICE_REGIONS, true)) return null;
    if ((int) ($data['unit'] ?? 0) <= 0) return null;
    if (!is_string($data['sid'] ?? null) || $data['sid'] === '') return null;

    return $data;
}
