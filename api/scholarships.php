<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Cache-Control: no-store');

$path = __DIR__ . '/_data/scholarships.json';
$data = is_file($path) ? json_decode((string) file_get_contents($path), true) : null;
$items = [];
if (is_array($data) && is_array($data['scholarships'] ?? null)) {
    foreach ($data['scholarships'] as $row) {
        if (!is_array($row) || empty($row['active'])) {
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
}

echo json_encode(['ok' => true, 'scholarships' => $items, 'updatedAt' => is_array($data) ? ($data['updatedAt'] ?? null) : null], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

