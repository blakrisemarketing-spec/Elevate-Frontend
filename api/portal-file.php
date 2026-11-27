<?php
/** Portal: download one of the signed-in client's shared files. GET ?id= */
declare(strict_types=1);

require __DIR__ . '/portal-auth.php';

$client = ech_portal_require();

ech_ops_run('portal-file', function () use ($client) {
    $d = ech_deliverable_get((int) ($_GET['id'] ?? 0));
    // Same 404 for "not yours" and "not shared yet": never confirm existence.
    if (!$d || (int) $d['client_id'] !== (int) $client['id'] || empty($d['client_visible'])) {
        ech_json(['ok' => false, 'message' => 'File not found.'], 404);
    }
    ech_deliverable_stream($d);
});
