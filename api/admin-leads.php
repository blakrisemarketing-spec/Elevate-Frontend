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
$q = trim((string) ($_GET['q'] ?? ''));
$status = trim((string) ($_GET['status'] ?? ''));
if ($status !== '' && !in_array($status, ['new', 'contacted', 'interested', 'converted', 'lost'], true)) {
    ech_json(['ok' => false, 'message' => 'Unknown status filter.'], 400);
}

try {
    $result = ech_leads_query($q, $status, $limit, $offset);
} catch (Throwable $e) {
    error_log('[admin-leads] query failed: ' . $e->getMessage());
    ech_json(['ok' => false, 'message' => 'Lead database is unreachable. Try again shortly.'], 503);
}

ech_json(['ok' => true, 'total' => $result['total'], 'items' => $result['items']]);
