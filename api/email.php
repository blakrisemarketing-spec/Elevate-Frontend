<?php
/**
 * Fulfilment emails via toSend (https://api.tosend.com/v2/emails).
 *
 * Contract (verified against tosend.com/docs + the official SDK):
 *   POST https://api.tosend.com/v2/emails
 *   Authorization: Bearer tsend_...
 *   { "from": {"email","name"}, "to": [{"email"}], "subject", "html" }
 *
 * Degrades gracefully: with no TOSEND_API_KEY it logs what it would send and
 * returns, so the payment flow is testable without the email account. A failed
 * send never invalidates a real payment (the caller swallows exceptions).
 *
 * Env: TOSEND_API_KEY, OPS_EMAIL, MAIL_FROM, PUBLIC_APP_BASE_URL
 */
declare(strict_types=1);

function ech_esc(string $s): string {
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

function ech_format_cedis(int $pesewas): string {
    $decimals = ($pesewas % 100 === 0) ? 0 : 2;
    return '₵' . number_format($pesewas / 100, $decimals);
}

/** Parse MAIL_FROM ("Name <email>" or bare "email") into toSend's {name,email}. */
function ech_parse_from(string $raw): array {
    if (preg_match('/^\s*(.*?)\s*<([^>]+)>\s*$/', $raw, $m)) {
        return ['name' => $m[1] !== '' ? $m[1] : 'Elevate Career Hub', 'email' => trim($m[2])];
    }
    return ['name' => 'Elevate Career Hub', 'email' => trim($raw)];
}

/** POST one email to toSend. Throws on transport or non-2xx response. */
function ech_tosend_send(string $key, array $from, array $to, string $subject, string $html): void {
    $payload = ['from' => $from, 'to' => $to, 'subject' => $subject, 'html' => $html];
    $ch = curl_init('https://api.tosend.com/v2/emails');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $key, 'Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 20,
    ]);
    $res = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    if ($res === false) {
        throw new RuntimeException('toSend transport error: ' . $err);
    }
    if ($code < 200 || $code >= 300) {
        throw new RuntimeException('toSend ' . $code . ': ' . substr((string) $res, 0, 300));
    }
}

function send_fulfilment(array $item, string $reference, string $buyerName, string $buyerEmail, array $sessions = [], ?int $amountPesewas = null): void {
    $key = getenv('TOSEND_API_KEY') ?: '';
    $team = getenv('OPS_EMAIL') ?: 'hello@elevatecareerhub.com';
    $from = ech_parse_from((string) (getenv('MAIL_FROM') ?: 'Elevate Career Hub <noreply@elevatecareerhub.com>'));
    $base = rtrim((string) (getenv('PUBLIC_APP_BASE_URL') ?: ''), '/');
    $price = ech_format_cedis($amountPesewas ?? (int) ($item['amountPesewas'] ?? 0));
    $name = (string) ($item['name'] ?? 'your purchase');
    $type = (string) ($item['type'] ?? 'service');
    $download = !empty($item['deliverablePath']) ? $base . $item['deliverablePath'] : '';

    // Selected sessions (drop-in): rendered as an HTML list for both emails.
    $sessions = array_values(array_filter(array_map('strval', $sessions), fn($s) => trim($s) !== ''));
    $sessionsListHtml = '';
    if (!empty($sessions)) {
        $sessionsListHtml = '<ul>' . implode('', array_map(fn($s) => '<li>' . ech_esc($s) . '</li>', $sessions)) . '</ul>';
    }

    if ($key === '') {
        error_log('[email] TOSEND_API_KEY missing, would send fulfilment: ' . json_encode([
            'item' => $name, 'reference' => $reference, 'buyer' => $buyerEmail, 'team' => $team, 'download' => $download,
            'sessions' => $sessions, 'amount' => $price,
        ]));
        return;
    }

    // 1) Team notification
    $teamHtml = '<h2>New purchase</h2>'
        . '<p><strong>' . ech_esc($name) . '</strong>, ' . $price . '</p>'
        . '<ul><li>Type: ' . ech_esc($type) . '</li>'
        . '<li>Buyer: ' . ech_esc($buyerName !== '' ? $buyerName : '(name not provided)') . ' &lt;' . ech_esc($buyerEmail !== '' ? $buyerEmail : 'no email') . '&gt;</li>'
        . '<li>Paystack reference: ' . ech_esc($reference) . '</li></ul>'
        . (!empty($sessions) ? '<p><strong>Sessions booked (' . count($sessions) . '):</strong></p>' . $sessionsListHtml : '')
        . ($type === 'service'
            ? '<p>Action: reach out to the buyer to begin the service.</p>'
            : '<p>Digital product' . ($download !== '' ? ', link: <a href="' . ech_esc($download) . '">' . ech_esc($download) . '</a>' : ' (no deliverable configured)') . '.</p>');
    ech_tosend_send($key, $from, [['email' => $team]], 'New purchase: ' . $name . ' (' . $price . ')', $teamHtml);

    // 2) Buyer confirmation
    if ($buyerEmail !== '') {
        $buyerHtml = '<p>Hi ' . ech_esc($buyerName !== '' ? $buyerName : 'there') . ',</p>'
            . '<p>Thank you for your purchase of <strong>' . ech_esc($name) . '</strong> (' . $price . '). Your payment reference is <strong>' . ech_esc($reference) . '</strong>.</p>'
            . (!empty($sessions) ? '<p>You booked these sessions:</p>' . $sessionsListHtml : '')
            . ($type === 'service'
                ? '<p>Our team will reach out to you shortly to get started. If you need us sooner, reply to this email or message us on WhatsApp at +233 53 111 3454.</p>'
                : ($download !== ''
                    ? '<p>You can download your product here: <a href="' . ech_esc($download) . '">' . ech_esc($name) . '</a>.</p><p>If the link does not work, reply to this email and we will send it directly.</p>'
                    : '<p>Our team will email your product shortly.</p>'))
            . '<p>,  Elevate Career Hub</p>';
        ech_tosend_send($key, $from, [['email' => $buyerEmail]], 'Your Elevate Career Hub purchase: ' . $name, $buyerHtml);
    }
}

/** Render a list of matched items ([{name, blurb}, ...]) as an HTML <ul>. */
function ech_render_match_list(array $items): string {
    if (empty($items)) {
        return '<p>(none matched)</p>';
    }
    $rows = array_map(static function ($it) {
        $name = ech_esc((string) ($it['name'] ?? ''));
        $blurb = ech_esc((string) ($it['blurb'] ?? ''));
        return '<li><strong>' . $name . '</strong>' . ($blurb !== '' ? ': ' . $blurb : '') . '</li>';
    }, $items);
    return '<ul>' . implode('', $rows) . '</ul>';
}

/** Top destination phrase from the answers, mirrors destinationPhrase() in match-data.ts. */
function ech_match_destination_phrase(array $answers): string {
    $dests = $answers['destinations'] ?? [];
    if (!is_array($dests)) {
        $dests = [$dests];
    }
    $order = [
        'us' => 'in the United States',
        'uk' => 'in the UK',
        'canada' => 'in Canada',
        'europe' => 'in Europe',
        'australia' => 'in Australia',
        'africa' => 'across Africa',
    ];
    foreach ($order as $v => $phrase) {
        if (in_array($v, $dests, true)) {
            return $phrase;
        }
    }
    return 'abroad';
}

/** Optimistic, goal-driven motivation from "reason" + destination. Mirrors motivationFor() in match-data.ts. */
function ech_match_motivation(array $answers): array {
    $reason = $answers['reason'] ?? 'prestige';
    if (is_array($reason)) {
        $reason = $reason[0] ?? 'prestige';
    }
    $where = ech_match_destination_phrase($answers);
    $map = [
        'immigration' => [
            'headline' => 'That new life ' . $where . ' is closer than it feels',
            'body' => 'Building a life ' . $where . ' is not a long shot or a daydream. People with your exact background do it every single year, and grad school is one of the most reliable ways in. Here is your route.',
        ],
        'career-switch' => [
            'headline' => 'Your career switch starts right here',
            'body' => 'Reinventing yourself takes guts, and grad school is one of the cleanest ways to do it. Studying ' . $where . ' is genuinely on the table for you. Let us make the pivot real.',
        ],
        'promotion' => [
            'headline' => 'Time to level all the way up',
            'body' => 'The right master\'s or MBA is rocket fuel for a career, and studying ' . $where . ' is well within your reach. Let us turn the ambition into an offer.',
        ],
        'research-career' => [
            'headline' => 'The research world needs you in it',
            'body' => 'Funded research places and PhDs ' . $where . ' are real, and you can absolutely win one. Your ideas deserve a seat at the table, and we will help you claim it.',
        ],
        'prestige' => [
            'headline' => 'Aim high, you have earned the right',
            'body' => 'A world-class school on your CV is not reserved for insiders, and studying ' . $where . ' is not out of your league. Let us go get it.',
        ],
    ];
    return $map[$reason] ?? $map['prestige'];
}

/**
 * Grad School Match emails: (1) the personalized report to the visitor and
 * (2) a lead notification to the team. Pathways/scholarships are arrays of
 * {name, blurb} resolved from match-config.json by the caller, so the email
 * content cannot be spoofed by the browser. Degrades gracefully without a key.
 *
 * Env: TOSEND_API_KEY, OPS_EMAIL, MAIL_FROM, PUBLIC_APP_BASE_URL.
 */
function send_match_emails(
    string $name,
    string $email,
    string $phone,
    array $answers,
    array $pathways,
    array $scholarships,
    string $linkedin = '',
    string $portfolio = '',
    string $cvFile = ''
): void {
    $key = getenv('TOSEND_API_KEY') ?: '';
    $team = getenv('OPS_EMAIL') ?: 'hello@elevatecareerhub.com';
    $from = ech_parse_from((string) (getenv('MAIL_FROM') ?: 'Elevate Career Hub <noreply@elevatecareerhub.com>'));
    $base = rtrim((string) (getenv('PUBLIC_APP_BASE_URL') ?: 'https://elevatecareerhub.com'), '/');
    $bootcampUrl = $base . '/get-into-grad-school-bootcamp/#tickets';

    $pathHtml = ech_render_match_list($pathways);
    $scholHtml = ech_render_match_list($scholarships);

    if ($key === '') {
        error_log('[email] TOSEND_API_KEY missing, would send match report to ' . $email . ' and notify ' . $team);
        return;
    }

    // 1) Visitor report, optimistic + goal-driven + clearly automated/instant.
    $mot = ech_match_motivation($answers);
    $userHtml = '<p>Hi ' . ech_esc($name !== '' ? $name : 'there') . ',</p>'
        . '<h2>' . ech_esc($mot['headline']) . '</h2>'
        . '<p>' . ech_esc($mot['body']) . '</p>'
        . '<p>This report was built automatically from your answers the moment you hit submit, no waiting on anyone. Here is what fits you right now.</p>'
        . '<h3>Program pathways you qualify for</h3>' . $pathHtml
        . '<h3>Scholarships worth targeting</h3>' . $scholHtml
        . '<p>One honesty note: the final yes on funding sits with each provider. Our job is to make your case impossible to ignore. The Get Into Grad School Bootcamp shows you exactly how, from school selection to visa.</p>'
        . '<p><a href="' . ech_esc($bootcampUrl) . '">See the bootcamp and ticket options</a></p>'
        . ($cvFile !== '' ? '<p>Thanks for sharing your CV. A real human on our team will review it and follow up with notes.</p>' : '')
        . '<p>, Elevate Career Hub</p>';
    ech_tosend_send($key, $from, [['email' => $email]], 'Your grad school matches are in, ' . ($name !== '' ? $name : 'friend'), $userHtml);

    // 2) Team notification
    $answerRows = '';
    foreach ($answers as $k => $v) {
        $val = is_array($v) ? implode(', ', array_map('strval', $v)) : (string) $v;
        $answerRows .= '<li>' . ech_esc((string) $k) . ': ' . ech_esc($val) . '</li>';
    }
    $teamHtml = '<h2>New grad school match lead</h2>'
        . '<ul>'
        . '<li>Name: ' . ech_esc($name) . '</li>'
        . '<li>Email: ' . ech_esc($email) . '</li>'
        . '<li>WhatsApp: ' . ech_esc($phone) . '</li>'
        . ($linkedin !== '' ? '<li>LinkedIn: ' . ech_esc($linkedin) . '</li>' : '')
        . ($portfolio !== '' ? '<li>Portfolio: ' . ech_esc($portfolio) . '</li>' : '')
        . ($cvFile !== '' ? '<li>CV uploaded: api/_leads/cv/' . ech_esc($cvFile) . '</li>' : '<li>CV: not provided</li>')
        . '</ul>'
        . '<h3>Answers</h3><ul>' . $answerRows . '</ul>'
        . '<h3>Matched pathways</h3>' . $pathHtml
        . '<h3>Matched scholarships</h3>' . $scholHtml;
    ech_tosend_send($key, $from, [['email' => $team]], 'New grad school match lead: ' . ($name !== '' ? $name : $email), $teamHtml);
}
