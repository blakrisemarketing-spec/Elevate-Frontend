<?php
/** Portal: sign out (clears the signed session cookie). */
declare(strict_types=1);

require __DIR__ . '/portal-auth.php';
ech_portal_logout();
ech_json(['ok' => true]);
