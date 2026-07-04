<?php
/**
 * Admin: manage admin user profiles.
 *   GET                                          -> list users (no hashes)
 *   POST {action:'create', email, name?, password?} -> create; returns a
 *        generated password if none was supplied (shown once)
 *   POST {action:'reset', id, password?}         -> set a new password (generated if omitted)
 *   POST {action:'active', id, active}           -> activate / deactivate
 *   POST {action:'delete', id}                   -> remove (cannot delete yourself)
 */
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/store.php';
ech_admin_require();

/** Readable, reasonably strong random password (no ambiguous chars). */
function ech_generate_password(int $len = 14): string {
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    $max = strlen($alphabet) - 1;
    $out = '';
    for ($i = 0; $i < $len; $i++) {
        $out .= $alphabet[random_int(0, $max)];
    }
    return $out;
}

function ech_hash_password(string $plain): string {
    return password_hash($plain, PASSWORD_DEFAULT);
}

$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    try {
        ech_json(['ok' => true, 'users' => array_map('ech_admin_user_public', ech_admin_users_list())]);
    } catch (Throwable $e) {
        error_log('[admin-users] list failed: ' . $e->getMessage());
        ech_json(['ok' => false, 'message' => 'User database is unreachable. Try again shortly.'], 503);
    }
}

if ($method !== 'POST') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$body = is_array($json = json_decode((string) file_get_contents('php://input'), true)) ? $json : null;
if ($body === null) {
    ech_json(['ok' => false, 'message' => 'Invalid request body.'], 400);
}
$action = (string) ($body['action'] ?? '');
$me = ech_admin_current_user() ?? [];

try {
    if ($action === 'create') {
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            ech_json(['ok' => false, 'message' => 'A valid email is required.'], 400);
        }
        if (ech_admin_user_by_email($email)) {
            ech_json(['ok' => false, 'message' => 'An admin with that email already exists.'], 409);
        }
        $name = mb_substr(trim((string) ($body['name'] ?? '')), 0, 120);
        $plain = trim((string) ($body['password'] ?? ''));
        $generated = $plain === '';
        if ($generated) {
            $plain = ech_generate_password();
        } elseif (mb_strlen($plain) < 8) {
            ech_json(['ok' => false, 'message' => 'Password must be at least 8 characters.'], 400);
        }
        $user = ech_admin_user_upsert($email, ech_hash_password($plain), $name, true);
        ech_json(['ok' => true, 'user' => ech_admin_user_public($user), 'password' => $plain, 'generated' => $generated]);
    }

    $id = (int) ($body['id'] ?? 0);
    if ($id <= 0) {
        ech_json(['ok' => false, 'message' => 'Missing user id.'], 400);
    }
    $target = ech_admin_user_get($id);
    if (!$target) {
        ech_json(['ok' => false, 'message' => 'User not found.'], 404);
    }

    if ($action === 'reset') {
        $plain = trim((string) ($body['password'] ?? ''));
        $generated = $plain === '';
        if ($generated) {
            $plain = ech_generate_password();
        } elseif (mb_strlen($plain) < 8) {
            ech_json(['ok' => false, 'message' => 'Password must be at least 8 characters.'], 400);
        }
        ech_admin_user_set_password($id, ech_hash_password($plain));
        ech_json(['ok' => true, 'password' => $plain, 'generated' => $generated]);
    }

    if ($action === 'active') {
        $active = (bool) ($body['active'] ?? false);
        if (!$active && (int) ($me['id'] ?? -1) === $id) {
            ech_json(['ok' => false, 'message' => 'You cannot deactivate your own account.'], 400);
        }
        ech_admin_user_set_active($id, $active);
        ech_json(['ok' => true, 'active' => $active]);
    }

    if ($action === 'delete') {
        if ((int) ($me['id'] ?? -1) === $id) {
            ech_json(['ok' => false, 'message' => 'You cannot delete your own account.'], 400);
        }
        ech_admin_user_delete($id);
        ech_json(['ok' => true]);
    }

    ech_json(['ok' => false, 'message' => 'Unknown action.'], 400);
} catch (Throwable $e) {
    error_log('[admin-users] action failed: ' . $e->getMessage());
    ech_json(['ok' => false, 'message' => 'User database is unreachable. Try again shortly.'], 503);
}
