<?php
declare(strict_types=1);

require __DIR__ . '/admin-auth.php';
require_once __DIR__ . '/store.php';
ech_admin_require();

const ECH_REGIONS = ['uk','us','canada','europe','australia','new-zealand','asia','africa','any'];
const ECH_FIELDS = ['business','stem','health','social','law','arts','any'];
const ECH_DEGREES = ['taught','research','mba','phd','any'];
const ECH_CLASSES = ['first','2:1','2:2','third','any'];
const ECH_EXP = ['none','some','experienced','any'];
const ECH_FUNDING = ['full','partial','self-partly','flexible'];
const ECH_GENDER = ['any','female','male'];

function ech_string_list($v, array $allowed): array {
    $in = is_array($v) ? $v : explode(',', (string) $v);
    $out = [];
    foreach ($in as $item) {
        $x = strtolower(trim((string) $item));
        if ($x !== '' && in_array($x, $allowed, true) && !in_array($x, $out, true)) {
            $out[] = $x;
        }
    }
    return $out;
}

function ech_scholarship_clean(array $row, int $idx, array &$errors): ?array {
    $id = strtolower(trim((string) ($row['id'] ?? '')));
    $id = preg_replace('/[^a-z0-9-]+/', '-', $id) ?: '';
    $id = trim($id, '-');
    $name = trim((string) ($row['name'] ?? ''));
    $region = trim((string) ($row['region'] ?? 'Multiple'));
    $fundingType = trim((string) ($row['fundingType'] ?? ''));
    $blurb = trim((string) ($row['blurb'] ?? ''));
    if ($id === '' || $name === '' || $fundingType === '' || $blurb === '') {
        $errors[] = 'Row ' . ($idx + 1) . ': id, name, fundingType, and blurb are required.';
        return null;
    }
    $regions = ech_string_list($row['regions'] ?? ['any'], ECH_REGIONS);
    $fields = ech_string_list($row['fields'] ?? ['any'], ECH_FIELDS);
    $degrees = ech_string_list($row['degrees'] ?? ['any'], ECH_DEGREES);
    $funding = ech_string_list($row['funding'] ?? ['flexible'], ECH_FUNDING);
    $tags = is_array($row['tags'] ?? null) ? array_values(array_filter(array_map('strval', $row['tags']))) : array_values(array_filter(array_map('trim', explode(',', (string) ($row['tags'] ?? '')))));
    if (empty($regions) || empty($fields) || empty($degrees) || empty($funding)) {
        $errors[] = 'Row ' . ($idx + 1) . ': regions, fields, degrees, and funding must use supported values.';
        return null;
    }
    $minClass = strtolower(trim((string) ($row['minClass'] ?? '2:1')));
    $idealExp = strtolower(trim((string) ($row['idealExp'] ?? 'any')));
    $gender = strtolower(trim((string) ($row['genderEligibility'] ?? 'any')));
    if (!in_array($minClass, ECH_CLASSES, true) || !in_array($idealExp, ECH_EXP, true) || !in_array($gender, ECH_GENDER, true)) {
        $errors[] = 'Row ' . ($idx + 1) . ': minClass, idealExp, or genderEligibility is invalid.';
        return null;
    }
    return [
        'id' => $id,
        'name' => mb_substr($name, 0, 180),
        'region' => mb_substr($region, 0, 80),
        'fundingType' => mb_substr($fundingType, 0, 80),
        'blurb' => mb_substr($blurb, 0, 500),
        'regions' => $regions,
        'fields' => $fields,
        'degrees' => $degrees,
        'minClass' => $minClass,
        'idealExp' => $idealExp,
        'funding' => $funding,
        'tags' => array_values(array_unique(array_slice($tags, 0, 12))),
        'weight' => max(1, min(100, (int) ($row['weight'] ?? 50))),
        'genderEligibility' => $gender,
        'active' => (bool) ($row['active'] ?? true),
    ];
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    try {
        ech_json(['ok' => true, 'scholarships' => ech_scholarships_all(), 'updatedAt' => ech_scholarships_updated_at()]);
    } catch (Throwable $e) {
        error_log('[admin-scholarships] read failed: ' . $e->getMessage());
        ech_json(['ok' => false, 'message' => 'Scholarship database is unreachable. Try again shortly.'], 503);
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    ech_json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$raw = file_get_contents('php://input');
$body = is_string($raw) ? json_decode($raw, true) : null;
if (!is_array($body)) {
    ech_json(['ok' => false, 'message' => 'Invalid request body.'], 400);
}
$action = (string) ($body['action'] ?? '');

// Single-item edit/add: validate one scholarship and upsert it.
if ($action === 'upsert') {
    $errors = [];
    $item = ech_scholarship_clean(is_array($body['scholarship'] ?? null) ? $body['scholarship'] : [], 0, $errors);
    if (!$item) {
        ech_json(['ok' => false, 'message' => $errors[0] ?? 'Invalid scholarship.', 'errors' => $errors], 400);
    }
    try {
        $saved = ech_scholarship_upsert($item);
    } catch (Throwable $e) {
        error_log('[admin-scholarships] upsert failed: ' . $e->getMessage());
        ech_json(['ok' => false, 'message' => 'Could not save the scholarship. Nothing was changed.'], 503);
    }
    ech_json(['ok' => true, 'scholarship' => $saved]);
}

// Single-item delete.
if ($action === 'delete') {
    $id = strtolower(trim((string) ($body['id'] ?? '')));
    if ($id === '') {
        ech_json(['ok' => false, 'message' => 'Missing scholarship id.'], 400);
    }
    try {
        ech_scholarship_delete($id);
    } catch (Throwable $e) {
        error_log('[admin-scholarships] delete failed: ' . $e->getMessage());
        ech_json(['ok' => false, 'message' => 'Could not delete the scholarship.'], 503);
    }
    ech_json(['ok' => true]);
}

// Bulk import: add new + update existing (by id), leaving the rest untouched.
if (!is_array($body['scholarships'] ?? null)) {
    ech_json(['ok' => false, 'message' => 'Expected { scholarships: [...] }.'], 400);
}

$errors = [];
$seen = [];
$clean = [];
foreach ($body['scholarships'] as $idx => $row) {
    if (!is_array($row)) {
        $errors[] = 'Row ' . ($idx + 1) . ': not an object.';
        continue;
    }
    $item = ech_scholarship_clean($row, (int) $idx, $errors);
    if (!$item) {
        continue;
    }
    if (isset($seen[$item['id']])) {
        $errors[] = 'Row ' . ($idx + 1) . ': duplicate id ' . $item['id'] . '.';
        continue;
    }
    $seen[$item['id']] = true;
    $clean[] = $item;
}

if (!empty($errors)) {
    ech_json(['ok' => false, 'message' => 'Scholarship import has errors.', 'errors' => array_slice($errors, 0, 100)], 400);
}

try {
    // Merge by id: new scholarships are added, existing ones updated, the rest
    // of the engine is left intact. Refreshes the deploy-surviving cache file.
    $count = ech_scholarships_bulk_upsert($clean);
} catch (Throwable $e) {
    error_log('[admin-scholarships] import failed: ' . $e->getMessage());
    ech_json(['ok' => false, 'message' => 'Could not save to the scholarship database. Nothing was changed.'], 503);
}

ech_json(['ok' => true, 'count' => $count, 'updatedAt' => ech_scholarships_updated_at()]);

