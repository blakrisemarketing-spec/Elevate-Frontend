<?php
/**
 * Admin: Growth dashboard data (founder / partner only).
 *   GET ?year=2027 -> ech_growth_stats(year): revenue vs goal, product mix,
 *                     channel economics, monthly series, repeat buyers.
 */
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/ops-store.php';
ech_admin_require_role(['founder', 'partner']);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$year = (int) ($_GET['year'] ?? gmdate('Y'));
if ($year < 2020 || $year > 2100) {
    $year = (int) gmdate('Y');
}

ech_ops_run('admin-growth', function () use ($year) {
    ech_json(['ok' => true, 'stats' => ech_growth_stats($year), 'categories' => ech_fulfilment_config()['categories'] ?? []]);
});
