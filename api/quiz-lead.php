<?php
/**
 * Grad School Match, lead capture, Hostinger (LiteSpeed + PHP) endpoint.
 *
 * Deployed to /api/quiz-lead.php. The browser submits the visitor's contact
 * details + quiz answers + matched program/scholarship ids (+ optional CV /
 * LinkedIn / portfolio) as multipart/form-data after the teaser. We:
 *   1. validate + sanitize input (honeypot, email, phone, optional URLs),
 *   2. securely store an optional CV upload outside the web-served tree,
 *   3. append the lead to api/_leads/leads-YYYY-MM.ndjson (flock'd),
 *   4. email the visitor their report + notify the team (best effort).
 *
 * Matching itself runs in the browser; this endpoint maps the posted ids to
 * names/blurbs via api/match-config.json (generated at build from
 * src/match/match-data.ts) so the email content cannot be spoofed by the client.
 *
 * Env (shared with the payment flow): TOSEND_API_KEY, OPS_EMAIL, MAIL_FROM,
 * PUBLIC_APP_BASE_URL. No payment secrets are used here.
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
require_once __DIR__ . '/lead-campaign.php';

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

$answers = json_decode((string) ($_POST['answers'] ?? '{}'), true);
if (!is_array($answers)) {
    $answers = [];
}
// Bound the answer payload so a hostile client cannot bloat the store.
$answers = array_slice($answers, 0, 40, true);

$leadsDir = __DIR__ . '/_leads';
$dataDir = ech_private_data_dir();

function phone_already_used(string $phone, string $leadsDir, string $dataDir): bool {
    $indexPath = $dataDir . '/phone-index.json';
    $index = is_file($indexPath) ? json_decode((string) file_get_contents($indexPath), true) : null;
    if (is_array($index) && isset($index[$phone])) {
        return true;
    }
    $rebuilt = [];
    foreach (glob($leadsDir . '/leads-*.ndjson') ?: [] as $file) {
        $fh = @fopen($file, 'rb');
        if (!$fh) {
            continue;
        }
        while (($line = fgets($fh)) !== false) {
            $rec = json_decode(trim($line), true);
            if (!is_array($rec)) {
                continue;
            }
            $p = (string) ($rec['phoneNormalized'] ?? $rec['phone'] ?? '');
            $norm = ech_normalize_phone($p);
            if ($norm !== '+') {
                $rebuilt[$norm] = true;
            }
        }
        fclose($fh);
    }
    if (!empty($rebuilt)) {
        @file_put_contents($indexPath, json_encode($rebuilt, JSON_PRETTY_PRINT), LOCK_EX);
    }
    return isset($rebuilt[$phone]);
}

function mark_phone_used(string $phone, string $dataDir): void {
    $indexPath = $dataDir . '/phone-index.json';
    $index = is_file($indexPath) ? json_decode((string) file_get_contents($indexPath), true) : null;
    if (!is_array($index)) {
        $index = [];
    }
    $index[$phone] = gmdate('c');
    @file_put_contents($indexPath, json_encode($index, JSON_PRETTY_PRINT), LOCK_EX);
}

if (phone_already_used($phoneNormalized, $leadsDir, $dataDir)) {
    respond(['ok' => false, 'message' => 'This WhatsApp number has already been used for a match report. Please contact the Elevate team if you need help accessing your report.'], 409);
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
$runtimeCfgPath = __DIR__ . '/_data/scholarships.json';
$runtimeCfg = is_file($runtimeCfgPath) ? json_decode((string) file_get_contents($runtimeCfgPath), true) : null;
if (is_array($runtimeCfg) && is_array($runtimeCfg['scholarships'] ?? null)) {
    foreach ($runtimeCfg['scholarships'] as $s) {
        if (is_array($s) && !empty($s['active']) && isset($s['id'])) {
            $scholMap[$s['id']] = [
                'id' => $s['id'],
                'name' => $s['name'] ?? '',
                'blurb' => $s['blurb'] ?? '',
                'region' => $s['region'] ?? '',
                'fundingType' => $s['fundingType'] ?? '',
            ];
        }
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
 * (never the client's), stored in the deny-all _leads/cv tree. Returns the
 * stored filename, or '' if absent/invalid (a bad upload never fails the lead).
 */
function handle_cv_upload(array $file, string $cvDir): array {
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
    // real guards are the extension allowlist + the non-executable deny-all dir.
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
    if (!is_dir($cvDir) && !@mkdir($cvDir, 0700, true) && !is_dir($cvDir)) {
        return [];
    }
    $safe = 'cv-' . gmdate('Ymd') . '-' . bin2hex(random_bytes(8)) . '.' . $ext;
    $dest = $cvDir . '/' . $safe;
    if (!move_uploaded_file((string) $file['tmp_name'], $dest)) {
        return [];
    }
    @chmod($dest, 0600);
    return [
        'stored' => $safe,
        'originalName' => mb_substr((string) ($file['name'] ?? ''), 0, 180),
        'mime' => $mime !== '' ? $mime : 'application/octet-stream',
        'size' => (int) ($file['size'] ?? 0),
        'uploadedAt' => gmdate('c'),
    ];
}

$cvMeta = [];
if (!empty($_FILES['cv']) && is_array($_FILES['cv'])) {
    $cvMeta = handle_cv_upload($_FILES['cv'], $leadsDir . '/cv');
}
$cvStored = (string) ($cvMeta['stored'] ?? '');

// ── Persist the lead (append-only NDJSON, flock'd) ──
if (!is_dir($leadsDir)) {
    @mkdir($leadsDir, 0700, true);
}
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
];
$leadFile = $leadsDir . '/leads-' . gmdate('Y-m') . '.ndjson';
$fh = @fopen($leadFile, 'ab');
if ($fh) {
    if (flock($fh, LOCK_EX)) {
        fwrite($fh, json_encode($record, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n");
        fflush($fh);
        flock($fh, LOCK_UN);
    }
    fclose($fh);
    mark_phone_used($phoneNormalized, $dataDir);
} else {
    error_log('[quiz-lead] could not open leads file: ' . $leadFile);
}

// ── Emails (best effort, never blocks the lead). Skip for suspected bots so we
// do not email junk addresses, but the lead is already stored + flagged above. ──
if (!$suspectedBot) {
    try {
        ech_campaign_enroll_match_lead($record, $pathways, $scholarships);
    } catch (Throwable $e) {
        error_log('[quiz-lead] campaign enrollment failed: ' . $e->getMessage());
    }
    try {
        send_match_emails($name, $email, $phone, $answers, $pathways, $scholarships, $linkedin, $portfolio, $cvStored, $cvMeta);
    } catch (Throwable $e) {
        error_log('[quiz-lead] email failed: ' . $e->getMessage());
    }
}

respond(['ok' => true]);
