<?php
/** Admin: CSV export of the current lead segment (respects q + status filters). */
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/store.php';
ech_admin_require();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$q = trim((string) ($_GET['q'] ?? ''));
$status = trim((string) ($_GET['status'] ?? ''));
if ($status !== '' && !in_array($status, ['new', 'contacted', 'interested', 'converted', 'lost'], true)) {
    ech_json(['ok' => false, 'message' => 'Unknown status filter.'], 400);
}

try {
    $result = ech_leads_query($q, $status, 5000, 0); // export cap: 5000 rows/segment
} catch (Throwable $e) {
    error_log('[admin-export] query failed: ' . $e->getMessage());
    ech_json(['ok' => false, 'message' => 'Lead database is unreachable. Try again shortly.'], 503);
}

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="elevate-leads-' . gmdate('Ymd-His') . '.csv"');
header('Cache-Control: no-store');

$out = fopen('php://output', 'w');
fputcsv($out, [
    'Created', 'Name', 'Email', 'Phone', 'Status', 'Goal', 'Enrolled', 'Converted',
    'Notes', 'Last email', 'Suppressed', 'UTM source', 'UTM medium', 'UTM campaign',
    'Referrer', 'LinkedIn', 'Portfolio', 'CV file', 'UID',
]);
foreach ($result['items'] as $r) {
    $answers = is_array($r['answers'] ?? null) ? $r['answers'] : [];
    $reason = $answers['reason'] ?? '';
    $reason = is_array($reason) ? implode('|', $reason) : (string) $reason;
    fputcsv($out, [
        (string) ($r['createdAt'] ?? ''),
        (string) ($r['name'] ?? ''),
        (string) ($r['email'] ?? ''),
        (string) ($r['phone'] ?? ''),
        (string) ($r['status'] ?? ''),
        $reason,
        !empty($r['campaignEnrolled']) ? 'yes' : 'no',
        !empty($r['converted']) ? 'yes' : 'no',
        (string) ($r['notesCount'] ?? 0),
        (string) ($r['lastStep'] ?? ''),
        !empty($r['suppressed']) ? 'yes' : 'no',
        (string) ($r['utmSource'] ?? ''),
        (string) ($r['utmMedium'] ?? ''),
        (string) ($r['utmCampaign'] ?? ''),
        (string) ($r['referrer'] ?? ''),
        (string) ($r['linkedin'] ?? ''),
        (string) ($r['portfolio'] ?? ''),
        (string) ($r['cvFile'] ?? ''),
        (string) ($r['uid'] ?? ''),
    ]);
}
fclose($out);
