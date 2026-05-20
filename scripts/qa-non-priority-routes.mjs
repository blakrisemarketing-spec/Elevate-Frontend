// Lightweight QA assertions for non-priority routes.
//
// Priority routes (home/about/career-services/educational-services/diy-products/contact-us)
// are covered end-to-end by qa-wordpress-html.mjs. Cart/checkout/my-account/shop/manage-profile
// are intentional redirect shells. The remaining migrated routes (currently 24) ship as
// pre-rendered SPA shells with route-specific <head> metadata + meaningful body content.
// This script proves each one of those shells:
//   1. Returns HTTP 200 by direct URL.
//   2. Has a non-empty, non-generic <title>.
//   3. Has a non-empty <meta name="description">.
//   4. Has a <link rel="canonical">.
//   5. Has a meaningful <h1>.
// Exits non-zero on any failure.

import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

const projectRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(projectRoot, 'dist');
const outDir = path.join(projectRoot, 'outputs');
const pages = JSON.parse(await fs.readFile(path.join(projectRoot, 'src/generated/pages.json'), 'utf8'));

const PRIORITY_ROUTES = new Set(['/', '/about/', '/career-services/', '/educational-services/', '/diy-products/', '/contact-us/']);
const REDIRECT_ROUTES = new Set(['/cart/', '/checkout/', '/my-account/', '/shop/', '/manage-profile/']);
const GENERIC_TITLES = new Set([
  'elevate career hub',
  '',
]);
const MIN_DESCRIPTION_LEN = 30;
const MIN_H1_LEN = 4;

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js') return 'text/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.woff2') return 'font/woff2';
  if (ext === '.woff') return 'font/woff';
  if (ext === '.ttf') return 'font/ttf';
  return 'application/octet-stream';
}

function resolveFile(urlPath) {
  const safePath = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const direct = path.join(distRoot, safePath);
  return safePath.endsWith('/') || !path.extname(safePath)
    ? path.join(direct, 'index.html')
    : direct;
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      const filePath = resolveFile(url.pathname);
      const relative = path.relative(distRoot, filePath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Invalid path');
      const body = await fs.readFile(filePath);
      res.writeHead(200, { 'content-type': contentType(filePath) });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('not found');
    }
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, port: address.port });
    });
  });
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function extractTitle(html) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1]).replace(/\s+/g, ' ').trim() : '';
}

function extractMetaName(html, name) {
  const re = new RegExp(`<meta\\b[^>]*\\bname=(['"])${name}\\1[^>]*>`, 'i');
  const tag = html.match(re)?.[0] || '';
  if (!tag) return '';
  const content = tag.match(/\bcontent=(['"])([\s\S]*?)\1/i);
  return content ? decodeEntities(content[2]).trim() : '';
}

function extractMetaProperty(html, property) {
  const re = new RegExp(`<meta\\b[^>]*\\bproperty=(['"])${property}\\1[^>]*>`, 'i');
  const tag = html.match(re)?.[0] || '';
  if (!tag) return '';
  const content = tag.match(/\bcontent=(['"])([\s\S]*?)\1/i);
  return content ? decodeEntities(content[2]).trim() : '';
}

function extractCanonical(html) {
  const tag = html.match(/<link\b[^>]*\brel=(['"])canonical\1[^>]*>/i)?.[0] || '';
  if (!tag) return '';
  const href = tag.match(/\bhref=(['"])([\s\S]*?)\1/i);
  return href ? href[2].trim() : '';
}

function extractFirstH1(html) {
  const match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!match) return '';
  return decodeEntities(match[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

const { server, port } = await startServer();
const base = `http://127.0.0.1:${port}`;
const results = [];
let totalFailures = 0;

try {
  for (const page of pages) {
    if (PRIORITY_ROUTES.has(page.route)) continue;
    if (REDIRECT_ROUTES.has(page.route)) continue;

    const url = `${base}${page.route}`;
    const failures = [];
    let status = 0;
    let title = '';
    let description = '';
    let canonical = '';
    let h1 = '';
    let ogTitle = '';
    let twitterTitle = '';

    try {
      const response = await fetch(url, { redirect: 'manual' });
      status = response.status;
      const text = await response.text();

      if (status !== 200) failures.push(`HTTP status ${status}, expected 200`);

      title = extractTitle(text);
      description = extractMetaName(text, 'description');
      canonical = extractCanonical(text);
      h1 = extractFirstH1(text);
      ogTitle = extractMetaProperty(text, 'og:title');
      twitterTitle = extractMetaName(text, 'twitter:title');

      if (!title) failures.push('Empty <title>');
      else if (GENERIC_TITLES.has(title.toLowerCase())) failures.push(`Generic <title>: "${title}"`);

      if (!description) failures.push('Missing or empty meta description');
      else if (description.length < MIN_DESCRIPTION_LEN) failures.push(`Meta description too short (${description.length} chars): "${description}"`);

      if (!canonical) failures.push('Missing <link rel="canonical">');

      if (!h1) failures.push('Missing <h1>');
      else if (h1.length < MIN_H1_LEN) failures.push(`<h1> too short: "${h1}"`);

      if (!ogTitle) failures.push('Missing og:title');
      if (!twitterTitle) failures.push('Missing twitter:title');
    } catch (err) {
      failures.push(`Fetch error: ${err && err.message ? err.message : String(err)}`);
    }

    results.push({
      route: page.route,
      status,
      title,
      description,
      canonical,
      h1,
      ogTitle,
      twitterTitle,
      passed: failures.length === 0,
      failures,
    });
    if (failures.length) totalFailures += 1;
  }
} finally {
  await new Promise(resolve => server.close(resolve));
}

const generatedAt = new Date().toISOString();
await fs.mkdir(outDir, { recursive: true, mode: 0o700 });
const summary = {
  generatedAt,
  base,
  totalRoutes: results.length,
  failedRoutes: totalFailures,
  results,
};
await fs.writeFile(path.join(outDir, 'qa-non-priority-routes.json'), JSON.stringify(summary, null, 2));

const md = [
  '# Non-Priority Route QA — Pre-Rendered SPA Shells',
  '',
  `Generated: ${generatedAt}`,
  '',
  `Command: \`node scripts/qa-non-priority-routes.mjs\``,
  '',
  `Result: ${totalFailures === 0 ? 'PASS' : 'FAIL'} (${results.length - totalFailures}/${results.length} routes passed)`,
  '',
  'Each non-priority migrated route ships as a pre-rendered SPA shell with route-specific',
  '`<head>` metadata + meaningful `<body>` content. This gate proves crawlers and social',
  'previews see real, indexable content (not the generic SPA fallback).',
  '',
  '| Route | HTTP | Title | Meta description (len) | H1 | Result |',
  '|---|---:|---|---:|---|---|',
  ...results.map(r => `| \`${r.route}\` | ${r.status} | ${r.title || '(empty)'} | ${r.description.length} | ${r.h1 || '(empty)'} | ${r.passed ? 'PASS' : `FAIL — ${r.failures.join('; ')}`} |`),
  '',
].join('\n');
await fs.writeFile(path.join(outDir, 'qa-non-priority-routes.md'), md);

console.log('═══════════════════════════════════════════════════════════════════');
console.log(`Non-priority route QA: ${results.length} routes checked.`);
for (const r of results) {
  if (r.passed) {
    console.log(`  [PASS] ${r.route}  | title: "${r.title}"`);
  } else {
    console.log(`  [FAIL] ${r.route}  | ${r.failures.join('; ')}`);
  }
}
console.log('═══════════════════════════════════════════════════════════════════');

if (totalFailures > 0) {
  console.error(`Non-priority route QA failed for ${totalFailures} route(s).`);
  process.exit(1);
}
console.log(`Non-priority route QA passed for all ${results.length} route(s).`);
