<?php
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/supabase.php';
ech_admin_require();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$file = (string) ($_GET['file'] ?? '');
$base = basename($file);
if ($base === '' || $base !== $file || !preg_match('/^cv-\d{8}-[a-f0-9]{16}\.(pdf|doc|docx)$/i', $base)) {
    ech_json(['ok' => false, 'message' => 'Invalid CV file.'], 400);
}

$mimeByExt = [
    'pdf' => 'application/pdf',
    'doc' => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
$ext = strtolower(pathinfo($base, PATHINFO_EXTENSION));

// Primary source: the private Supabase Storage bucket. Fallbacks cover CVs
// stored locally during a Storage outage and legacy pre-migration files.
$bytes = ech_sb_ready() ? ech_sb_storage_download('ech-cvs', $base) : null;
if ($bytes === null) {
    foreach ([ech_cv_dir() . '/' . $base, __DIR__ . '/_leads/cv/' . $base] as $path) {
        if (is_file($path)) {
            $bytes = (string) file_get_contents($path);
            break;
        }
    }
}
if ($bytes === null || $bytes === '') {
    ech_json(['ok' => false, 'message' => 'CV not found.'], 404);
}

header('Content-Type: ' . ($mimeByExt[$ext] ?? 'application/octet-stream'));
header('Content-Length: ' . (string) strlen($bytes));
header('Content-Disposition: inline; filename="' . addslashes($base) . '"');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store');
echo $bytes;
