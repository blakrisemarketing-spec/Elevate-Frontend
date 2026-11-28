<?php
/**
 * Admin: client deliverables (CVs, letters, essays...) in the private
 * `ech-deliverables` Storage bucket.
 *   POST multipart {engagementId, title?, clientVisible, file} -> upload
 *   POST {action:'visible', id, visible}  -> share with / hide from the client
 *   POST {action:'delete', id}
 *   GET  ?id=                             -> download (admin)
 * Staff can only touch files on work assigned to them.
 */
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/ops-store.php';
ech_admin_require();
$user = ech_admin_current_user() ?? [];
$senior = ech_admin_role_sees_finance((string) ($user['role'] ?? ''));
$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');

const ECH_DELIV_MAX_BYTES = 15 * 1024 * 1024;
const ECH_DELIV_TYPES = [
    'pdf' => 'application/pdf',
    'doc' => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'odt' => 'application/vnd.oasis.opendocument.text',
    'rtf' => 'application/rtf',
    'txt' => 'text/plain',
    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'png' => 'image/png',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
];

function ech_deliv_guard(array $user, bool $senior, int $engagementId): array {
    $eng = ech_engagement_get($engagementId);
    if (!$eng) {
        ech_json(['ok' => false, 'message' => 'Work item not found.'], 404);
    }
    if (!$senior && (int) ($eng['owner_id'] ?? 0) !== (int) ($user['id'] ?? -1)) {
        ech_json(['ok' => false, 'message' => 'This work item is not assigned to you.'], 403);
    }
    return $eng;
}

if ($method === 'GET') {
    ech_ops_run('admin-deliverables', function () use ($user, $senior) {
        $d = ech_deliverable_get((int) ($_GET['id'] ?? 0));
        if (!$d) {
            ech_json(['ok' => false, 'message' => 'File not found.'], 404);
        }
        ech_deliv_guard($user, $senior, (int) $d['engagement_id']);
        ech_deliverable_stream($d);
    });
}

if ($method !== 'POST') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$isMultipart = str_starts_with(strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? '')), 'multipart/form-data');

if ($isMultipart) {
    ech_ops_run('admin-deliverables', function () use ($user, $senior) {
        $eng = ech_deliv_guard($user, $senior, (int) ($_POST['engagementId'] ?? 0));
        $f = $_FILES['file'] ?? null;
        if (!is_array($f) || ($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file((string) $f['tmp_name'])) {
            throw new InvalidArgumentException('Choose a file to upload (max 15 MB).');
        }
        if ((int) $f['size'] > ECH_DELIV_MAX_BYTES) {
            throw new InvalidArgumentException('Files must be 15 MB or smaller.');
        }
        $name = basename((string) $f['name']);
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if (!isset(ECH_DELIV_TYPES[$ext])) {
            throw new InvalidArgumentException('Allowed files: ' . implode(', ', array_keys(ECH_DELIV_TYPES)) . '.');
        }
        $bytes = (string) file_get_contents((string) $f['tmp_name']);
        $row = ech_deliverable_add(
            $eng,
            (string) ($_POST['title'] ?? ''),
            $name,
            ECH_DELIV_TYPES[$ext],
            $bytes,
            in_array((string) ($_POST['clientVisible'] ?? ''), ['1', 'true', 'on'], true),
            $user
        );
        ech_json(['ok' => true, 'deliverable' => ech_deliverable_public($row)]);
    });
}

$body = ech_request_json();
$action = (string) ($body['action'] ?? '');

ech_ops_run('admin-deliverables', function () use ($action, $body, $user, $senior) {
    $d = ech_deliverable_get((int) ($body['id'] ?? 0));
    if (!$d) {
        throw new InvalidArgumentException('File not found.');
    }
    ech_deliv_guard($user, $senior, (int) $d['engagement_id']);
    if ($action === 'visible') {
        ech_json(['ok' => true, 'deliverable' => ech_deliverable_public(ech_deliverable_set_visible((int) $d['id'], !empty($body['visible']), $user))]);
    }
    if ($action === 'delete') {
        ech_deliverable_delete((int) $d['id']);
        ech_json(['ok' => true]);
    }
    ech_json(['ok' => false, 'message' => 'Unknown action.'], 400);
});
