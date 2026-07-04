<?php
/**
 * Admin: single-lead detail + pipeline actions.
 *
 *   GET  ?uid=gsm-...        -> lead, notes, campaign timeline (sent + upcoming),
 *                               matched purchases, suppression state, unsubscribe URL
 *   POST {uid, action: 'status', status}          -> set pipeline status
 *   POST {uid, action: 'note-add', body}          -> add a note
 *   POST {uid, action: 'note-delete', noteId}     -> delete a note
 */
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/store.php';
require_once __DIR__ . '/lead-campaign.php';
ech_admin_require();

$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    $uid = trim((string) ($_GET['uid'] ?? ''));
    if ($uid === '') {
        ech_json(['ok' => false, 'message' => 'Missing uid.'], 400);
    }
    try {
        $row = ech_lead_by_uid($uid);
        if (!$row) {
            ech_json(['ok' => false, 'message' => 'Lead not found.'], 404);
        }
        $dbId = (int) $row['id'];
        $lead = ech_lead_row_to_legacy($row);

        $sends = [];
        foreach (ech_sends_for($dbId) as $s) {
            $sends[(string) $s['step']] = ['status' => (string) $s['status'], 'sentAt' => (string) $s['sent_at']];
        }

        // Full timeline: every step of this lead's track, past and upcoming.
        $created = strtotime($lead['createdAt']) ?: time();
        $timeline = [];
        foreach (ech_campaign_steps($lead) as $step) {
            $key = (string) $step['key'];
            $timeline[] = [
                'step' => $key,
                'dueAt' => gmdate('c', $created + (int) $step['delay']),
                'status' => isset($sends[$key]) ? $sends[$key]['status'] : 'upcoming',
                'sentAt' => $sends[$key]['sentAt'] ?? null,
            ];
        }

        ech_json([
            'ok' => true,
            'lead' => $lead,
            'notes' => array_map(static fn($n) => [
                'id' => (int) $n['id'],
                'body' => (string) $n['body'],
                'createdAt' => (string) $n['created_at'],
            ], ech_note_list($dbId)),
            'timeline' => $timeline,
            'purchases' => ech_purchases_for_email($lead['email']),
            'suppressed' => ech_suppression_for($lead['email']),
            'campaignEnrolled' => $lead['campaignEnrolled'],
            'unsubscribeUrl' => ech_campaign_unsubscribe_url($lead),
        ]);
    } catch (Throwable $e) {
        error_log('[admin-lead] detail failed: ' . $e->getMessage());
        ech_json(['ok' => false, 'message' => 'Lead database is unreachable. Try again shortly.'], 503);
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
$uid = trim((string) ($body['uid'] ?? ''));
$action = (string) ($body['action'] ?? '');
if ($uid === '') {
    ech_json(['ok' => false, 'message' => 'Missing uid.'], 400);
}

try {
    $row = ech_lead_by_uid($uid);
    if (!$row) {
        ech_json(['ok' => false, 'message' => 'Lead not found.'], 404);
    }
    $dbId = (int) $row['id'];

    if ($action === 'status') {
        $status = (string) ($body['status'] ?? '');
        if (!ech_lead_set_status($uid, $status)) {
            ech_json(['ok' => false, 'message' => 'Unknown status.'], 400);
        }
        ech_json(['ok' => true, 'status' => $status]);
    }

    if ($action === 'note-add') {
        $note = trim((string) ($body['body'] ?? ''));
        if ($note === '' || mb_strlen($note) > 4000) {
            ech_json(['ok' => false, 'message' => 'Note must be 1-4000 characters.'], 400);
        }
        $created = ech_note_add($dbId, $note);
        ech_json(['ok' => true, 'note' => [
            'id' => (int) ($created['id'] ?? 0),
            'body' => (string) ($created['body'] ?? $note),
            'createdAt' => (string) ($created['created_at'] ?? gmdate('c')),
        ]]);
    }

    if ($action === 'note-delete') {
        $noteId = (int) ($body['noteId'] ?? 0);
        if ($noteId <= 0) {
            ech_json(['ok' => false, 'message' => 'Missing noteId.'], 400);
        }
        ech_note_delete($dbId, $noteId);
        ech_json(['ok' => true]);
    }

    ech_json(['ok' => false, 'message' => 'Unknown action.'], 400);
} catch (Throwable $e) {
    error_log('[admin-lead] action failed: ' . $e->getMessage());
    ech_json(['ok' => false, 'message' => 'Lead database is unreachable. Try again shortly.'], 503);
}
