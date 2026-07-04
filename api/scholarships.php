<?php
/**
 * Public runtime scholarship feed for the Grad School Match quiz.
 * Served from Supabase; falls back to the deploy-surviving cache file
 * (written on every admin save) so the quiz never degrades in an outage.
 */
declare(strict_types=1);

ini_set('display_errors', '0');

header('Content-Type: application/json');
header('Cache-Control: no-store');

$configFile = __DIR__ . '/config.php';
if (is_file($configFile)) {
    require $configFile;
}
require_once __DIR__ . '/store.php';

$feed = ech_scholarships_active_cached();
$items = [];
foreach ($feed['scholarships'] as $row) {
    if (!is_array($row)) {
        continue;
    }
    // The cache file may contain inactive rows (it mirrors the admin import);
    // the live query already filters, so re-check here for the fallback path.
    if (array_key_exists('active', $row) && empty($row['active'])) {
        continue;
    }
    $items[] = [
        'id' => (string) ($row['id'] ?? ''),
        'name' => (string) ($row['name'] ?? ''),
        'region' => (string) ($row['region'] ?? ''),
        'fundingType' => (string) ($row['fundingType'] ?? ''),
        'blurb' => (string) ($row['blurb'] ?? ''),
        'regions' => array_values(array_filter((array) ($row['regions'] ?? []), 'is_string')),
        'fields' => array_values(array_filter((array) ($row['fields'] ?? []), 'is_string')),
        'degrees' => array_values(array_filter((array) ($row['degrees'] ?? []), 'is_string')),
        'minClass' => (string) ($row['minClass'] ?? '2:1'),
        'idealExp' => (string) ($row['idealExp'] ?? 'any'),
        'funding' => array_values(array_filter((array) ($row['funding'] ?? []), 'is_string')),
        'tags' => array_values(array_filter((array) ($row['tags'] ?? []), 'is_string')),
        'weight' => (int) ($row['weight'] ?? 50),
        'genderEligibility' => (string) ($row['genderEligibility'] ?? 'any'),
    ];
}

echo json_encode(['ok' => true, 'scholarships' => $items, 'updatedAt' => $feed['updatedAt']], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
