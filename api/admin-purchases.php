<?php
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/store.php';
ech_admin_require();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$limit = max(1, min(200, (int) ($_GET['limit'] ?? 50)));
$offset = max(0, (int) ($_GET['offset'] ?? 0));

try {
    $result = ech_purchases_query($limit, $offset);
} catch (Throwable $e) {
    error_log('[admin-purchases] query failed: ' . $e->getMessage());
    ech_json(['ok' => false, 'message' => 'Purchase database is unreachable. Try again shortly.'], 503);
}

ech_json(['ok' => true, 'total' => $result['total'], 'items' => $result['items']]);
