<?php
/**
 * Portal: everything the signed-in client may see, in one call. Strictly
 * scoped to the session's client id; internal notes, internal files and team
 * activity never leave the server.
 */
declare(strict_types=1);

require __DIR__ . '/portal-auth.php';

$client = ech_portal_require();
$cid = (int) $client['id'];

ech_ops_run('portal-me', function () use ($client, $cid) {
    $engagements = ech_engagements_query(['clientId' => $cid, 'includeClosed' => true]);
    $work = array_map(function ($e) {
        $first = trim(explode(' ', (string) $e['ownerName'])[0] ?? '');
        return [
            'id' => $e['id'],
            'title' => $e['title'],
            'family' => $e['family'],
            'status' => $e['status'],
            'statusLabel' => ech_engagement_status_label((string) $e['status']),
            'dueOn' => in_array($e['status'], ['delivered', 'closed'], true) ? null : $e['dueOn'],
            'message' => $e['clientMessage'],
            'consultant' => str_contains($first, '@') ? '' : $first,
            'steps' => array_map(fn($s) => ['label' => $s['label'], 'done' => $s['done']], $e['steps']),
            'stepsDone' => $e['stepsDone'],
            'stepsTotal' => $e['stepsTotal'],
            'createdAt' => $e['createdAt'],
            'deliveredAt' => $e['deliveredAt'],
        ];
    }, $engagements);
    $files = array_map(fn($d) => [
        'id' => (int) $d['id'],
        'engagementId' => (int) $d['engagement_id'],
        'title' => (string) $d['title'],
        'fileName' => (string) $d['file_name'],
        'version' => (int) $d['version'],
        'sizeBytes' => (int) $d['size_bytes'],
        'createdAt' => (string) $d['created_at'],
    ], ech_deliverables_for_client($cid, true));
    $apps = array_map(fn($a) => ech_application_public($a, true), ech_applications_for_client($cid));
    $activity = array_map(fn($a) => [
        'id' => (int) $a['id'],
        'createdAt' => (string) $a['created_at'],
        'kind' => (string) $a['kind'],
        'summary' => (string) $a['summary'],
        'fromClient' => str_starts_with((string) $a['actor'], 'client:'),
    ], ech_sb_select('ech_activity', 'select=id,created_at,kind,summary,actor&client_id=eq.' . $cid . '&client_visible=is.true&order=created_at.desc&limit=50'));
    $orders = array_map(fn($r) => [
        'itemName' => (string) $r['item_name'],
        'amountPesewas' => (int) $r['amount_pesewas'],
        'occurredAt' => (string) $r['occurred_at'],
    ], ech_revenue_for_client($cid));

    ech_json([
        'ok' => true,
        'client' => [
            'name' => (string) $client['name'],
            'email' => (string) $client['email'],
            'hasPassword' => ((string) $client['password_hash']) !== '',
            'hasGoogle' => !empty($client['google_sub']),
        ],
        'work' => $work,
        'files' => $files,
        'applications' => $apps,
        'activity' => $activity,
        'orders' => $orders,
    ]);
});
