<?php
/** Admin: who is signed in (for the dashboard header). */
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
ech_admin_require();

$user = ech_admin_current_user() ?? ['id' => 0, 'email' => '', 'name' => ''];
ech_json(['ok' => true, 'user' => $user]);
