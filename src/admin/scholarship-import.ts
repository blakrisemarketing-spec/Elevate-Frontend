import type { Scholarship } from '../match/match-data';

const regionMap: Record<string, string[]> = {
  uk: ['uk'],
  usa: ['us'],
  us: ['us'],
  canada: ['canada'],
  europe: ['europe'],
  oceania: ['australia', 'new-zealand'],
  asia: ['asia'],
  'africa/global': ['africa', 'any'],
  africa: ['africa'],
};

export function slug(s: string) {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

export function splitList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((x) => x.trim()).filter(Boolean);
  return String(v || '').split(/[,;/]/).map((x) => x.trim()).filter(Boolean);
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted && ch === '"' && next === '"') {
      cell += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (!quoted && ch === ',') {
      row.push(cell);
      cell = '';
    } else if (!quoted && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

export function rowsToObjects(rows: unknown[][]): Record<string, unknown>[] {
  const [headerRow, ...body] = rows;
  const headers = (headerRow || []).map((x) => String(x || '').trim());
  return body
    .filter((row) => row.some((x) => String(x || '').trim() !== ''))
    .map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])));
}

function degreesFrom(v: unknown): Scholarship['degrees'] {
  const s = String(v || '').toLowerCase();
  const out = new Set<string>();
  if (/mba|business/.test(s)) out.add('mba');
  if (/phd|doctoral|doctorate/.test(s)) out.add('phd');
  if (/research|postgraduate diploma/.test(s)) out.add('research');
  if (/master|graduate|postgraduate|msc|ma|mba/.test(s)) out.add('taught');
  if (out.size === 0) out.add('any');
  return [...out] as Scholarship['degrees'];
}

function fundingFrom(v: unknown): string[] {
  const s = String(v || '').toLowerCase();
  if (/fully|full|stipend|salary/.test(s)) return ['full'];
  if (/partial|half|tuition|grant|loan|varies|funded/.test(s)) return ['partial', 'self-partly'];
  return ['flexible'];
}

function genderFrom(v: unknown, name: string): Scholarship['genderEligibility'] {
  const s = `${String(v || '')} ${name}`.toLowerCase();
  return /women only|female|fort[eé]|aauw|owsd/.test(s) ? 'female' : 'any';
}

function fieldsFrom(row: Record<string, unknown>) {
  const s = Object.values(row).join(' ').toLowerCase();
  const fields = new Set<string>();
  if (/business|mba|finance|management|econom/.test(s)) fields.add('business');
  if (/stem|science|engineering|math|technology|data|ictp|aims/.test(s)) fields.add('stem');
  if (/health|medicine|wellcome|medical/.test(s)) fields.add('health');
  if (/social|development|policy|peace|humanities/.test(s)) fields.add('social');
  if (/law|legal/.test(s)) fields.add('law');
  if (/arts|design/.test(s)) fields.add('arts');
  return fields.size ? [...fields] : ['any'];
}

export function normalizeScholarshipRow(row: Record<string, unknown>): Scholarship | null {
  const name = String(row.Scholarship || row.name || row.Name || '').trim();
  if (!name) return null;
  const regionRaw = String(row.Region || row.region || 'Multiple').trim();
  const coverage = String(row.Coverage || row.fundingType || row['Funding Type'] || 'Varies').trim();
  const notes = String(row['Eligible Region / Notes'] || row.notes || row.Notes || '').trim();
  const host = String(row['Host / Funder'] || row.host || '').trim();
  const mappedRegions = regionMap[regionRaw.toLowerCase()] || ['any'];
  const genderEligibility = genderFrom(row['Gender-based?'] || row.genderEligibility, name);
  return {
    id: slug(String(row.id || name)),
    name,
    region: regionRaw || 'Multiple',
    fundingType: coverage,
    blurb: String(row.blurb || `${coverage} support from ${host || 'the funder'} for ${notes || 'eligible graduate applicants'}.`).slice(0, 500),
    regions: mappedRegions,
    fields: fieldsFrom(row) as Scholarship['fields'],
    degrees: degreesFrom(row['Degree Level'] || row.degrees),
    minClass: '2:1',
    idealExp: /mid-career|professional|experience|mba/i.test(notes + host + name) ? 'some' : 'any',
    funding: fundingFrom(coverage),
    tags: [
      /africa|african/i.test(notes + regionRaw) ? 'africa' : '',
      /develop/i.test(notes + name) ? 'development' : '',
      genderEligibility === 'female' ? 'women' : '',
    ].filter(Boolean),
    weight: 50,
    genderEligibility,
  };
}
