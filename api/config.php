<?php
/**
 * Runtime config loader.
 *
 * This file is intentionally committed because Hostinger deploys replace the
 * public_html tree. Keep the real secrets in ech-config.php one directory above
 * public_html, for example:
 *
 *   /home/.../domains/elevatecareerhub.com/ech-config.php
 *
 * That private file should call putenv('KEY=value') for runtime PHP secrets.
 */
declare(strict_types=1);

$candidates = [];

$docRoot = (string) ($_SERVER['DOCUMENT_ROOT'] ?? '');
if ($docRoot !== '') {
    $candidates[] = dirname($docRoot) . '/ech-config.php';
}

$candidates[] = dirname(__DIR__, 2) . '/ech-config.php';
$candidates[] = __DIR__ . '/config.local.php';

foreach (array_unique($candidates) as $candidate) {
    if (is_file($candidate)) {
        require_once $candidate;
        break;
    }
}
