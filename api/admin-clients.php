<?php
/**
 * Admin: client records and the client file.
 *   GET ?q=&offset=          -> client list (staff: only clients they have work for)
 *   GET ?id=                 -> client file: profile, work, files, applications,
 *                               activity, revenue (founder/partner only), matching lead
 *   POST {action:'create', email, name?, phone?, channel?}            (founder/partner)
 *   POST {action:'update', id, name?, phone?, notes?, acquisitionChannel?, portalEnabled?} (founder/partner)
 *   POST {action:'invite', id}           -> email a portal set-up link
 *   POST {action:'note', clientId, body, clientVisible}  -> internal note or client-visible update
 *   POST {action:'app_create', clientId, kind, organization, title?, ...}
 *   POST {action:'app_update', id, ...}
 *   POST {action:'app_delete', id}
 */
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/ops-store.php';
ech_admin_require();
$user = ech_admin_current_user() ?? [];
$senior = ech_admin_role_sees_finance((string) ($user['role'] ?? ''));
$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    ech_ops_run('admin-clients', function () use ($user, $senior) {
        $id = (int) ($_GET['id'] ?? 0);
        if ($id > 0) {
            ech_require_client_access($user, $id);
            $client = ech_client_get($id);
            if (!$client) {
                ech_json(['ok' => false, 'message' => 'Client not found.'], 404);
            }
            $lead = null;
            $leads = ech_sb_select('ech_leads', 'select=uid,created_at,status,utm_source,utm_campaign&email=eq.' . rawurlencode((string) $client['email']) . '&order=created_at.desc&limit=1');
            if ($leads) {
                $lead = ['uid' => (string) $leads[0]['uid'], 'createdAt' => (string) $leads[0]['created_at'], 'status' => (string) $leads[0]['status'],
                    'utmSource' => (string) $leads[0]['utm_source'], 'utmCampaign' => (string) $leads[0]['utm_campaign']];
            }
            ech_json([
                'ok' => true,
                'client' => ech_client_public($client),
                'engagements' => ech_engagements_query(['clientId' => $id, 'includeClosed' => true]),
                'deliverables' => array_map('ech_deliverable_public', ech_deliverables_for_client($id)),
                'applications' => array_map(fn($a) => ech_application_public($a), ech_applications_for_client($id)),
                'activity' => array_map(fn($a) => [
                    'id' => (int) $a['id'], 'createdAt' => (string) $a['created_at'], 'actorName' => (string) $a['actor_name'],
                    'kind' => (string) $a['kind'], 'summary' => (string) $a['summary'], 'clientVisible' => !empty($a['client_visible']),
                ], ech_activity_recent(100, [$id])),
                'revenue' => $senior ? array_map(fn($r) => [
                    'id' => (string) $r['id'], 'source' => (string) $r['source'], 'method' => (string) $r['method'],
                    'occurredAt' => (string) $r['occurred_at'], 'itemName' => (string) $r['item_name'],
                    'amountPesewas' => (int) $r['amount_pesewas'], 'channel' => (string) $r['channel'],
                ], ech_revenue_for_client($id)) : null,
                'lead' => $lead,
                'schoolStatuses' => ECH_SCHOOL_STATUSES,
                'jobStatuses' => ECH_JOB_STATUSES,
                'channels' => ECH_CHANNELS,
            ]);
        }
        $limit = max(1, min(200, (int) ($_GET['limit'] ?? 50)));
        $offset = max(0, (int) ($_GET['offset'] ?? 0));
        $only = $senior ? null : ech_staff_client_ids((int) ($user['id'] ?? 0));
        $res = ech_clients_query((string) ($_GET['q'] ?? ''), $limit, $offset, $only);
        if (!$senior) {
            foreach ($res['items'] as &$item) {
                unset($item['revenuePesewas']);
            }
            unset($item);
        }
        ech_json(['ok' => true] + $res + ['channels' => ECH_CHANNELS]);
    });
}

if ($method !== 'POST') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$body = ech_request_json();
$action = (string) ($body['action'] ?? '');

ech_ops_run('admin-clients', function () use ($action, $body, $user, $senior) {
    if (in_array($action, ['create', 'update'], true) && !$senior) {
        ech_json(['ok' => false, 'message' => 'Only founders and partners can do that.'], 403);
    }
    switch ($action) {
        case 'create':
            $channel = in_array($body['channel'] ?? '', ECH_CHANNELS, true) ? $body['channel'] : 'direct';
            $client = ech_client_ensure((string) ($body['email'] ?? ''), (string) ($body['name'] ?? ''), (string) ($body['phone'] ?? ''), $channel);
            ech_activity_log(ech_actor($user) + ['client_id' => (int) $client['id'], 'kind' => 'client', 'summary' => 'Client record created']);
            ech_json(['ok' => true, 'client' => ech_client_public($client)]);
        case 'update':
            $id = (int) ($body['id'] ?? 0);
            $patch = [];
            foreach (['name' => 'name', 'phone' => 'phone', 'notes' => 'notes', 'acquisitionChannel' => 'acquisition_channel', 'portalEnabled' => 'portal_enabled'] as $in => $col) {
                if (array_key_exists($in, $body)) {
                    $patch[$col] = $body[$in];
                }
            }
            ech_json(['ok' => true, 'client' => ech_client_public(ech_client_update($id, $patch))]);
        case 'invite':
            $id = (int) ($body['id'] ?? 0);
            ech_require_client_access($user, $id);
            $client = ech_client_get($id);
            if (!$client) {
                throw new InvalidArgumentException('Client not found.');
            }
            $sent = ech_portal_send_password_link($client, 'invite');
            ech_activity_log(ech_actor($user) + ['client_id' => $id, 'kind' => 'portal', 'summary' => 'Portal invite ' . ($sent ? 'emailed' : 'generated (email not configured)')]);
            ech_json(['ok' => true, 'sent' => $sent]);
        case 'note':
            $clientId = (int) ($body['clientId'] ?? 0);
            ech_require_client_access($user, $clientId);
            $text = trim((string) ($body['body'] ?? ''));
            if ($text === '') {
                throw new InvalidArgumentException('Write something first.');
            }
            $visible = !empty($body['clientVisible']);
            ech_activity_log(ech_actor($user) + [
                'client_id' => $clientId, 'kind' => $visible ? 'update' : 'note', 'summary' => $text, 'client_visible' => $visible,
            ]);
            ech_json(['ok' => true]);
        case 'app_create':
            $clientId = (int) ($body['clientId'] ?? 0);
            ech_require_client_access($user, $clientId);
            $app = ech_application_create($clientId, (string) ($body['kind'] ?? ''), $body, $user);
            ech_json(['ok' => true, 'application' => ech_application_public($app)]);
        case 'app_update':
        case 'app_delete':
            $id = (int) ($body['id'] ?? 0);
            $rows = ech_sb_select('ech_applications', 'select=client_id&id=eq.' . $id . '&limit=1');
            if (!$rows) {
                throw new InvalidArgumentException('Application not found.');
            }
            ech_require_client_access($user, (int) $rows[0]['client_id']);
            if ($action === 'app_delete') {
                ech_application_delete($id);
                ech_json(['ok' => true]);
            }
            ech_json(['ok' => true, 'application' => ech_application_public(ech_application_update($id, $body, $user))]);
    }
    ech_json(['ok' => false, 'message' => 'Unknown action.'], 400);
});
