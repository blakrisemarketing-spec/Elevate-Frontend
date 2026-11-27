<?php
/**
 * Admin: offline sales, marketing spend and revenue goals (founder / partner).
 *   GET ?year=2027                       -> {sales, spend, goals, services, channels, methods}
 *   POST {action:'sale', email, name?, phone?, serviceId?, itemName?, amountCedis,
 *         method, channel, date, reference?, notes?, createWork}
 *   POST {action:'sale_delete', id}      -> also removes untouched work it created
 *   POST {action:'spend', date, channel, campaign?, amountCedis, notes?}
 *   POST {action:'spend_delete', id}
 *   POST {action:'goal', period, revenueCedis, clientsTarget?}
 *   POST {action:'goal_delete', period}  -> monthly overrides only
 */
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/ops-store.php';
$user = ech_admin_require_role(['founder', 'partner']);

$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    $year = (int) ($_GET['year'] ?? gmdate('Y'));
    ech_ops_run('admin-finance', function () use ($year) {
        $services = [];
        foreach ((ech_fulfilment_config()['services'] ?? []) as $id => $svc) {
            $services[] = ['id' => $id, 'name' => (string) $svc['name'], 'category' => (string) $svc['category'], 'amountPesewas' => (int) $svc['amountPesewas']];
        }
        ech_json([
            'ok' => true,
            'year' => $year,
            'sales' => array_map(fn($s) => [
                'id' => (int) $s['id'],
                'occurredAt' => (string) $s['occurred_at'],
                'clientId' => (int) $s['client_id'],
                'clientName' => (string) ($s['client']['name'] ?? ''),
                'clientEmail' => (string) ($s['client']['email'] ?? ''),
                'serviceId' => (string) $s['service_id'],
                'itemName' => (string) $s['item_name'],
                'amountPesewas' => (int) $s['amount_pesewas'],
                'method' => (string) $s['method'],
                'channel' => (string) $s['channel'],
                'reference' => (string) $s['reference'],
                'notes' => (string) $s['notes'],
                'recordedBy' => (string) $s['recorded_by'],
            ], ech_offline_sales_list($year)),
            'spend' => array_map(fn($s) => [
                'id' => (int) $s['id'],
                'spentOn' => (string) $s['spent_on'],
                'channel' => (string) $s['channel'],
                'campaign' => (string) $s['campaign'],
                'amountPesewas' => (int) $s['amount_pesewas'],
                'notes' => (string) $s['notes'],
                'recordedBy' => (string) $s['recorded_by'],
            ], ech_spend_list($year)),
            'goals' => array_map(fn($g) => [
                'period' => (string) $g['period'],
                'revenueTargetPesewas' => (int) $g['revenue_target_pesewas'],
                'clientsTarget' => isset($g['clients_target']) ? (int) $g['clients_target'] : null,
            ], ech_goals_for_year($year)),
            'services' => $services,
            'channels' => ECH_CHANNELS,
            'methods' => ECH_SALE_METHODS,
        ]);
    });
}

if ($method !== 'POST') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$body = ech_request_json();
$action = (string) ($body['action'] ?? '');

ech_ops_run('admin-finance', function () use ($action, $body, $user) {
    switch ($action) {
        case 'sale':
            $sale = ech_offline_sale_create($body, $user);
            ech_json(['ok' => true, 'id' => (int) $sale['id']]);
        case 'sale_delete':
            ech_json(['ok' => true] + ech_offline_sale_delete((int) ($body['id'] ?? 0)));
        case 'spend':
            $row = ech_spend_create($body, $user);
            ech_json(['ok' => true, 'id' => (int) ($row['id'] ?? 0)]);
        case 'spend_delete':
            ech_spend_delete((int) ($body['id'] ?? 0));
            ech_json(['ok' => true]);
        case 'goal':
            $clients = isset($body['clientsTarget']) && $body['clientsTarget'] !== '' && $body['clientsTarget'] !== null ? max(0, (int) $body['clientsTarget']) : null;
            ech_goal_set((string) ($body['period'] ?? ''), (int) round(((float) ($body['revenueCedis'] ?? 0)) * 100), $clients);
            ech_json(['ok' => true]);
        case 'goal_delete':
            ech_goal_delete((string) ($body['period'] ?? ''));
            ech_json(['ok' => true]);
    }
    ech_json(['ok' => false, 'message' => 'Unknown action.'], 400);
});
