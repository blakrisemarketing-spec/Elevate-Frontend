<?php
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
ech_admin_require();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$dir = ech_private_data_dir();
$limit = max(1, min(200, (int) ($_GET['limit'] ?? 50)));
$offset = max(0, (int) ($_GET['offset'] ?? 0));
$rows = [];

foreach (glob($dir . '/purchases-*.ndjson') ?: [] as $file) {
    $fh = @fopen($file, 'rb');
    if (!$fh) {
        continue;
    }
    while (($line = fgets($fh)) !== false) {
        $rec = json_decode(trim($line), true);
        if (is_array($rec)) {
            $rows[] = $rec;
        }
    }
    fclose($fh);
}

usort($rows, static fn($a, $b) => strcmp((string) ($b['ts'] ?? ''), (string) ($a['ts'] ?? '')));
ech_json(['ok' => true, 'total' => count($rows), 'items' => array_slice($rows, $offset, $limit)]);

