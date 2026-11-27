<?php
/**
 * Portal: the client sends the team a message (question, revision request).
 * POST {body, engagementId?}. Logged on the client's timeline and emailed to OPS_EMAIL.
 */
declare(strict_types=1);

require __DIR__ . '/portal-auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}
ech_portal_require_same_origin();
$client = ech_portal_require();
$body = ech_request_json();

ech_ops_run('portal-message', function () use ($client, $body) {
    $text = mb_substr(trim((string) ($body['body'] ?? '')), 0, 3000);
    if ($text === '') {
        throw new InvalidArgumentException('Write a message first.');
    }
    $cid = (int) $client['id'];
    // Rate limit: 10 messages per hour per client.
    $recent = ech_sb_select('ech_activity', 'select=id&client_id=eq.' . $cid . '&kind=eq.client_message&created_at=gte.' . rawurlencode(gmdate('c', time() - 3600)));
    if (count($recent) >= 10) {
        throw new InvalidArgumentException('You have sent several messages in the last hour. The team will reply soon.');
    }
    $engId = (int) ($body['engagementId'] ?? 0);
    $title = '';
    if ($engId > 0) {
        $eng = ech_engagement_get($engId);
        if (!$eng || (int) $eng['client_id'] !== $cid) {
            $engId = 0;
        } else {
            $title = (string) $eng['title'];
        }
    }
    ech_activity_log([
        'actor' => 'client:' . $cid,
        'actor_name' => (string) $client['name'],
        'client_id' => $cid,
        'engagement_id' => $engId > 0 ? $engId : null,
        'kind' => 'client_message',
        'summary' => ($title !== '' ? $title . ': ' : '') . $text,
        'client_visible' => true,
    ]);
    $key = ech_runtime_secret('TOSEND_API_KEY');
    if ($key !== '') {
        try {
            $ops = ech_runtime_secret('OPS_EMAIL') ?: 'hello@elevatecareerhub.com';
            $from = ech_parse_from((string) (ech_runtime_secret('MAIL_FROM') ?: 'Elevate Career Hub <noreply@elevatecareerhub.com>'));
            $admin = ech_portal_base_url() . '/admin/';
            ech_tosend_send($key, $from, [['email' => $ops]], 'Portal message from ' . ($client['name'] ?: $client['email']),
                '<p><strong>' . ech_esc((string) ($client['name'] ?: $client['email'])) . '</strong> (' . ech_esc((string) $client['email']) . ') wrote'
                . ($title !== '' ? ' about <strong>' . ech_esc($title) . '</strong>' : '') . ':</p>'
                . '<blockquote>' . nl2br(ech_esc($text)) . '</blockquote>'
                . '<p><a href="' . ech_esc($admin) . '">Open the admin workspace</a></p>');
        } catch (Throwable $e) {
            error_log('[portal-message] ops email failed: ' . $e->getMessage());
        }
    }
    ech_json(['ok' => true]);
});
