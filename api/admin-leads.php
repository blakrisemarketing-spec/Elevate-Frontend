<?php
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
ech_admin_require();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$dir = __DIR__ . '/_leads';
$limit = max(1, min(200, (int) ($_GET['limit'] ?? 50)));
$offset = max(0, (int) ($_GET['offset'] ?? 0));
$q = strtolower(trim((string) ($_GET['q'] ?? '')));
$rows = [];

foreach (glob($dir . '/leads-*.ndjson') ?: [] as $file) {
    $fh = @fopen($file, 'rb');
    if (!$fh) {
        continue;
    }
    while (($line = fgets($fh)) !== false) {
        $rec = json_decode(trim($line), true);
        if (!is_array($rec)) {
            continue;
        }
        $hay = strtolower((string) ($rec['name'] ?? '') . ' ' . (string) ($rec['email'] ?? '') . ' ' . (string) ($rec['phone'] ?? ''));
        if ($q !== '' && !str_contains($hay, $q)) {
            continue;
        }
        $rows[] = $rec;
    }
    fclose($fh);
}

usort($rows, static fn($a, $b) => strcmp((string) ($b['ts'] ?? ''), (string) ($a['ts'] ?? '')));
$total = count($rows);
$page = array_slice($rows, $offset, $limit);

ech_json(['ok' => true, 'total' => $total, 'items' => $page]);

