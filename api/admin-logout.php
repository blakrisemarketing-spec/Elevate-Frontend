<?php
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}
ech_admin_logout();
ech_json(['ok' => true]);

