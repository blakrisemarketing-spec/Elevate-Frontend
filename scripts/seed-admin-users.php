<?php
/**
 * Seed / reset admin user accounts in Supabase (ech_admin_users).
 *
 * Creates each email with a strong generated password (bcrypt hashed) and
 * prints the plaintext ONCE so it can be shared securely. Re-running resets the
 * password for existing emails. Reads SUPABASE_URL + SUPABASE_SERVICE_KEY from
 * .env / .env.local.
 *
 * Usage: php scripts/seed-admin-users.php  [email1 email2 ...]
 * With no args it seeds the default launch list below.
 */
declare(strict_types=1);

$projectRoot = dirname(__DIR__);

// Load .env then .env.local (override) into the process env.
foreach (['.env', '.env.local'] as $file) {
    $path = $projectRoot . '/' . $file;
    if (!is_file($path)) {
        continue;
    }
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (preg_match('/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i', $line, $m)) {
            putenv($m[1] . '=' . trim($m[2], " \t\"'"));
        }
    }
}

require $projectRoot . '/api/supabase.php';
require $projectRoot . '/api/store.php';

if (!ech_sb_ready()) {
    fwrite(STDERR, "[seed-admins] SUPABASE_URL / SUPABASE_SERVICE_KEY missing in .env / .env.local\n");
    exit(1);
}

$emails = array_slice($argv, 1);
if (empty($emails)) {
    $emails = [
        'blakrise.marketing@gmail.com',
        'shalm.elevateops@gmail.com',
        'opsmanager.elevateops@gmail.com',
        'naalamle6@gmail.com',
        'rosemarygreatdamzi@gmail.com',
    ];
}

function gen_password(int $len = 14): string {
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    $max = strlen($alphabet) - 1;
    $out = '';
    for ($i = 0; $i < $len; $i++) {
        $out .= $alphabet[random_int(0, $max)];
    }
    return $out;
}

printf("%-40s %s\n", 'EMAIL', 'PASSWORD');
printf("%s\n", str_repeat('-', 60));
$fail = 0;
foreach ($emails as $email) {
    $email = strtolower(trim($email));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fwrite(STDERR, "skip (invalid): $email\n");
        continue;
    }
    $plain = gen_password();
    try {
        ech_admin_user_upsert($email, password_hash($plain, PASSWORD_DEFAULT), '', true);
        printf("%-40s %s\n", $email, $plain);
    } catch (Throwable $e) {
        $fail++;
        fwrite(STDERR, "FAILED $email: " . $e->getMessage() . "\n");
    }
}
printf("%s\n", str_repeat('-', 60));
echo $fail === 0 ? "Done. Share each password securely; they are stored only as hashes.\n" : "Completed with $fail failure(s).\n";
exit($fail === 0 ? 0 : 1);
