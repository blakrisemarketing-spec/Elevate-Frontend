<?php
/**
 * Grad School Match bootcamp nurture campaign.
 *
 * Leads are enrolled at insert time by api/quiz-lead.php (campaign_enrolled
 * column). The GitHub Actions cron calls api/run-lead-campaign.php, which
 * sends due emails through toSend and records each send in Supabase
 * (campaign_sends, UNIQUE (lead_id, step)) so retries are safe. Suppressions
 * (unsubscribes, admin holds) live in campaign_suppressions; bootcamp buyers
 * are auto-excluded by the campaign_due_leads() SQL function.
 */
declare(strict_types=1);

require_once __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/email.php';
require_once __DIR__ . '/store.php';

const ECH_BOOTCAMP_URL = 'https://elevatecareerhub.com/get-into-grad-school-bootcamp/#tickets';

/** Path for the runner's flock lock file (ephemeral, per-host, fine on disk). */
function ech_campaign_lock_path(): string {
    return ech_private_data_dir() . '/lead-campaign.lock';
}

function ech_campaign_first_name(string $name): string {
    $parts = preg_split('/\s+/', trim($name));
    return $parts && $parts[0] !== '' ? mb_substr($parts[0], 0, 80) : 'there';
}

function ech_campaign_answer(array $lead, string $key): string {
    $answers = is_array($lead['answers'] ?? null) ? $lead['answers'] : [];
    $value = $answers[$key] ?? '';
    if (is_array($value)) {
        return (string) ($value[0] ?? '');
    }
    return (string) $value;
}

function ech_campaign_destination(array $lead): string {
    $answers = is_array($lead['answers'] ?? null) ? $lead['answers'] : [];
    return str_replace(['in the ', 'across '], '', ech_match_destination_phrase($answers));
}

function ech_campaign_goal_label(string $reason): string {
    return [
        'career-switch' => 'switching into a new career',
        'promotion' => 'leveling up where you already are',
        'research-career' => 'building a research career',
        'immigration' => 'moving and building a life abroad',
        'prestige' => 'earning a world-class school name',
    ][$reason] ?? 'getting into the right graduate program';
}

function ech_campaign_blocker_label(string $blocker): string {
    return [
        'funding' => 'finding the money and scholarships',
        'essays' => 'writing essays and statements',
        'school-selection' => 'picking the right schools',
        'low-gpa' => 'your grades feeling too low',
        'visa' => 'visas and the whole moving process',
        'start' => 'not knowing where to start',
    ][$blocker] ?? 'figuring out the next step';
}

function ech_campaign_top_match(array $lead): string {
    $pathways = is_array($lead['pathways'] ?? null) ? $lead['pathways'] : [];
    $first = $pathways[0] ?? null;
    return is_array($first) && !empty($first['name']) ? (string) $first['name'] : 'your strongest graduate school route';
}

function ech_campaign_html(string $firstName, string $body, string $cta, string $url, string $tokenUrl): string {
    return '<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#12213f;">'
        . $body
        . '<p style="margin:28px 0;"><a href="' . ech_esc($url) . '" style="display:inline-block;background:#0077B6;color:#ffffff;text-decoration:none;font-weight:800;padding:14px 22px;border-radius:999px;">' . ech_esc($cta) . '</a></p>'
        . '<p>Cheering you on,<br>Naa and Rosemary<br>Elevate Career Hub</p>'
        . '<p style="margin-top:32px;font-size:12px;color:#667085;">You are getting this because you requested a Grad School Match report. <a href="' . ech_esc($tokenUrl) . '" style="color:#667085;">Unsubscribe from bootcamp follow-ups</a>.</p>'
        . '</div>';
}

function ech_campaign_unsubscribe_url(array $lead): string {
    $base = rtrim((string) (ech_runtime_secret('PUBLIC_APP_BASE_URL') ?: 'https://elevatecareerhub.com'), '/');
    $id = (string) ($lead['id'] ?? '');
    $email = strtolower((string) ($lead['email'] ?? ''));
    $secret = ech_runtime_secret('ADMIN_PASSWORD') ?: ech_runtime_secret('CRON_SECRET') ?: 'elevate';
    $token = hash_hmac('sha256', $id . '|' . $email, $secret);
    return $base . '/api/lead-campaign-unsubscribe.php?id=' . rawurlencode($id) . '&token=' . rawurlencode($token);
}

function ech_campaign_verify_unsubscribe_token(string $id, string $email, string $token): bool {
    $secret = ech_runtime_secret('ADMIN_PASSWORD') ?: ech_runtime_secret('CRON_SECRET') ?: 'elevate';
    $expected = hash_hmac('sha256', $id . '|' . strtolower($email), $secret);
    return hash_equals($expected, $token);
}

function ech_campaign_email(array $lead, string $step): ?array {
    $first = ech_campaign_first_name((string) ($lead['name'] ?? ''));
    $reason = ech_campaign_answer($lead, 'reason');
    $blocker = ech_campaign_answer($lead, 'blocker');
    $timeline = ech_campaign_answer($lead, 'timeline');
    $qualification = ech_campaign_answer($lead, 'qualification');
    $funding = ech_campaign_answer($lead, 'funding');
    $budget = ech_campaign_answer($lead, 'budget');
    $destination = ech_campaign_destination($lead);
    $topMatch = ech_campaign_top_match($lead);
    $blockerLabel = ech_campaign_blocker_label($blocker);
    $lowGrade = in_array($qualification, ['2:2', 'third'], true)
        ? '<p>And before you talk yourself out of this over your grades: a lower class changes the strategy, not the outcome. We have got you.</p>'
        : '';
    $needsFunding = ($funding === 'full' || $budget === 'under-5k')
        ? '<p>You do not need rich parents or a huge savings account for this. You need the right scholarships and the system to win them.</p>'
        : '';
    $slowLane = in_array($timeline, ['next-year', 'exploring'], true);
    $tokenUrl = ech_campaign_unsubscribe_url($lead);

    if ($slowLane && in_array($step, ['e6', 'e7'], true)) {
        return null;
    }

    if ($step === 'e1') {
        $body = '<p>Hi ' . ech_esc($first) . ',</p>'
            . '<p>Your match report is sitting in your inbox, and if you are like most people who take our quiz, you have probably already screenshotted the scholarships you liked. Good. Keep them somewhere safe.</p>'
            . '<p>Here is the part nobody tells you though. Getting matched to <strong>' . ech_esc($topMatch) . '</strong> is the easy bit. Plenty of people qualify for the same programs and scholarships you do. The ones who actually get the offer, and the funding, are the ones who know how to position themselves.</p>'
            . '<p>That is the whole game. Not your grades, not who you know. The story you tell and how you tell it.</p>';
        return ['subject' => 'Matching was the easy part, ' . $first, 'cta' => 'See the bootcamp that makes it happen', 'html' => ech_campaign_html($first, $body, 'See the bootcamp that makes it happen', ECH_BOOTCAMP_URL, $tokenUrl)];
    }

    if ($step === 'e2') {
        $variants = [
            'immigration' => ['Your life in ' . $destination . ' is closer than the headlines suggest', '<p>Hi ' . ech_esc($first) . ',</p><p>You told us the real goal: moving and building a life in ' . ech_esc($destination) . '. Not a holiday. A life.</p><p>The door is still wide open for a student with a funded offer. Grad school is one of the cleanest, most legal routes to living and working abroad, and it usually comes with a study-to-work pathway most people do not even know to ask for.</p><p>The bootcamp gives you that system: school selection, funding strategy, and visa prep in the right order.</p>'],
            'career-switch' => ['Your "random" background is actually your edge', '<p>Hi ' . ech_esc($first) . ',</p><p>Switching into a new career is brave, and grad school is one of the few resets that genuinely works.</p><p>Most switchers hide their old career like it is a weakness. It is the opposite. The accountant moving into public health, the teacher moving into data, that journey is your most interesting story. You just have to frame it right.</p><p>That is exactly what the bootcamp helps you do.</p>'],
            'promotion' => ['The raise is on the other side of this degree', '<p>Hi ' . ech_esc($first) . ',</p><p>You are not lost. You are good at what you do and you want to go further, faster. The right master&apos;s or MBA is one of the most reliable ways to do it.</p><p>The trick is doing it without drowning in tuition. The bootcamp shows you how to choose well, apply strongly, and target funding that makes the ROI make sense.</p>'],
            'research-career' => ['How to get a supervisor to say yes, and fund you', '<p>Hi ' . ech_esc($first) . ',</p><p>Building a research career can feel like a closed club. Here is the secret: the strongest funded applicants are often not the most published. They are the ones who pitch a supervisor a project that supervisor actually wants to run.</p><p>That is a skill, and it is learnable. Session 5 is the whole playbook.</p>'],
            'prestige' => ['Top schools are not reserved for insiders', '<p>Hi ' . ech_esc($first) . ',</p><p>Let us name it: you want a world-class school on your CV. Oxford, LSE, Columbia, Harvard, the names that open rooms.</p><p>They are not reserved for insiders. They are for people who understand what committees look for and build an application around it. That is what the bootcamp teaches.</p>'],
        ];
        [$subject, $body] = $variants[$reason] ?? $variants['prestige'];
        $body .= $lowGrade . $needsFunding;
        return ['subject' => $subject, 'cta' => 'Show me the route', 'html' => ech_campaign_html($first, $body, 'Show me the route', ECH_BOOTCAMP_URL, $tokenUrl)];
    }

    if ($step === 'e3') {
        $fixes = [
            'funding' => 'Most people believe scholarships go to a tiny group of perfect students. Wrong. The biggest reason people do not get funded is that they apply to the wrong ones, apply too late, or apply with a generic essay. Session 7 fixes that.',
            'essays' => 'Strong essays are not about fancy writing. They are about a clear narrative: who you are, why this, why now. Session 4 gives you the framework.',
            'school-selection' => 'Picking schools on reputation alone is how smart people waste an application cycle. Session 1 helps you build a list around fit, funding, and your real goal.',
            'low-gpa' => 'A lower grade does not automatically close the door. It changes the route. Session 2 shows you how to make the rest of your profile do the talking.',
            'visa' => 'The visa and moving process feels like a black box, but it is actually a checklist. Session 8 takes you from document prep to interview confidence.',
            'start' => 'Not knowing where to start is honest, and common. The bootcamp gives you the order: school selection, profile, essays, funding, visa.',
        ];
        $body = '<p>Hi ' . ech_esc($first) . ',</p><p>When we asked what is stressing you out most, you said: <strong>' . ech_esc($blockerLabel) . '</strong>. So let us talk about that, because it is more fixable than it feels right now.</p><p>' . ech_esc($fixes[$blocker] ?? $fixes['start']) . '</p>';
        return ['subject' => 'Let us fix ' . $blockerLabel, 'cta' => 'Fix this with me', 'html' => ech_campaign_html($first, $body, 'Fix this with me', ECH_BOOTCAMP_URL, $tokenUrl)];
    }

    if ($step === 'e4') {
        $body = '<p>Hi ' . ech_esc($first) . ',</p><p>There is a lot of grad school advice online, and most of it is written by people who never actually won the scholarship or got the offer. That is the difference here.</p><p>The bootcamp is run by people with the receipts: Chevening, DAAD, Mastercard and Forte scholars, MBAs from Columbia, Duke and Kellogg, plus admissions and visa specialists who have sat on the other side of the desk.</p><p>You bring the goal. They bring the map.</p>';
        return ['subject' => 'The people teaching you have the receipts', 'cta' => 'Meet your facilitators', 'html' => ech_campaign_html($first, $body, 'Meet your facilitators', ECH_BOOTCAMP_URL, $tokenUrl)];
    }

    if ($step === 'e5') {
        $body = '<p>Hi ' . ech_esc($first) . ',</p><p>Let us talk money, plainly. The full bootcamp is GHS 1,500. I know that is real money. So here is the honest math.</p><p>One wasted application cycle, the rejections, the re-takes, the missed scholarship deadlines, costs you a year of your life and far more than GHS 1,500 in application and test fees alone.</p><p>You also get more than the 8 live sessions: the 50+ scholarship funding pack, the 30+ low-tuition school list, 90 days of replays, and a WhatsApp community walking it with you.</p>' . $lowGrade;
        return ['subject' => 'Is it worth GHS 1,500? Let us do the math', 'cta' => 'Register now', 'html' => ech_campaign_html($first, $body, 'Register now', ECH_BOOTCAMP_URL, $tokenUrl)];
    }

    if ($step === 'e6') {
        $body = '<p>Hi ' . ech_esc($first) . ',</p><p>Quick, honest heads up. Registration for the Get Into Grad School Bootcamp is open, and seats are limited because the sessions are live, not a faceless recording.</p><p>The full pass is now GHS 1,500 and includes all 8 sessions, bonuses, recordings and community access.</p><p>You already know which programs and scholarships fit you, we matched you. The only thing between you and actually winning them is the system the bootcamp teaches.</p>';
        return ['subject' => 'Seats are going for the grad school bootcamp', 'cta' => 'Lock in my seat', 'html' => ech_campaign_html($first, $body, 'Lock in my seat', ECH_BOOTCAMP_URL, $tokenUrl)];
    }

    if ($step === 'e7') {
        $body = '<p>Hi ' . ech_esc($first) . ',</p><p>This is the last nudge, then we will get out of your inbox.</p><p>The bootcamp starts 26 July, and registration for this cohort is closing. You took the quiz because some part of you is ready to stop dreaming about grad school and start doing it. This is the move.</p><p>Three ways in: full pass, a single drop-in session, or the next cohort if the timing truly is not right.</p><p>Whatever you do, choose something. The people who get the offer are simply the ones who started.</p>';
        return ['subject' => 'Last call before we start, ' . $first, 'cta' => 'Register now', 'html' => ech_campaign_html($first, $body, 'Register now', ECH_BOOTCAMP_URL, $tokenUrl)];
    }

    return null;
}

function ech_campaign_steps(array $lead): array {
    $timeline = ech_campaign_answer($lead, 'timeline');
    if (in_array($timeline, ['next-year', 'exploring'], true)) {
        return [
            ['key' => 'e1', 'delay' => 3 * 3600],
            ['key' => 'e2', 'delay' => 3 * 86400],
            ['key' => 'e3', 'delay' => 7 * 86400],
            ['key' => 'e4', 'delay' => 14 * 86400],
            ['key' => 'e5', 'delay' => 21 * 86400],
        ];
    }
    return [
        ['key' => 'e1', 'delay' => 3 * 3600],
        ['key' => 'e2', 'delay' => 1 * 86400],
        ['key' => 'e3', 'delay' => 3 * 86400],
        ['key' => 'e4', 'delay' => 6 * 86400],
        ['key' => 'e5', 'delay' => 9 * 86400],
        ['key' => 'e6', 'delay' => 12 * 86400],
        ['key' => 'e7', 'delay' => 15 * 86400],
    ];
}

/**
 * Send every due, not-yet-sent campaign email (up to $limit sends).
 *
 * Eligibility (enrolled, not a bot, not suppressed, not already a bootcamp
 * buyer) is computed in SQL by campaign_due_leads(). Idempotency is the
 * UNIQUE (lead_id, step) key on campaign_sends: the send is recorded after a
 * successful toSend call (same semantics as the old sent.json), and the
 * runner's flock lock prevents concurrent runs on the same host.
 */
function ech_campaign_run_due(int $limit = 20): array {
    $key = ech_runtime_secret('TOSEND_API_KEY');
    if ($key === '') {
        throw new RuntimeException('TOSEND_API_KEY is not configured.');
    }
    $from = ech_parse_from((string) (ech_runtime_secret('MAIL_FROM') ?: 'Elevate Career Hub <noreply@elevatecareerhub.com>'));
    $now = time();
    $stats = ['sent' => 0, 'skipped' => 0, 'errors' => []];

    $rows = ech_campaign_active_leads();
    $sendsMap = ech_sends_map(array_map(static fn($r) => (int) ($r['id'] ?? 0), $rows));

    foreach ($rows as $row) {
        if ($stats['sent'] >= $limit) {
            break;
        }
        $dbId = (int) ($row['id'] ?? 0);
        $lead = ech_lead_row_to_legacy($row); // templates + unsubscribe use the gsm- uid as 'id'
        $email = strtolower((string) ($lead['email'] ?? ''));
        if ($dbId <= 0 || $email === '') {
            $stats['skipped'] += 1;
            continue;
        }
        $created = strtotime((string) ($lead['createdAt'] ?? '')) ?: $now;
        foreach (ech_campaign_steps($lead) as $step) {
            if ($stats['sent'] >= $limit) {
                break 2;
            }
            $keyStep = (string) $step['key'];
            if (($created + (int) $step['delay']) > $now) {
                continue;
            }
            if (!empty($sendsMap[$dbId][$keyStep])) {
                continue;
            }
            $emailData = ech_campaign_email($lead, $keyStep);
            if (!$emailData) {
                // Slow-lane lead reaching e6/e7: record so it is never re-evaluated.
                ech_send_mark($dbId, $keyStep, 'skipped');
                $sendsMap[$dbId][$keyStep] = true;
                $stats['skipped'] += 1;
                continue;
            }
            try {
                ech_tosend_send($key, $from, [['email' => $email]], (string) $emailData['subject'], (string) $emailData['html']);
                ech_send_mark($dbId, $keyStep, 'sent');
                $sendsMap[$dbId][$keyStep] = true;
                $stats['sent'] += 1;
            } catch (Throwable $e) {
                $stats['errors'][] = $lead['id'] . ':' . $keyStep . ':' . $e->getMessage();
            }
        }
    }
    return $stats;
}
