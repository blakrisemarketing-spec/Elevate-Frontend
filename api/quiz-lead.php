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

function respond($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    respond(['ok' => false, 'message' => 'Method not allowed'], 405);
}

// Honeypot: a real user never fills this. Pretend success so bots move on.
if (trim((string) ($_POST['company'] ?? '')) !== '') {
    respond(['ok' => true]);
}

$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(['ok' => false, 'message' => 'Please provide your name and a valid email.'], 400);
}
$name = mb_substr($name, 0, 120);
$email = mb_substr($email, 0, 200);
$phone = mb_substr(preg_replace('/[^\d+]/', '', (string) ($_POST['phone'] ?? '')), 0, 20);
$consent = ((string) ($_POST['consent'] ?? '')) === 'yes';
$linkedin = filter_var(trim((string) ($_POST['linkedin'] ?? '')), FILTER_VALIDATE_URL) ?: '';
$portfolio = filter_var(trim((string) ($_POST['portfolio'] ?? '')), FILTER_VALIDATE_URL) ?: '';

$answers = json_decode((string) ($_POST['answers'] ?? '{}'), true);
if (!is_array($answers)) {
    $answers = [];
}
// Bound the answer payload so a hostile client cannot bloat the store.
$answers = array_slice($answers, 0, 40, true);

$pathwayIds = array_values(array_filter(array_map('trim', explode(',', (string) ($_POST['pathwayIds'] ?? '')))));
$scholarshipIds = array_values(array_filter(array_map('trim', explode(',', (string) ($_POST['scholarshipIds'] ?? '')))));

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
$pathways = [];
foreach ($pathwayIds as $id) {
    if (isset($pathwayMap[$id])) {
        $pathways[] = $pathwayMap[$id];
    }
}
$scholarships = [];
foreach ($scholarshipIds as $id) {
    if (isset($scholMap[$id])) {
        $scholarships[] = $scholMap[$id];
    }
}

$leadsDir = __DIR__ . '/_leads';

/**
 * Validate + store an optional CV upload. Security on a PHP host is critical:
 * extension allowlist, size cap, finfo MIME sniff, random server-side filename
 * (never the client's), stored in the deny-all _leads/cv tree. Returns the
 * stored filename, or '' if absent/invalid (a bad upload never fails the lead).
 */
function handle_cv_upload(array $file, string $cvDir): string {
    $maxBytes = 5 * 1024 * 1024;
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return '';
    }
    if (($file['size'] ?? 0) <= 0 || $file['size'] > $maxBytes) {
        return '';
    }
    if (!is_uploaded_file((string) ($file['tmp_name'] ?? ''))) {
        return '';
    }
    $ext = strtolower(pathinfo((string) ($file['name'] ?? ''), PATHINFO_EXTENSION));
    if (!in_array($ext, ['pdf', 'doc', 'docx'], true)) {
        return '';
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
    if (function_exists('finfo_open')) {
        // Note: no finfo_close() (deprecated in PHP 8.5, freed automatically).
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo) {
            $mime = (string) finfo_file($finfo, (string) $file['tmp_name']);
            if ($mime !== '' && !in_array($mime, $allowedMime, true)) {
                return '';
            }
        }
    }
    if (!is_dir($cvDir) && !@mkdir($cvDir, 0700, true) && !is_dir($cvDir)) {
        return '';
    }
    $safe = 'cv-' . gmdate('Ymd') . '-' . bin2hex(random_bytes(8)) . '.' . $ext;
    $dest = $cvDir . '/' . $safe;
    if (!move_uploaded_file((string) $file['tmp_name'], $dest)) {
        return '';
    }
    @chmod($dest, 0600);
    return $safe;
}

$cvStored = '';
if (!empty($_FILES['cv']) && is_array($_FILES['cv'])) {
    $cvStored = handle_cv_upload($_FILES['cv'], $leadsDir . '/cv');
}

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
    'consent' => $consent,
    'linkedin' => $linkedin,
    'portfolio' => $portfolio,
    'answers' => $answers,
    'pathwayIds' => $pathwayIds,
    'scholarshipIds' => $scholarshipIds,
    'cvFile' => $cvStored,
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
} else {
    error_log('[quiz-lead] could not open leads file: ' . $leadFile);
}

// ── Emails (best effort, never blocks the lead) ──
try {
    send_match_emails($name, $email, $phone, $answers, $pathways, $scholarships, $linkedin, $portfolio, $cvStored);
} catch (Throwable $e) {
    error_log('[quiz-lead] email failed: ' . $e->getMessage());
}

respond(['ok' => true]);
