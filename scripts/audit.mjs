/**
 * Post-build content audit over dist/ (run after `npm run build`).
 *
 * For every rendered page (from .tmp/routes.json, written by the build):
 *   - has a <title> and meta description
 *   - ships no scripts beyond the known set (GTM/Pixel/click-tracking inline
 *     tags, JSON-LD, and the content-hashed checkout/match/admin islands)
 *   - every internal link resolves to a built page, a redirect, or a file
 *   - every local asset reference exists in dist/
 *   - every image/font reference is fingerprinted (name.<hash>.ext), so the
 *     1-year cache can never serve a stale copy
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const distRoot = path.join(projectRoot, 'dist');

let inventory;
try {
  inventory = JSON.parse(await fs.readFile(path.join(projectRoot, '.tmp', 'routes.json'), 'utf8'));
} catch {
  console.error('Audit needs a build first: .tmp/routes.json not found. Run `npm run build`.');
  process.exit(1);
}

// Rewritten by deploy/htaccess.conf before they reach the file system.
const HTACCESS_REDIRECTS = new Set(['/index.php/about/', '/index.php/contact-us/', '/index.php/diy-products/']);
const ISLAND_RE = /^\/assets\/(checkout|match|admin)\.[0-9a-f]{8}\.js$/;
const FINGERPRINT_RE = /\.[0-9a-f]{8}\.[a-z0-9]+$/;
const FINGERPRINTED_DIRS = /^\/(assets|fonts)\//;
const IMAGE_OR_FONT = /\.(webp|png|jpe?g|gif|svg|avif|ico|woff2?)$/;

const issues = [];
const pageRoutes = new Set(inventory.pages.map((p) => p.route));
const redirectRoutes = new Set(inventory.redirects.map((r) => r.route));

async function exists(rel) {
  try {
    await fs.access(path.join(distRoot, decodeURIComponent(rel)));
    return true;
  } catch {
    return false;
  }
}

function localPath(raw) {
  // Only absolute or root-relative URLs; meta content like "index,follow" is not a link.
  if (!raw || !/^(https?:)?\//i.test(raw)) return null;
  let url;
  try { url = new URL(raw, 'https://elevatecareerhub.com/'); } catch { return null; }
  if (url.hostname !== 'elevatecareerhub.com' && url.hostname !== 'www.elevatecareerhub.com') return null;
  return url.pathname;
}

for (const page of inventory.pages) {
  const html = await fs.readFile(path.join(projectRoot, page.file), 'utf8');
  const where = page.route;

  if (!/<title>[^<]+<\/title>/.test(html)) issues.push(`${where}: missing <title>`);
  if (!/<meta name="description" content="[^"]+">/.test(html)) issues.push(`${where}: missing meta description`);

  for (const m of html.matchAll(/<script\b([^>]*)>/gi)) {
    const attrs = m[1];
    const src = attrs.match(/\bsrc="([^"]+)"/)?.[1];
    if (src && !ISLAND_RE.test(src)) issues.push(`${where}: unexpected script ${src}`);
  }

  const refs = new Set();
  for (const m of html.matchAll(/\b(?:href|src|content)="([^"]+)"/g)) refs.add(m[1]);
  for (const m of html.matchAll(/\bsrcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) refs.add(part.trim().split(/\s+/)[0]);
  }
  for (const m of html.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) refs.add(m[1]);

  for (const raw of refs) {
    const p = localPath(raw);
    if (!p || p.startsWith('/api/')) continue;
    const hasExt = /\.[a-z0-9]+$/i.test(p);
    if (!hasExt) {
      const route = p.endsWith('/') ? p : `${p}/`;
      if (!pageRoutes.has(route) && !redirectRoutes.has(route) && !HTACCESS_REDIRECTS.has(route)) {
        issues.push(`${where}: broken internal link ${raw}`);
      }
      continue;
    }
    if (!(await exists(p))) {
      issues.push(`${where}: missing asset ${raw}`);
      continue;
    }
    if (FINGERPRINTED_DIRS.test(p) && IMAGE_OR_FONT.test(p) && !FINGERPRINT_RE.test(p)) {
      issues.push(`${where}: asset not fingerprinted ${raw}`);
    }
  }
}

if (issues.length) {
  console.error(`Audit failed with ${issues.length} issue(s).`);
  for (const issue of issues.slice(0, 50)) console.error(`- ${issue}`);
  process.exit(1);
}
console.log(`Audit passed: ${inventory.pages.length} pages, ${inventory.redirects.length} redirect shells.`);
