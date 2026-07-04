<?php
/**
 * Grad School Match, lead capture, Hostinger (LiteSpeed + PHP) endpoint.
 *
 * Deployed to /api/quiz-lead.php. The browser submits the visitor's contact
 * details + quiz answers + matched program/scholarship ids (+ optional CV /
 * LinkedIn / portfolio) as multipart/form-data after the teaser. We:
 *   1. validate + sanitize input (honeypot, email, phone, optional URLs),
 *   2. store an optional CV in the private Supabase Storage `cvs` bucket,
 *   3. insert the lead into Supabase (campaign enrollment is columns on the
 *      same row; a unique index on phone_normalized enforces dedup),
 *   4. email the visitor their report + notify the team (best effort).
 *
 * If Supabase is unreachable the lead is NEVER dropped: it is appended to a
 * fallback NDJSON spool outside public_html (survives redeploys) and drained
 * automatically by the next campaign cron run. See api/supabase.php.
 *
 * Matching itself runs in the browser; this endpoint maps the posted ids to
 * names/blurbs via api/match-config.json (generated at build from
 * src/match/match-data.ts) so the email content cannot be spoofed by the client.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, TOSEND_API_KEY, OPS_EMAIL,
 * MAIL_FROM, PUBLIC_APP_BASE_URL. No payment secrets are used here.
 */
declare(strict_types=1);

// This endpoint returns JSON: never let a warning/notice/deprecation leak into
// the body (it would corrupt the response). They still go to the error log.
ini_set('display_errors', '0');

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

function respond($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    respond(['ok' => false, 'message' => 'Method not allowed'], 405);
}

// Honeypot: a real user never fills this. If it is filled (a bot, or an
// over-eager browser autofill), flag the lead but DO NOT drop it, so a false
// positive is never lost. We store it and skip the email further down.
$suspectedBot = trim((string) ($_POST['company'] ?? '')) !== '';

$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(['ok' => false, 'message' => 'Please provide your name and a valid email.'], 400);
}
$name = mb_substr($name, 0, 120);
$email = mb_substr($email, 0, 200);
$phoneClean = preg_replace('/[^\d+]/', '', (string) ($_POST['phone'] ?? ''));
$phone = mb_substr(is_string($phoneClean) ? $phoneClean : '', 0, 20);
$phoneNormalized = ech_normalize_phone((string) ($_POST['phone'] ?? ''));
if (strlen(preg_replace('/\D+/', '', $phoneNormalized) ?: '') < 8) {
    respond(['ok' => false, 'message' => 'Please provide a valid WhatsApp number.'], 400);
}
$consent = ((string) ($_POST['consent'] ?? '')) === 'yes';
$linkedin = filter_var(trim((string) ($_POST['linkedin'] ?? '')), FILTER_VALIDATE_URL) ?: '';
$portfolio = filter_var(trim((string) ($_POST['portfolio'] ?? '')), FILTER_VALIDATE_URL) ?: '';

// Attribution (first-touch, from the client). Bounded + sanitized; never fatal.
$attribution = [];
foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'referrer', 'landing_path'] as $ak) {
    $av = trim((string) ($_POST[$ak] ?? ''));
    if ($av !== '') {
        $attribution[$ak] = mb_substr($av, 0, ($ak === 'referrer') ? 500 : 300);
    }
}

$answers = json_decode((string) ($_POST['answers'] ?? '{}'), true);
if (!is_array($answers)) {
    $answers = [];
}
// Bound the answer payload so a hostile client cannot bloat the store.
$answers = array_slice($answers, 0, 40, true);

const ECH_DUPLICATE_PHONE_MESSAGE = 'This WhatsApp number has already been used for a match report. Please contact the Elevate team if you need help accessing your report.';

// Early dedup check (the unique index on phone_normalized is the race-safe
// backstop at insert time). If Supabase is down we skip the check rather than
// reject the visitor; the fallback drain dedupes on recovery.
try {
    if (ech_lead_phone_exists($phoneNormalized)) {
        respond(['ok' => false, 'message' => ECH_DUPLICATE_PHONE_MESSAGE], 409);
    }
} catch (Throwable $e) {
    error_log('[quiz-lead] phone dedup check unavailable: ' . $e->getMessage());
}

$pathwayIds = array_values(array_filter(array_map('trim', explode(',', (string) ($_POST['pathwayIds'] ?? '')))));
$scholarshipIds = array_values(array_filter(array_map('trim', explode(',', (string) ($_POST['scholarshipIds'] ?? '')))));
// Tiers run parallel to the id lists (strong | stretch), used to group the report.
$pathwayTiers = array_map('trim', explode(',', (string) ($_POST['pathwayTiers'] ?? '')));
$scholarshipTiers = array_map('trim', explode(',', (string) ($_POST['scholarshipTiers'] ?? '')));
$tierAt = static fn(array $tiers, int $i): string => (($tiers[$i] ?? '') === 'strong') ? 'strong' : 'stretch';

// Resolve ids -> {name, blurb} from the build-emitted config.
$cfgPath = __DIR__ . '/match-config.json';
$cfg = is_file($cfgPath) ? json_decode((string) file_get_contents($cfgPath), true) : null;
$pathwayMap = [];
$scholMap = [];
if (is_array($cfg)) {
    foreach (($cfg['pathways'] ?? []) as $p) {
        if (isset($p['id'])) {
            $pathwayMap[$p['id']] = $p;
        }
    }
    foreach (($cfg['scholarships'] ?? []) as $s) {
        if (isset($s['id'])) {
            $scholMap[$s['id']] = $s;
        }
    }
}
// Admin-managed runtime feed (Supabase, cache-file fallback) overrides/extends
// the build-time scholarship config.
foreach (ech_scholarships_active_cached()['scholarships'] as $s) {
    if (is_array($s) && isset($s['id'])) {
        $scholMap[$s['id']] = [
            'id' => $s['id'],
            'name' => $s['name'] ?? '',
            'blurb' => $s['blurb'] ?? '',
            'region' => $s['region'] ?? '',
            'fundingType' => $s['fundingType'] ?? '',
        ];
    }
}
$pathways = [];
foreach ($pathwayIds as $i => $id) {
    if (isset($pathwayMap[$id])) {
        $pathways[] = $pathwayMap[$id] + ['tier' => $tierAt($pathwayTiers, $i)];
    }
}
$scholarships = [];
foreach ($scholarshipIds as $i => $id) {
    if (isset($scholMap[$id])) {
        $scholarships[] = $scholMap[$id] + ['tier' => $tierAt($scholarshipTiers, $i)];
    }
}

/**
 * Validate + store an optional CV upload. Security on a PHP host is critical:
 * extension allowlist, size cap, finfo MIME sniff, random server-side filename
 * (never the client's). The file goes to the private Supabase Storage `cvs`
 * bucket; if Storage is unreachable it lands in ech-data/cv/ outside
 * public_html (survives redeploys). A bad upload never fails the lead.
 */
function handle_cv_upload(array $file): array {
    $maxBytes = 5 * 1024 * 1024;
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return [];
    }
    if (($file['size'] ?? 0) <= 0 || $file['size'] > $maxBytes) {
        return [];
    }
    if (!is_uploaded_file((string) ($file['tmp_name'] ?? ''))) {
        return [];
    }
    $ext = strtolower(pathinfo((string) ($file['name'] ?? ''), PATHINFO_EXTENSION));
    if (!in_array($ext, ['pdf', 'doc', 'docx'], true)) {
        return [];
    }
    // finfo as defense-in-depth. Office formats report various container mimes
    // (zip/ole/octet-stream), so the allowlist is intentionally permissive; the
    // real guards are the extension allowlist + private, non-served storage.
    $allowedMime = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/octet-stream',
        'application/x-ole-storage',
        'application/CDFV2',
    ];
    $mime = '';
    if (function_exists('finfo_open')) {
        // Note: no finfo_close() (deprecated in PHP 8.5, freed automatically).
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo) {
            $mime = (string) finfo_file($finfo, (string) $file['tmp_name']);
            if ($mime !== '' && !in_array($mime, $allowedMime, true)) {
                return [];
            }
        }
    }
    $bytes = (string) @file_get_contents((string) $file['tmp_name']);
    if ($bytes === '') {
        return [];
    }
    $safe = 'cv-' . gmdate('Ymd') . '-' . bin2hex(random_bytes(8)) . '.' . $ext;
    $storedIn = '';
    if (ech_sb_ready() && ech_sb_storage_upload('ech-cvs', $safe, $bytes, $mime !== '' ? $mime : 'application/octet-stream')) {
        $storedIn = 'supabase';
    } else {
        $dest = ech_cv_dir() . '/' . $safe;
        if (@file_put_contents($dest, $bytes, LOCK_EX) === false) {
            return [];
        }
        @chmod($dest, 0600);
        $storedIn = 'local';
    }
    return [
        'stored' => $safe,
        'storedIn' => $storedIn,
        'originalName' => mb_substr((string) ($file['name'] ?? ''), 0, 180),
        'mime' => $mime !== '' ? $mime : 'application/octet-stream',
        'size' => (int) ($file['size'] ?? 0),
        'uploadedAt' => gmdate('c'),
    ];
}

$cvMeta = [];
if (!empty($_FILES['cv']) && is_array($_FILES['cv'])) {
    $cvMeta = handle_cv_upload($_FILES['cv']);
}
$cvStored = (string) ($cvMeta['stored'] ?? '');

// ── Persist the lead (Supabase; NDJSON fallback spool if unreachable) ──
$record = [
    'ts' => gmdate('c'),
    'ip' => (string) ($_SERVER['REMOTE_ADDR'] ?? ''),
    'ua' => mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 300),
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'phoneNormalized' => $phoneNormalized,
    'consent' => $consent,
    'linkedin' => $linkedin,
    'portfolio' => $portfolio,
    'answers' => $answers,
    'pathwayIds' => $pathwayIds,
    'scholarshipIds' => $scholarshipIds,
    'pathwayTiers' => array_map(static fn($i) => $tierAt($pathwayTiers, $i), array_keys($pathwayIds)),
    'scholarshipTiers' => array_map(static fn($i) => $tierAt($scholarshipTiers, $i), array_keys($scholarshipIds)),
    'cvFile' => $cvStored,
    'cvMeta' => $cvMeta,
    'suspectedBot' => $suspectedBot,
    'attribution' => $attribution,
];
$uid = ech_lead_uid($email, $phoneNormalized);
try {
    $result = ech_lead_insert(ech_lead_row_build($record, $pathways, $scholarships, $uid));
    if (!$result['ok'] && !empty($result['duplicate'])) {
        respond(['ok' => false, 'message' => ECH_DUPLICATE_PHONE_MESSAGE], 409);
    }
} catch (Throwable $e) {
    // Supabase unreachable: spool the lead OUTSIDE public_html so a redeploy
    // cannot wipe it, alert ops, and continue (emails still go out).
    error_log('[quiz-lead] Supabase insert failed, spooling to fallback: ' . $e->getMessage());
    ech_fallback_append('leads-fallback.ndjson', $record + [
        'uid' => $uid,
        'pathwaysResolved' => array_slice($pathways, 0, 5),
        'scholarshipsResolved' => array_slice($scholarships, 0, 8),
    ]);
    ech_ops_alert('Lead DB write failed', 'A quiz lead was spooled to the fallback file. ' . $e->getMessage());
}

// ── Emails (best effort, never blocks the lead). Skip for suspected bots so we
// do not email junk addresses, but the lead is already stored + flagged above. ──
if (!$suspectedBot) {
    try {
        send_match_emails($name, $email, $phone, $answers, $pathways, $scholarships, $linkedin, $portfolio, $cvStored, $cvMeta);
    } catch (Throwable $e) {
        error_log('[quiz-lead] email failed: ' . $e->getMessage());
    }
}

respond(['ok' => true]);
