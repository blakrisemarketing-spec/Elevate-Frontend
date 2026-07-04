<?php
/**
 * Supabase REST client + durable-storage helpers.
 *
 * All runtime data (leads, campaign state, purchases, scholarships) lives in
 * the dedicated Elevate Supabase project, so Hostinger redeploys (which wipe
 * public_html) can never lose it. PHP talks to PostgREST and Storage over
 * cURL with the service key, exactly like the existing Paystack/Tosend calls.
 *
 * Env (set in ech-config.php above public_html, or .env.local for serve:php):
 *   SUPABASE_URL          https://<ref>.supabase.co
 *   SUPABASE_SERVICE_KEY  service_role JWT or sb_secret_... key (server-only!)
 *   ECH_DATA_DIR          optional local-dev override for the durable data dir
 *
 * When Supabase is unreachable, leads are never dropped: callers append to an
 * NDJSON fallback file OUTSIDE public_html (ech_fallback_append) and the cron
 * runner drains it back into the database once connectivity returns.
 */
declare(strict_types=1);

require_once __DIR__ . '/admin-auth.php';

function ech_sb_url(): string {
    return rtrim(ech_runtime_secret('SUPABASE_URL'), '/');
}

function ech_sb_key(): string {
    return ech_runtime_secret('SUPABASE_SERVICE_KEY');
}

function ech_sb_ready(): bool {
    return ech_sb_url() !== '' && ech_sb_key() !== '' && function_exists('curl_init');
}

/**
 * Low-level request. $body is a pre-encoded string (JSON or raw bytes).
 * Returns [statusCode, rawResponseBody]. Throws only on transport failure
 * (DNS, timeout, TLS), so callers can branch on HTTP status without try/catch.
 */
function ech_sb_request(string $method, string $path, ?string $body = null, array $headers = []): array {
    if (!ech_sb_ready()) {
        throw new RuntimeException('Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_KEY).');
    }
    $ch = curl_init(ech_sb_url() . $path);
    $allHeaders = array_merge([
        'apikey: ' . ech_sb_key(),
        'Authorization: Bearer ' . ech_sb_key(),
    ], $headers);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $allHeaders,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 12,
    ];
    if ($body !== null) {
        $opts[CURLOPT_POSTFIELDS] = $body;
    }
    curl_setopt_array($ch, $opts);
    // No curl_close(): deprecated in PHP 8.5, a no-op since 8.0 (handle is
    // freed when $ch goes out of scope). Same convention as finfo in quiz-lead.
    $res = curl_exec($ch);
    if ($res === false) {
        throw new RuntimeException('Supabase transport error: ' . curl_error($ch));
    }
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    return [$status, (string) $res];
}

/** JSON request against PostgREST/RPC. Returns [statusCode, decodedOrNull]. */
function ech_sb_api(string $method, string $path, $json = null, array $headers = []): array {
    $body = null;
    if ($json !== null) {
        $body = json_encode($json, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $headers[] = 'Content-Type: application/json';
    }
    [$status, $raw] = ech_sb_request($method, $path, $body, $headers);
    $decoded = $raw !== '' ? json_decode($raw, true) : null;
    return [$status, $decoded];
}

/**
 * INSERT rows. $opts: onConflict (comma-joined columns), ignoreDuplicates
 * (bool), merge (bool, upsert). Returns the inserted/merged rows (empty array
 * when every row was an ignored duplicate). Throws on non-2xx EXCEPT 409,
 * which is returned as ['__conflict' => detailMessage] so callers can map
 * unique violations (e.g. duplicate phone) to domain behavior.
 */
function ech_sb_insert(string $table, array $rows, array $opts = []): array {
    $prefer = ['return=representation'];
    if (!empty($opts['ignoreDuplicates'])) {
        $prefer[] = 'resolution=ignore-duplicates';
    } elseif (!empty($opts['merge'])) {
        $prefer[] = 'resolution=merge-duplicates';
    }
    $qs = !empty($opts['onConflict']) ? '?on_conflict=' . rawurlencode((string) $opts['onConflict']) : '';
    $payload = array_is_list($rows) ? $rows : [$rows];
    [$status, $data] = ech_sb_api('POST', '/rest/v1/' . $table . $qs, $payload, ['Prefer: ' . implode(',', $prefer)]);
    if ($status === 409) {
        $detail = is_array($data) ? (string) ($data['message'] ?? ($data['details'] ?? '')) : '';
        return ['__conflict' => $detail];
    }
    if ($status < 200 || $status >= 300) {
        throw new RuntimeException('Supabase insert into ' . $table . ' failed (' . $status . '): ' . json_encode($data));
    }
    return is_array($data) ? $data : [];
}

/** SELECT. $query is a raw PostgREST query string (already URL-safe values). */
function ech_sb_select(string $table, string $query): array {
    [$status, $data] = ech_sb_api('GET', '/rest/v1/' . $table . '?' . $query);
    if ($status < 200 || $status >= 300 || !is_array($data)) {
        throw new RuntimeException('Supabase select from ' . $table . ' failed (' . $status . ')');
    }
    return $data;
}

/** UPDATE rows matching $filter (raw PostgREST filter string). Returns rows. */
function ech_sb_update(string $table, string $filter, array $patch): array {
    [$status, $data] = ech_sb_api('PATCH', '/rest/v1/' . $table . '?' . $filter, $patch, ['Prefer: return=representation']);
    if ($status < 200 || $status >= 300) {
        throw new RuntimeException('Supabase update of ' . $table . ' failed (' . $status . ')');
    }
    return is_array($data) ? $data : [];
}

/** DELETE rows matching $filter (raw PostgREST filter string). */
function ech_sb_delete(string $table, string $filter): void {
    [$status] = ech_sb_api('DELETE', '/rest/v1/' . $table . '?' . $filter);
    if ($status < 200 || $status >= 300) {
        throw new RuntimeException('Supabase delete from ' . $table . ' failed (' . $status . ')');
    }
}

/** Call a Postgres function exposed over /rest/v1/rpc. */
function ech_sb_rpc(string $fn, array $args = []) {
    [$status, $data] = ech_sb_api('POST', '/rest/v1/rpc/' . $fn, (object) $args);
    if ($status < 200 || $status >= 300) {
        throw new RuntimeException('Supabase rpc ' . $fn . ' failed (' . $status . '): ' . json_encode($data));
    }
    return $data;
}

// ── Storage (private `cvs` bucket) ──────────────────────────────────────

function ech_sb_storage_upload(string $bucket, string $object, string $bytes, string $mime): bool {
    try {
        [$status] = ech_sb_request(
            'POST',
            '/storage/v1/object/' . rawurlencode($bucket) . '/' . str_replace('%2F', '/', rawurlencode($object)),
            $bytes,
            ['Content-Type: ' . ($mime !== '' ? $mime : 'application/octet-stream'), 'x-upsert: true']
        );
        return $status >= 200 && $status < 300;
    } catch (Throwable $e) {
        error_log('[supabase] storage upload failed: ' . $e->getMessage());
        return false;
    }
}

/** Download object bytes, or null when missing/unreachable. */
function ech_sb_storage_download(string $bucket, string $object): ?string {
    try {
        [$status, $raw] = ech_sb_request(
            'GET',
            '/storage/v1/object/' . rawurlencode($bucket) . '/' . str_replace('%2F', '/', rawurlencode($object))
        );
        return ($status >= 200 && $status < 300) ? $raw : null;
    } catch (Throwable $e) {
        error_log('[supabase] storage download failed: ' . $e->getMessage());
        return null;
    }
}

// ── Durable local dir (outside public_html, survives redeploys) ─────────

/**
 * Root for runtime files that must survive a Hostinger deploy: the fallback
 * NDJSON spool, the scholarships cache, and locally-stored CVs when Storage
 * is unreachable. Same location trick as ech-config.php (one level above
 * public_html). ECH_DATA_DIR overrides for local dev (keep it gitignored).
 */
function ech_data_root(): string {
    static $root = null;
    if (is_string($root)) {
        return $root;
    }
    $override = ech_runtime_secret('ECH_DATA_DIR');
    if ($override !== '') {
        $root = rtrim($override, '/');
    } else {
        $docRoot = (string) ($_SERVER['DOCUMENT_ROOT'] ?? '');
        $root = ($docRoot !== '' ? dirname($docRoot) : dirname(__DIR__, 2)) . '/ech-data';
    }
    foreach (['', '/fallback', '/cache', '/cv'] as $sub) {
        $dir = $root . $sub;
        if (!is_dir($dir)) {
            @mkdir($dir, 0700, true);
        }
    }
    return $root;
}

function ech_cv_dir(): string {
    return ech_data_root() . '/cv';
}

/** Append one JSON record to a fallback NDJSON spool (flock'd). */
function ech_fallback_append(string $file, array $record): void {
    $path = ech_data_root() . '/fallback/' . basename($file);
    $fh = @fopen($path, 'ab');
    if (!$fh) {
        error_log('[supabase] could not open fallback file: ' . $path);
        return;
    }
    if (flock($fh, LOCK_EX)) {
        fwrite($fh, json_encode($record, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n");
        fflush($fh);
        flock($fh, LOCK_UN);
    }
    fclose($fh);
}

/**
 * Best-effort ops alert via Tosend, throttled to one email per subject per
 * hour (marker file) so an outage cannot spam OPS_EMAIL.
 */
function ech_ops_alert(string $subject, string $detail): void {
    try {
        $marker = ech_data_root() . '/fallback/.alert-' . substr(sha1($subject), 0, 12);
        if (is_file($marker) && (time() - (int) filemtime($marker)) < 3600) {
            return;
        }
        @touch($marker);
        $key = ech_runtime_secret('TOSEND_API_KEY');
        $ops = ech_runtime_secret('OPS_EMAIL') ?: 'hello@elevatecareerhub.com';
        if ($key === '' || !function_exists('ech_tosend_send')) {
            error_log('[ops-alert] ' . $subject . ': ' . $detail);
            return;
        }
        $from = ech_parse_from((string) (ech_runtime_secret('MAIL_FROM') ?: 'Elevate Career Hub <noreply@elevatecareerhub.com>'));
        ech_tosend_send($key, $from, [['email' => $ops]], '[Elevate ops] ' . $subject,
            '<p>' . ech_esc($subject) . '</p><pre>' . ech_esc(mb_substr($detail, 0, 4000)) . '</pre>');
    } catch (Throwable $e) {
        error_log('[ops-alert] failed: ' . $e->getMessage());
    }
}
