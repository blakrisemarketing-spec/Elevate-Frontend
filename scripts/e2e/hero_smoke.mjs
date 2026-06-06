/**
 * Hero responsive smoke test.
 *
 * Serves dist/ statically and loads the home page across a range of viewport
 * widths, asserting that the hero <h1> and the primary CTA both sit above the
 * fold (no headline overflowing off-screen). Screenshots land in .tmp/hero-smoke/.
 *
 * Run after `npm run build` (or `npm run build:priority`):
 *   node scripts/e2e/hero_smoke.mjs
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const distRoot = path.join(projectRoot, 'dist');
const OUT = path.join(projectRoot, '.tmp', 'hero-smoke');
await fs.mkdir(OUT, { recursive: true });

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' };

const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    let fp = path.join(distRoot, p);
    try { await fs.access(fp); } catch { fp = path.join(distRoot, 'index.html'); }
    const buf = await fs.readFile(fp);
    res.writeHead(200, { 'content-type': TYPES[path.extname(fp)] || 'application/octet-stream' });
    res.end(buf);
  } catch { res.writeHead(404); res.end('nf'); }
});
await new Promise(r => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

const VIEWPORTS = [
  { name: 'mobile-375', w: 375, h: 667 },
  { name: 'mobile-414', w: 414, h: 896 },
  { name: 'tablet-768', w: 768, h: 1024 },
  { name: 'laptop-1024', w: 1024, h: 768 },
  { name: 'desktop-1280', w: 1280, h: 800 },
  { name: 'desktop-1478', w: 1478, h: 800 },
  { name: 'wide-1920', w: 1920, h: 1080 },
];

const browser = await chromium.launch();
const results = [];
for (const v of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  const m = await page.evaluate(() => {
    const h1 = document.getElementById('hero-heading');
    const r = h1.getBoundingClientRect();
    const cs = getComputedStyle(h1);
    const cta = document.querySelector('a[href="/career-services/"].btn-primary');
    const cr = cta && cta.getBoundingClientRect();
    return {
      fontSizePx: parseFloat(cs.fontSize),
      h1Top: Math.round(r.top), h1Bottom: Math.round(r.bottom), h1Height: Math.round(r.height),
      headingFullyInViewport: r.bottom <= window.innerHeight,
      ctaVisible: !!cr && cr.top < window.innerHeight,
      innerH: window.innerHeight,
    };
  });
  await page.screenshot({ path: path.join(OUT, `${v.name}.png`) });
  results.push({ vp: v.name, ...m });
  await ctx.close();
}
await browser.close();
server.close();

console.log('viewport       font  h1Top h1Bot h1H  vh   headingInVP ctaInVP');
for (const r of results) {
  console.log(
    r.vp.padEnd(14), String(r.fontSizePx).padStart(4), String(r.h1Top).padStart(5),
    String(r.h1Bottom).padStart(5), String(r.h1Height).padStart(4), String(r.innerH).padStart(4),
    String(r.headingFullyInViewport).padStart(11), String(r.ctaVisible).padStart(7),
  );
}
const fails = results.filter(r => !r.headingFullyInViewport || !r.ctaVisible);
console.log(fails.length ? `\nWARN: ${fails.map(f => f.vp).join(', ')} — heading/CTA not fully above fold` : '\nALL OK: heading + primary CTA above the fold on every viewport');
process.exit(fails.length ? 1 : 0);
