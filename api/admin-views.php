<?php
/**
 * Admin: saved lead views (shared filter presets).
 *   GET                                  -> list saved views
 *   POST {action:'save', name, filter}   -> create/overwrite a view (filter = {q,status})
 *   POST {action:'delete', id}           -> remove a view
 */
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/store.php';
ech_admin_require();

$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    try {
        ech_json(['ok' => true, 'views' => array_map(static fn($v) => [
            'id' => (int) $v['id'],
            'name' => (string) $v['name'],
            'filter' => is_array($v['filter'] ?? null) ? $v['filter'] : [],
        ], ech_view_list())]);
    } catch (Throwable $e) {
        error_log('[admin-views] list failed: ' . $e->getMessage());
        ech_json(['ok' => false, 'message' => 'Database is unreachable. Try again shortly.'], 503);
    }
}

if ($method !== 'POST') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$raw = file_get_contents('php://input');
$body = is_string($raw) ? json_decode($raw, true) : null;
if (!is_array($body)) {
    ech_json(['ok' => false, 'message' => 'Invalid request body.'], 400);
}
$action = (string) ($body['action'] ?? '');

try {
    if ($action === 'save') {
        $name = trim((string) ($body['name'] ?? ''));
        if ($name === '' || mb_strlen($name) > 60) {
            ech_json(['ok' => false, 'message' => 'View name must be 1-60 characters.'], 400);
        }
        $filterIn = is_array($body['filter'] ?? null) ? $body['filter'] : [];
        $status = (string) ($filterIn['status'] ?? '');
        if ($status !== '' && !in_array($status, ['new', 'contacted', 'interested', 'converted', 'lost'], true)) {
            $status = '';
        }
        $filter = ['q' => mb_substr((string) ($filterIn['q'] ?? ''), 0, 120), 'status' => $status];
        $saved = ech_view_upsert($name, $filter);
        ech_json(['ok' => true, 'view' => ['id' => (int) ($saved['id'] ?? 0), 'name' => $name, 'filter' => $filter]]);
    }

    if ($action === 'delete') {
        $id = (int) ($body['id'] ?? 0);
        if ($id <= 0) {
            ech_json(['ok' => false, 'message' => 'Missing view id.'], 400);
        }
        ech_view_delete($id);
        ech_json(['ok' => true]);
    }

    ech_json(['ok' => false, 'message' => 'Unknown action.'], 400);
} catch (Throwable $e) {
    error_log('[admin-views] action failed: ' . $e->getMessage());
    ech_json(['ok' => false, 'message' => 'Database is unreachable. Try again shortly.'], 503);
}
