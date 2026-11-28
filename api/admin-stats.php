<?php
/** Admin: overview dashboard stats (single stats_overview() RPC). */
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/store.php';
ech_admin_require();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

try {
    $stats = ech_stats_overview();
} catch (Throwable $e) {
    error_log('[admin-stats] failed: ' . $e->getMessage());
    ech_json(['ok' => false, 'message' => 'Stats database is unreachable. Try again shortly.'], 503);
}

// Staff see the lead pipeline but not revenue.
$me = ech_admin_current_user() ?? [];
if (!ech_admin_role_sees_finance((string) ($me['role'] ?? ''))) {
    foreach (['revenueFromLeadsPesewas', 'revenueTotalPesewas', 'purchasesTotal'] as $k) {
        $stats[$k] = 0;
    }
    if (isset($stats['sourceFunnel']) && is_array($stats['sourceFunnel'])) {
        foreach ($stats['sourceFunnel'] as &$row) {
            $row['revenuePesewas'] = 0;
        }
        unset($row);
    }
}

$stats['legacyImportDoneAt'] = null;
try {
    $stats['legacyImportDoneAt'] = ech_setting_get('legacy_import_done_at');
} catch (Throwable $e) {
    // non-fatal
}

ech_json(['ok' => true, 'stats' => $stats]);
