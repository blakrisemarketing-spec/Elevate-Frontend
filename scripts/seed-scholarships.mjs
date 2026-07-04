#!/usr/bin/env node
/**
 * Seed / reset the runtime scholarship engine (Supabase `ech_scholarships`)
 * from the build-time defaults in src/match/match-data.ts.
 *
 * The quiz's recommendation engine uses the runtime feed as its source of truth
 * (it replaces the baked-in set whenever the feed is non-empty). Seeding loads
 * the full default catalogue into the table so the admin can see, edit, and add
 * to every scholarship from the Scholarships page.
 *
 * Idempotent: performs an atomic replace via the ech_scholarships_replace RPC.
 * Reads SUPABASE_URL + SUPABASE_SERVICE_KEY from .env / .env.local.
 *
 * Usage: node scripts/seed-scholarships.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { build as esbuild } from 'esbuild';

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── env (.env then .env.local override) ──────────────────────────────────
const env = { ...process.env };
for (const file of ['.env', '.env.local']) {
  try {
    for (const line of fs.readFileSync(path.join(projectRoot, file), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* optional */ }
}
const SUPABASE_URL = (env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || '';
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[seed] SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env / .env.local');
  process.exit(1);
}

// ── load SCHOLARSHIPS from the TS module (esbuild -> CJS in memory) ───────
const { outputFiles } = await esbuild({
  entryPoints: [path.join(projectRoot, 'src/match/match-data.ts')],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  loader: { '.ts': 'ts' },
  logLevel: 'silent',
});
const mod = { exports: {} };
new Function('module', 'exports', 'require', outputFiles[0].text)(mod, mod.exports, require);
const SCHOLARSHIPS = mod.exports.SCHOLARSHIPS || [];
if (!SCHOLARSHIPS.length) {
  console.error('[seed] No SCHOLARSHIPS found in src/match/match-data.ts');
  process.exit(1);
}

const items = SCHOLARSHIPS.map((s) => ({
  id: s.id,
  name: s.name,
  region: s.region,
  fundingType: s.fundingType,
  blurb: s.blurb,
  regions: s.regions,
  fields: s.fields,
  degrees: s.degrees,
  minClass: s.minClass,
  idealExp: s.idealExp,
  funding: s.funding,
  tags: s.tags || [],
  weight: s.weight,
  genderEligibility: s.genderEligibility || 'any',
  active: true,
}));

console.log(`[seed] loaded ${items.length} scholarships from match-data.ts`);

const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ech_scholarships_replace`, {
  method: 'POST',
  headers: {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ items }),
});
const text = await res.text();
if (!res.ok) {
  console.error(`[seed] replace failed (HTTP ${res.status}): ${text.slice(0, 400)}`);
  process.exit(1);
}
console.log(`[seed] ech_scholarships now holds ${text.trim()} rows. Done.`);
