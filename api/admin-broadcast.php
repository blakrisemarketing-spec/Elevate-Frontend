<?php
/**
 * Admin: segment broadcast (one-off email blast to a filtered lead segment).
 *
 *   GET                                         -> recent broadcast history
 *   POST {action:'preview', q, status}          -> recipient count + sample (no send)
 *   POST {action:'send', q, status, subject, html} -> send (capped), logged
 *
 * Always respects the suppression list (unsubscribes + admin holds) and skips
 * bots / empty emails. Every send appends an unsubscribe footer. Capped per call
 * so one click can't fan out unbounded; the UI surfaces the cap.
 */
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/lead-campaign.php'; // brings email.php + store.php + unsubscribe helpers
ech_admin_require();

const ECH_BROADCAST_CAP = 500;

$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');

/** Resolve a segment to deduped, sendable recipients (skips bots/suppressed/empty). */
function ech_broadcast_recipients(string $q, string $status): array {
    $result = ech_leads_query($q, $status, 2000, 0);
    $suppressed = [];
    foreach (ech_suppression_list() as $s) {
        $suppressed[strtolower((string) ($s['email'] ?? ''))] = true;
    }
    $seen = [];
    $recipients = [];
    $skipped = 0;
    foreach ($result['items'] as $r) {
        $email = strtolower(trim((string) ($r['email'] ?? '')));
        if ($email === '' || !empty($r['suspectedBot']) || isset($suppressed[$email])) {
            $skipped++;
            continue;
        }
        if (isset($seen[$email])) {
            continue;
        }
        $seen[$email] = true;
        $recipients[] = ['id' => (string) ($r['uid'] ?? ''), 'name' => (string) ($r['name'] ?? ''), 'email' => $email];
    }
    return ['recipients' => $recipients, 'skipped' => $skipped, 'segmentTotal' => $result['total']];
}

if ($method === 'GET') {
    try {
        ech_json(['ok' => true, 'history' => array_map(static fn($b) => [
            'id' => (int) $b['id'],
            'createdAt' => (string) $b['created_at'],
            'subject' => (string) $b['subject'],
            'recipientCount' => (int) $b['recipient_count'],
            'sentCount' => (int) $b['sent_count'],
            'skippedCount' => (int) $b['skipped_count'],
            'status' => (string) $b['status'],
        ], ech_broadcasts_list(50))]);
    } catch (Throwable $e) {
        error_log('[admin-broadcast] history failed: ' . $e->getMessage());
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
$q = trim((string) ($body['q'] ?? ''));
$status = trim((string) ($body['status'] ?? ''));
if ($status !== '' && !in_array($status, ['new', 'contacted', 'interested', 'converted', 'lost'], true)) {
    ech_json(['ok' => false, 'message' => 'Unknown status filter.'], 400);
}

try {
    if ($action === 'preview') {
        $seg = ech_broadcast_recipients($q, $status);
        ech_json([
            'ok' => true,
            'recipientCount' => count($seg['recipients']),
            'skipped' => $seg['skipped'],
            'cap' => ECH_BROADCAST_CAP,
            'sample' => array_map(static fn($r) => ['name' => $r['name'], 'email' => $r['email']], array_slice($seg['recipients'], 0, 8)),
        ]);
    }

    if ($action === 'send') {
        $subject = trim((string) ($body['subject'] ?? ''));
        $html = trim((string) ($body['html'] ?? ''));
        if ($subject === '' || mb_strlen($subject) > 200) {
            ech_json(['ok' => false, 'message' => 'Subject is required (max 200 chars).'], 400);
        }
        if ($html === '' || mb_strlen($html) > 100000) {
            ech_json(['ok' => false, 'message' => 'Message body is required.'], 400);
        }
        $key = ech_runtime_secret('TOSEND_API_KEY');
        if ($key === '') {
            ech_json(['ok' => false, 'message' => 'Email sending is not configured (TOSEND_API_KEY).'], 503);
        }
        $from = ech_parse_from((string) (ech_runtime_secret('MAIL_FROM') ?: 'Elevate Career Hub <noreply@elevatecareerhub.com>'));

        $seg = ech_broadcast_recipients($q, $status);
        $recipients = array_slice($seg['recipients'], 0, ECH_BROADCAST_CAP);
        $sent = 0;
        $failed = 0;
        foreach ($recipients as $r) {
            $tokenUrl = ech_campaign_unsubscribe_url($r);
            $wrapped = '<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#12213f;">'
                . $html
                . '<p style="margin-top:32px;font-size:12px;color:#667085;">You are receiving this because you requested a Grad School Match report. '
                . '<a href="' . ech_esc($tokenUrl) . '" style="color:#667085;">Unsubscribe</a>.</p></div>';
            try {
                ech_tosend_send($key, $from, [['email' => $r['email']]], $subject, $wrapped);
                $sent++;
            } catch (Throwable $e) {
                $failed++;
                error_log('[admin-broadcast] send to ' . $r['email'] . ' failed: ' . $e->getMessage());
            }
        }
        $skipped = $seg['skipped'] + max(0, count($seg['recipients']) - count($recipients));
        $statusStr = $failed === 0 ? 'sent' : ($sent > 0 ? 'partial' : 'failed');
        ech_broadcast_insert($subject, $html, ['q' => $q, 'status' => $status], count($recipients), $sent, $skipped, $statusStr);
        ech_json(['ok' => true, 'sent' => $sent, 'failed' => $failed, 'skipped' => $skipped, 'cap' => ECH_BROADCAST_CAP, 'segmentEligible' => count($seg['recipients'])]);
    }

    ech_json(['ok' => false, 'message' => 'Unknown action.'], 400);
} catch (Throwable $e) {
    error_log('[admin-broadcast] failed: ' . $e->getMessage());
    ech_json(['ok' => false, 'message' => 'Database is unreachable. Try again shortly.'], 503);
}
