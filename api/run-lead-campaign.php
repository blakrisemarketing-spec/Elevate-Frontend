<?php
declare(strict_types=1);

ini_set('display_errors', '0');
$isCli = PHP_SAPI === 'cli';
if (!$isCli) {
    header('Content-Type: application/json');
    header('Cache-Control: no-store');
}

$configFile = __DIR__ . '/config.php';
if (is_file($configFile)) {
    require $configFile;
}
require __DIR__ . '/lead-campaign.php';

function campaign_json($data, int $status = 200): void {
    if (PHP_SAPI !== 'cli') {
        http_response_code($status);
    }
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if (PHP_SAPI === 'cli') {
        echo PHP_EOL;
    }
    exit;
}

if (!$isCli) {
    if (!in_array(($_SERVER['REQUEST_METHOD'] ?? 'GET'), ['GET', 'POST'], true)) {
        campaign_json(['ok' => false, 'message' => 'Method not allowed'], 405);
    }
    $expected = ech_runtime_secret('CRON_SECRET');
    if ($expected === '') {
        campaign_json(['ok' => false, 'message' => 'CRON_SECRET is not configured.'], 503);
    }
    $provided = (string) ($_GET['secret'] ?? ($_SERVER['HTTP_X_CRON_SECRET'] ?? ''));
    if (!hash_equals($expected, $provided)) {
        campaign_json(['ok' => false, 'message' => 'Forbidden'], 403);
    }
}

$lockPath = ech_campaign_file('lead-campaign.lock');
$lock = @fopen($lockPath, 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
    campaign_json(['ok' => true, 'message' => 'Campaign runner already active.', 'sent' => 0, 'skipped' => 0, 'errors' => []]);
}

try {
    $limit = max(1, min(100, (int) ($_GET['limit'] ?? 20)));
    $stats = ech_campaign_run_due($limit);
    flock($lock, LOCK_UN);
    fclose($lock);
    campaign_json(['ok' => true] + $stats);
} catch (Throwable $e) {
    error_log('[lead-campaign] run failed: ' . $e->getMessage());
    flock($lock, LOCK_UN);
    fclose($lock);
    campaign_json(['ok' => false, 'message' => $e->getMessage()], 500);
}
