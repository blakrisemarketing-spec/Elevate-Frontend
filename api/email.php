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

function send_fulfilment(array $item, string $reference, string $buyerName, string $buyerEmail): void {
    $key = getenv('TOSEND_API_KEY') ?: '';
    $team = getenv('OPS_EMAIL') ?: 'elevatewithnll@gmail.com';
    $from = ech_parse_from((string) (getenv('MAIL_FROM') ?: 'Elevate Career Hub <noreply@elevatecareerhub.com>'));
    $base = rtrim((string) (getenv('PUBLIC_APP_BASE_URL') ?: ''), '/');
    $price = ech_format_cedis((int) ($item['amountPesewas'] ?? 0));
    $name = (string) ($item['name'] ?? 'your purchase');
    $type = (string) ($item['type'] ?? 'service');
    $download = !empty($item['deliverablePath']) ? $base . $item['deliverablePath'] : '';

    if ($key === '') {
        error_log('[email] TOSEND_API_KEY missing — would send fulfilment: ' . json_encode([
            'item' => $name, 'reference' => $reference, 'buyer' => $buyerEmail, 'team' => $team, 'download' => $download,
        ]));
        return;
    }

    // 1) Team notification
    $teamHtml = '<h2>New purchase</h2>'
        . '<p><strong>' . ech_esc($name) . '</strong> — ' . $price . '</p>'
        . '<ul><li>Type: ' . ech_esc($type) . '</li>'
        . '<li>Buyer: ' . ech_esc($buyerName !== '' ? $buyerName : '(name not provided)') . ' &lt;' . ech_esc($buyerEmail !== '' ? $buyerEmail : 'no email') . '&gt;</li>'
        . '<li>Paystack reference: ' . ech_esc($reference) . '</li></ul>'
        . ($type === 'service'
            ? '<p>Action: reach out to the buyer to begin the service.</p>'
            : '<p>Digital product' . ($download !== '' ? ' — link: <a href="' . ech_esc($download) . '">' . ech_esc($download) . '</a>' : ' (no deliverable configured)') . '.</p>');
    ech_tosend_send($key, $from, [['email' => $team]], 'New purchase: ' . $name . ' (' . $price . ')', $teamHtml);

    // 2) Buyer confirmation
    if ($buyerEmail !== '') {
        $buyerHtml = '<p>Hi ' . ech_esc($buyerName !== '' ? $buyerName : 'there') . ',</p>'
            . '<p>Thank you for your purchase of <strong>' . ech_esc($name) . '</strong> (' . $price . '). Your payment reference is <strong>' . ech_esc($reference) . '</strong>.</p>'
            . ($type === 'service'
                ? '<p>Our team will reach out to you shortly to get started. If you need us sooner, reply to this email or message us on WhatsApp at +233 53 111 3454.</p>'
                : ($download !== ''
                    ? '<p>You can download your product here: <a href="' . ech_esc($download) . '">' . ech_esc($name) . '</a>.</p><p>If the link does not work, reply to this email and we will send it directly.</p>'
                    : '<p>Our team will email your product shortly.</p>'))
            . '<p>— Elevate Career Hub</p>';
        ech_tosend_send($key, $from, [['email' => $buyerEmail]], 'Your Elevate Career Hub purchase: ' . $name, $buyerHtml);
    }
}
