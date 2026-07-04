<?php
/**
 * Admin: one-time import of the legacy file-based data into Supabase.
 *
 * Idempotent and safe to re-run: leads dedupe on uid/phone_normalized,
 * sends on (lead_id, step), purchases on reference, suppressions upsert.
 *
 * Sources, in priority order (first hit per file wins):
 *   1. <ech-data>/legacy-import/   copied there via hPanel BEFORE deploying
 *      (may contain _leads/ and _data/ subdirs, or the files flattened)
 *   2. api/_data/ + api/_leads/    anything still on disk post-deploy
 *
 * Campaign-file leads keep their ORIGINAL gsm- uid, so unsubscribe links in
 * already-sent emails keep verifying. Raw-file leads that never entered the
 * campaign are imported with campaign_enrolled=false: enrolling an old lead
 * now would fire its whole overdue sequence at once.
 */
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/store.php';
ech_admin_require();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

set_time_limit(300);

$legacyRoot = ech_data_root() . '/legacy-import';

/** All existing files matching $relative under the known source roots. */
function ech_import_files(string $relative): array {
    global $legacyRoot;
    $patterns = [
        $legacyRoot . '/' . $relative,
        $legacyRoot . '/_data/' . $relative,
        $legacyRoot . '/_leads/' . $relative,
        __DIR__ . '/_data/' . $relative,
        __DIR__ . '/_leads/' . $relative,
    ];
    $found = [];
    foreach (array_filter($patterns) as $pattern) {
        foreach (glob($pattern) ?: [] as $f) {
            $found[basename(dirname($f)) . '/' . basename($f)] = $f; // dedupe same file across roots
        }
    }
    return array_values($found);
}

function ech_import_ndjson(string $file): array {
    $rows = [];
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $rec = json_decode(trim($line), true);
        if (is_array($rec)) {
            $rows[] = $rec;
        }
    }
    return $rows;
}

$report = [];

try {
    // ── 1. Campaign enrollments -> leads (original uid preserved) ──────
    $uidToDbId = [];
    $count = ['inserted' => 0, 'skipped' => 0];
    $campaignLeads = [];
    foreach (ech_import_files('lead-campaigns.ndjson') as $file) {
        foreach (ech_import_ndjson($file) as $rec) {
            if (!empty($rec['id']) && !empty($rec['email'])) {
                $campaignLeads[(string) $rec['id']] = $rec;
            }
        }
    }
    foreach ($campaignLeads as $uid => $rec) {
        $row = [
            'uid' => $uid,
            'created_at' => (string) ($rec['createdAt'] ?? gmdate('c')),
            'name' => (string) ($rec['name'] ?? ''),
            'email' => strtolower((string) ($rec['email'] ?? '')),
            'phone' => (string) ($rec['phone'] ?? ''),
            'phone_normalized' => ech_normalize_phone((string) ($rec['phone'] ?? '')),
            'answers' => is_array($rec['answers'] ?? null) ? $rec['answers'] : (object) [],
            'pathways' => array_values((array) ($rec['pathways'] ?? [])),
            'scholarships' => array_values((array) ($rec['scholarships'] ?? [])),
            'cv_file' => '',
            'suspected_bot' => false,
            'campaign_enrolled' => true,
            'source' => (string) ($rec['source'] ?? 'grad_school_match'),
        ];
        $res = ech_sb_insert('ech_leads', $row, ['onConflict' => 'uid', 'ignoreDuplicates' => true]);
        if (isset($res['__conflict'])) {
            $count['skipped'] += 1; // phone already present from an earlier run
        } elseif (!empty($res)) {
            $count['inserted'] += 1;
            $uidToDbId[$uid] = (int) $res[0]['id'];
        } else {
            $count['skipped'] += 1; // uid already imported
        }
    }
    // Resolve db ids for every known uid (covers re-runs where insert skipped).
    $uids = array_keys($campaignLeads);
    foreach (array_chunk($uids, 80) as $chunk) {
        $rows = ech_sb_select('ech_leads', 'select=id,uid&uid=in.(' . implode(',', array_map(
            static fn($u) => '"' . str_replace('"', '', (string) $u) . '"',
            $chunk
        )) . ')');
        foreach ($rows as $r) {
            $uidToDbId[(string) $r['uid']] = (int) $r['id'];
        }
    }
    $report['campaignLeads'] = $count;

    // ── 2. Raw lead files -> enrich matches / insert the rest ─────────
    $count = ['inserted' => 0, 'enriched' => 0, 'skipped' => 0];
    foreach (ech_import_files('leads-*.ndjson') as $file) {
        foreach (ech_import_ndjson($file) as $rec) {
            $email = strtolower(trim((string) ($rec['email'] ?? '')));
            $phoneNorm = (string) ($rec['phoneNormalized'] ?? ech_normalize_phone((string) ($rec['phone'] ?? '')));
            if ($email === '' && ($phoneNorm === '' || $phoneNorm === '+')) {
                $count['skipped'] += 1;
                continue;
            }
            $existing = [];
            if ($phoneNorm !== '' && $phoneNorm !== '+') {
                $existing = ech_sb_select('ech_leads', 'select=id,ip,cv_file&phone_normalized=eq.' . rawurlencode($phoneNorm) . '&limit=1');
            }
            if (empty($existing) && $email !== '') {
                $existing = ech_sb_select('ech_leads', 'select=id,ip,cv_file&email=eq.' . rawurlencode($email) . '&order=created_at.asc&limit=1');
            }
            if (!empty($existing)) {
                // Already imported (campaign lead or earlier run): add the raw-only
                // detail the campaign file never had. Skip if it looks enriched.
                if ((string) ($existing[0]['ip'] ?? '') !== '' || (string) ($existing[0]['cv_file'] ?? '') !== '') {
                    $count['skipped'] += 1;
                    continue;
                }
                ech_sb_update('ech_leads', 'id=eq.' . (int) $existing[0]['id'], [
                    'ip' => (string) ($rec['ip'] ?? ''),
                    'ua' => (string) ($rec['ua'] ?? ''),
                    'consent' => !empty($rec['consent']),
                    'linkedin' => (string) ($rec['linkedin'] ?? ''),
                    'portfolio' => (string) ($rec['portfolio'] ?? ''),
                    'pathway_ids' => array_values((array) ($rec['pathwayIds'] ?? [])),
                    'scholarship_ids' => array_values((array) ($rec['scholarshipIds'] ?? [])),
                    'cv_file' => (string) ($rec['cvFile'] ?? ''),
                    'cv_meta' => is_array($rec['cvMeta'] ?? null) && !empty($rec['cvMeta']) ? $rec['cvMeta'] : (object) [],
                    'suspected_bot' => !empty($rec['suspectedBot']),
                ]);
                $count['enriched'] += 1;
                continue;
            }
            // Never enrolled: import for the record, but do NOT enroll (an old
            // created_at would make every step instantly due).
            $row = ech_lead_row_build($rec, [], [], ech_lead_uid($email, $phoneNorm));
            $row['campaign_enrolled'] = false;
            $res = ech_sb_insert('ech_leads', $row, ['onConflict' => 'uid', 'ignoreDuplicates' => true]);
            if (isset($res['__conflict']) || empty($res)) {
                $count['skipped'] += 1;
            } else {
                $count['inserted'] += 1;
            }
        }
    }
    $report['rawLeads'] = $count;

    // ── 3. Sent history -> campaign_sends ──────────────────────────────
    $count = ['inserted' => 0, 'skipped' => 0, 'unknownLead' => 0];
    foreach (ech_import_files('lead-campaign-sent.json') as $file) {
        $sent = json_decode((string) file_get_contents($file), true);
        if (!is_array($sent)) {
            continue;
        }
        foreach ($sent as $uid => $steps) {
            $dbId = $uidToDbId[(string) $uid] ?? 0;
            if ($dbId <= 0) {
                $lead = ech_lead_by_uid((string) $uid);
                $dbId = $lead ? (int) $lead['id'] : 0;
                $uidToDbId[(string) $uid] = $dbId;
            }
            if ($dbId <= 0) {
                $count['unknownLead'] += 1;
                continue;
            }
            foreach ((array) $steps as $step => $ts) {
                if (!in_array((string) $step, ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7'], true)) {
                    continue;
                }
                $res = ech_sb_insert('ech_campaign_sends', [
                    'lead_id' => $dbId,
                    'step' => (string) $step,
                    'status' => 'sent',
                    'sent_at' => is_string($ts) && $ts !== '' ? $ts : gmdate('c'),
                ], ['onConflict' => 'lead_id,step', 'ignoreDuplicates' => true]);
                if (!isset($res['__conflict']) && !empty($res)) {
                    $count['inserted'] += 1;
                } else {
                    $count['skipped'] += 1;
                }
            }
        }
    }
    $report['sends'] = $count;

    // ── 4. Suppressions ────────────────────────────────────────────────
    $count = ['imported' => 0];
    foreach (ech_import_files('lead-campaign-suppressed.json') as $file) {
        $list = json_decode((string) file_get_contents($file), true);
        if (!is_array($list)) {
            continue;
        }
        foreach ($list as $email => $meta) {
            $email = strtolower(trim((string) $email));
            if ($email === '') {
                continue;
            }
            ech_sb_insert('ech_campaign_suppressions', [
                'email' => $email,
                'reason' => (string) (is_array($meta) ? ($meta['reason'] ?? 'unsubscribe') : 'unsubscribe'),
                'created_at' => (string) (is_array($meta) ? ($meta['ts'] ?? gmdate('c')) : gmdate('c')),
            ], ['onConflict' => 'email', 'ignoreDuplicates' => true]);
            $count['imported'] += 1;
        }
    }
    $report['suppressions'] = $count;

    // ── 5. Purchases ───────────────────────────────────────────────────
    $count = ['imported' => 0, 'skipped' => 0];
    foreach (ech_import_files('purchases-*.ndjson') as $file) {
        foreach (ech_import_ndjson($file) as $rec) {
            if (empty($rec['reference'])) {
                $count['skipped'] += 1;
                continue;
            }
            ech_purchase_insert($rec);
            $count['imported'] += 1;
        }
    }
    $report['purchases'] = $count;

    // ── 6. Scholarships feed (only when the table is still empty) ─────
    $report['scholarships'] = ['imported' => 0];
    $existingScholarships = ech_sb_select('ech_scholarships', 'select=id&limit=1');
    if (empty($existingScholarships)) {
        foreach (ech_import_files('scholarships.json') as $file) {
            $data = json_decode((string) file_get_contents($file), true);
            $items = is_array($data) && is_array($data['scholarships'] ?? null) ? $data['scholarships'] : [];
            if (!empty($items)) {
                $saved = ech_scholarships_replace($items);
                $report['scholarships'] = ['imported' => $saved['count']];
                break;
            }
        }
    }

    // ── 7. CV files -> Storage bucket ──────────────────────────────────
    $count = ['uploaded' => 0, 'failed' => 0];
    $cvDirs = [$legacyRoot . '/cv', $legacyRoot . '/_leads/cv', __DIR__ . '/_leads/cv', ech_cv_dir()];
    $seenCv = [];
    foreach ($cvDirs as $dir) {
        foreach (glob($dir . '/cv-*') ?: [] as $path) {
            $base = basename($path);
            if (isset($seenCv[$base]) || !preg_match('/^cv-\d{8}-[a-f0-9]{16}\.(pdf|doc|docx)$/i', $base)) {
                continue;
            }
            $seenCv[$base] = true;
            $bytes = (string) @file_get_contents($path);
            if ($bytes === '') {
                $count['failed'] += 1;
                continue;
            }
            $mimeByExt = ['pdf' => 'application/pdf', 'doc' => 'application/msword', 'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            $ext = strtolower(pathinfo($base, PATHINFO_EXTENSION));
            if (ech_sb_storage_upload('ech-cvs', $base, $bytes, $mimeByExt[$ext] ?? 'application/octet-stream')) {
                $count['uploaded'] += 1;
            } else {
                $count['failed'] += 1;
            }
        }
    }
    $report['cvs'] = $count;

    // ── 8. Fallback spool (leads captured during any outage) ──────────
    $report['fallback'] = ech_drain_lead_fallback();

    ech_setting_set('legacy_import_done_at', gmdate('c'));
    ech_json(['ok' => true, 'report' => $report]);
} catch (Throwable $e) {
    error_log('[admin-import-legacy] failed: ' . $e->getMessage());
    ech_json(['ok' => false, 'message' => 'Import failed partway (safe to re-run): ' . $e->getMessage(), 'report' => $report], 500);
}
