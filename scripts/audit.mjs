import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const pages = JSON.parse(await fs.readFile(path.join(ROOT, 'src/generated/pages.json'), 'utf8'));
const links = JSON.parse(await fs.readFile(path.join(ROOT, 'outputs/link-map.json'), 'utf8'));
const assets = JSON.parse(await fs.readFile(path.join(ROOT, 'outputs/asset-inventory.json'), 'utf8'));
const issues = [];
const warnings = [];

const routes = new Set(pages.map((p) => p.route));
const knownHashOnly = new Set(['/#educational-services']);

for (const page of pages) {
  let html = '';
  try { html = await fs.readFile(path.join(ROOT, 'public', page.htmlPath.replace(/^\//, '')), 'utf8'); }
  catch { issues.push(`Page ${page.route} snapshot file is missing: ${page.htmlPath}`); }
  if (!html || html.length < 200) warnings.push(`Page ${page.route} has unexpectedly small HTML snapshot; likely a WooCommerce/account shell or gated page.`);
  if (!page.title) issues.push(`Page ${page.route} is missing title.`);
  if (!page.description) warnings.push(`Page ${page.route} is missing meta description in the source site.`);
  if ((html.match(/<script\b/gi) || []).length > 0) issues.push(`Page ${page.route} still contains scripts.`);
}

for (const link of links) {
  if (link.kind !== 'internal') continue;
  const routeOnly = String(link.mapped).split('#')[0] || '/';
  if (knownHashOnly.has(link.mapped)) continue;
  if (!routes.has(routeOnly)) issues.push(`Broken internal link on ${link.pageRoute}: ${link.original} -> ${link.mapped}`);
}

for (const asset of assets) {
  const rel = asset.local.replace(/^\//, '');
  try { await fs.access(path.join(ROOT, 'public', rel)); }
  catch { issues.push(`Missing downloaded asset: ${asset.local} from ${asset.source}`); }
}

const report = {
  checkedAt: new Date().toISOString(),
  pages: pages.length,
  links: links.length,
  internalLinks: links.filter((l) => l.kind === 'internal').length,
  assets: assets.length,
  warnings,
  issues,
};
await fs.writeFile(path.join(ROOT, 'outputs/audit-report.json'), JSON.stringify(report, null, 2));

if (issues.length) {
  console.error(`Audit failed with ${issues.length} issue(s).`);
  for (const issue of issues.slice(0, 50)) console.error(`- ${issue}`);
  process.exit(1);
}
for (const warning of warnings.slice(0, 50)) console.warn(`Warning: ${warning}`);
console.log(`Audit passed: ${report.pages} pages, ${report.links} links, ${report.assets} assets, ${warnings.length} warning(s).`);
