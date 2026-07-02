<?php
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
ech_admin_require();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$file = (string) ($_GET['file'] ?? '');
$base = basename($file);
if ($base === '' || $base !== $file || !preg_match('/^cv-\d{8}-[a-f0-9]{16}\.(pdf|doc|docx)$/i', $base)) {
    ech_json(['ok' => false, 'message' => 'Invalid CV file.'], 400);
}

$path = __DIR__ . '/_leads/cv/' . $base;
if (!is_file($path)) {
    ech_json(['ok' => false, 'message' => 'CV not found.'], 404);
}

$mime = function_exists('mime_content_type') ? (string) mime_content_type($path) : 'application/octet-stream';
if ($mime === '') {
    $mime = 'application/octet-stream';
}

header('Content-Type: ' . $mime);
header('Content-Length: ' . (string) filesize($path));
header('Content-Disposition: inline; filename="' . addslashes($base) . '"');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store');
readfile($path);

