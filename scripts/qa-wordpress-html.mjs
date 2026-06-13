import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const projectRoot = path.resolve(new URL('..', import.meta.url).pathname);
const outDir = path.join(projectRoot, 'outputs', 'wordpress-html-qa');

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 4199;
      server.close(() => resolve(port));
    });
  });
}

const qaPort = Number(process.env.WORDPRESS_QA_PORT) || await getFreePort();
const appBase = `http://127.0.0.1:${qaPort}`;

const routes = [
  { route: '/', slug: 'home', source: 'Home.html' },
  { route: '/about/', slug: 'about', source: 'About.html' },
  { route: '/career-services/', slug: 'career-services', source: 'Career-services.html' },
  { route: '/educational-services/', slug: 'educational-services', source: 'Education-services.html' },
  { route: '/diy-products/', slug: 'diy-products', source: 'DIY-Products.html' },
  { route: '/contact-us/', slug: 'contact-us', source: 'Contact.html' },
];
const viewports = [
  { name: 'mobile390', width: 390, height: 844 },
  { name: 'desktop1440', width: 1440, height: 1100 },
];

// Allowlist of failed-request host patterns that are documented external non-critical
// dependencies. ANY entry must include a one-line justification. The QA gate ignores
// failures matching these patterns when computing the appFailedRequests blocker count.
//
// Currently empty: post-Workstream D the priority routes have zero remote plugin/font
// loads, so no entry is justified. Add patterns here only if a future, intentional
// external request is approved by Mara/Iris and documented in the dispatch.
const FAILED_REQUEST_ALLOWLIST = [
  // Example (do NOT enable without justification):
  // { pattern: /^https:\/\/cdn\.example\.com\//, reason: 'Optional CDN: required only for X feature, fallback covers MVP.' },
];

// Required priority routes for H1/title assertions. Exception list (slugs) lets the
// gate forgive a documented missing-H1 case. Currently empty — every priority route
// must have a single H1 per Mara's dispatch §C.
const H1_EXCEPTION_SLUGS = new Set([]);

async function waitForUrl(url, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, res => {
          res.resume();
          res.on('end', resolve);
        });
        req.setTimeout(1000, () => req.destroy(new Error('timeout')));
        req.on('error', reject);
      });
      return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function launchPreview() {
  const child = spawn('pnpm', ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(qaPort), '--strictPort'], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '0' },
    detached: true,
  });
  let log = '';
  child.stdout.on('data', d => { log += d.toString(); });
  child.stderr.on('data', d => { log += d.toString(); });
  child.on('exit', code => { if (code && code !== 0) console.error(`Preview exited ${code}\n${log}`); });
  return { child, getLog: () => log };
}

async function collectPage(browser, target, vp, screenshotPath) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.route('**/*', async route => {
    const url = route.request().url();
    if (/google|facebook|clarity|googletagmanager|google-analytics|wp-admin\/admin-ajax\.php/i.test(url)) {
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    await route.continue();
  });
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', msg => {
    if (['error', 'warning'].includes(msg.type())) consoleMessages.push(`${msg.type()}: ${msg.text()}`.slice(0, 400));
  });
  page.on('pageerror', err => pageErrors.push(String(err.message || err).slice(0, 400)));
  page.on('requestfailed', req => failedRequests.push(`${req.url()} :: ${req.failure()?.errorText || 'failed'}`.slice(0, 500)));

  const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(async err => {
    consoleMessages.push(`error: navigation failed after ${String(err.message || err).slice(0, 160)}`);
    return null;
  });
  await page.waitForTimeout(1000);
  // Trigger lazy-loaded WordPress images before collecting image health and screenshots.
  await page.evaluate(async () => {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    for (let y = 0; y <= max; y += Math.max(500, window.innerHeight * 0.8)) {
      window.scrollTo(0, y);
      await delay(80);
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);
  await Promise.race([
    page.evaluate(async () => {
      await Promise.all(Array.from(document.images).map(img => img.decode().catch(() => undefined)));
    }),
    new Promise(resolve => setTimeout(resolve, 1000)),
  ]);

  const metrics = await page.evaluate(() => {
    const visibleText = document.body?.innerText || '';
    const imgs = Array.from(document.images).map(img => ({
      src: img.currentSrc || img.src,
      visible: !!(img.offsetWidth || img.offsetHeight || img.getClientRects().length),
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      width: img.clientWidth,
      height: img.clientHeight,
    }));
    const brokenImages = imgs.filter(img => img.visible && (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0));
    // Specific raw shortcode tokens we never want visible to a real visitor.
    // We detect these as bracketed shortcode patterns that escaped a build-time replacement.
    const shortcodeTokens = [
      'fluentform', 'fluent_form', 'woocommerce_', 'product_', 'add_to_cart',
      'wpforms', 'contact-form-7', 'gravityform', 'eael-', 'elementor-template',
    ];
    const rawShortcodeMatches = [];
    for (const token of shortcodeTokens) {
      const re = new RegExp('\\[/?' + token.replace(/[-_]/g, '[-_]') + '[^\\]]*\\]', 'i');
      const m = visibleText.match(re);
      if (m) rawShortcodeMatches.push(m[0].slice(0, 80));
    }
    // Generic shortcode-shaped text remains a soft signal (informational).
    const rawShortcodeText = /\[[a-z_\-]+[^\]]*\]/i.test(visibleText);
    const entryLimitPattern = /maximum number of entries[\s\S]{0,40}exceeded/i;
    const visibleEntryLimitMessage = entryLimitPattern.test(visibleText);
    // Form quota / failure messages beyond the specific Fluent Forms string.
    const formQuotaPatterns = [
      /maximum number of entries/i,
      /form submission limit/i,
      /this form is no longer accepting submissions/i,
      /form is currently disabled/i,
    ];
    const visibleFormQuotaMessage = formQuotaPatterns.some(p => p.test(visibleText));
    const navText = Array.from(document.querySelectorAll('nav a, header a, .menu-item a')).map(a => (a.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const requiredNavTokens = ['home', 'about', 'contact'];
    const navHasRequired = requiredNavTokens.every(token =>
      navText.some(t => new RegExp(token, 'i').test(t))
    );

    // Metadata extraction
    const getMeta = (selector, attr = 'content') => {
      const el = document.querySelector(selector);
      return el ? (el.getAttribute(attr) || '').trim() : '';
    };
    const metadata = {
      description: getMeta('meta[name="description"]'),
      canonical: getMeta('link[rel="canonical"]', 'href'),
      ogTitle: getMeta('meta[property="og:title"]'),
      ogDescription: getMeta('meta[property="og:description"]'),
      twitterTitle: getMeta('meta[name="twitter:title"]'),
      twitterDescription: getMeta('meta[name="twitter:description"]'),
    };
    const entryLimitInMetadata = Object.values(metadata).some(v =>
      typeof v === 'string' && entryLimitPattern.test(v)
    );

    // Contact CTA detection: WhatsApp + mailto must appear at least once anywhere visible.
    const allLinks = Array.from(document.querySelectorAll('a[href]')).map(a => ({
      href: a.getAttribute('href') || '',
      text: (a.textContent || '').replace(/\s+/g, ' ').trim(),
      visible: !!(a.offsetWidth || a.offsetHeight || a.getClientRects().length),
    }));
    const whatsappLinks = allLinks.filter(l => /^https:\/\/wa\.me\/233531113454/i.test(l.href));
    const mailtoLinks = allLinks.filter(l => /^mailto:elevatewithnll@gmail\.com/i.test(l.href));

    return {
      title: document.title,
      h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()).filter(Boolean),
      textLength: visibleText.trim().length,
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
      imageCount: imgs.length,
      brokenImages: brokenImages.slice(0, 10),
      brokenImageCount: brokenImages.length,
      rawShortcodeText,
      rawShortcodeMatches,
      visibleEntryLimitMessage,
      visibleFormQuotaMessage,
      entryLimitInMetadata,
      hasEducationalServicesNav: navText.some(t => /educational services/i.test(t)),
      navHasRequired,
      navText: navText.slice(0, 30),
      metadata,
      whatsappLinkCount: whatsappLinks.length,
      mailtoLinkCount: mailtoLinks.length,
      whatsappVisibleCount: whatsappLinks.filter(l => l.visible).length,
      mailtoVisibleCount: mailtoLinks.filter(l => l.visible).length,
    };
  });

  await page.screenshot({ path: screenshotPath, fullPage: true });
  await context.close();
  return { status: response?.status() ?? null, screenshot: screenshotPath, metrics, consoleMessages, pageErrors, failedRequests };
}

async function makeComparison(browser, sourcePng, appPng, route, vp, output) {
  const page = await browser.newPage({ viewport: { width: Math.min(1800, vp.width * 2 + 80), height: Math.min(1400, vp.height + 180) } });
  const sourceUrl = pathToFileURL(sourcePng).href;
  const appUrl = pathToFileURL(appPng).href;
  await page.setContent(`<!doctype html><html><head><style>
    body{margin:0;background:#111;color:#fff;font:14px system-ui,-apple-system,Segoe UI,sans-serif;}
    .bar{position:sticky;top:0;z-index:2;background:#111;padding:10px 14px;border-bottom:1px solid #333;}
    .wrap{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px;align-items:start;}
    .panel{background:#222;border:1px solid #444;overflow:hidden;}
    .label{padding:8px 10px;background:#000;font-weight:700;}
    img{display:block;width:100%;height:auto;background:white;}
  </style></head><body>
    <div class="bar">${route.route} — ${vp.name}: local WordPress source (left) vs rebuilt app (right)</div>
    <div class="wrap">
      <div class="panel"><div class="label">SOURCE: ${route.source}</div><img src="${sourceUrl}"></div>
      <div class="panel"><div class="label">APP: ${route.route}</div><img src="${appUrl}"></div>
    </div>
  </body></html>`, { waitUntil: 'load' });
  await page.screenshot({ path: output, fullPage: true });
  await page.close();
}

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true, mode: 0o700 });
const preview = launchPreview();
try {
  await waitForUrl(appBase);
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const vp of viewports) {
    for (const route of routes) {
      const sourceUrl = pathToFileURL(path.join(projectRoot, 'Wordpress Files', route.source)).href;
      const appUrl = new URL(route.route, appBase).href;
      const sourceShot = path.join(outDir, `${route.slug}-${vp.name}-source.png`);
      const appShot = path.join(outDir, `${route.slug}-${vp.name}-app.png`);
      const compareShot = path.join(outDir, `${route.slug}-${vp.name}-compare.png`);
      console.log(`Capturing ${route.route} ${vp.name} source`);
      const source = await collectPage(browser, { url: sourceUrl }, vp, sourceShot);
      console.log(`Capturing ${route.route} ${vp.name} app`);
      const app = await collectPage(browser, { url: appUrl }, vp, appShot);
      console.log(`Composing ${route.route} ${vp.name} comparison`);
      await makeComparison(browser, sourceShot, appShot, route, vp, compareShot);
      results.push({ route: route.route, sourceFile: route.source, viewport: vp, source, app, comparison: compareShot });
      console.log(`Captured ${route.route} ${vp.name}`);
    }
  }
  await browser.close();

  // ─── Hardened pass/fail evaluation ───────────────────────────────────────────
  // Defects are evaluated ONLY against `app` captures (the deployed dist). Source
  // captures of the raw WordPress export legitimately have broken images / errors
  // and are kept for visual-comparison purposes only.
  const blockerLabels = {
    routeStatusNon200: 'Priority route HTTP status != 200',
    brokenImages: 'Visible broken images',
    pageErrors: 'JS page errors',
    failedRequests: 'Failed app requests (post-allowlist)',
    overflowX: 'Horizontal overflow on required viewport',
    visibleEntryLimit: 'Visible "Maximum number of entries exceeded."',
    formQuotaMessage: 'Visible form quota / submission-disabled message',
    entryLimitMetadata: 'Entry-limit text leaked into metadata',
    rawShortcode: 'Raw shortcode token visible (e.g. [fluentform], [woocommerce_…])',
    emptyTitle: 'Empty <title> on priority route',
    missingH1: 'Missing page-level <h1> on priority route',
    navUnusable: 'Required nav items missing (home/about/contact)',
    missingMetaDescription: 'Missing meta description',
    missingCanonical: 'Missing canonical link',
    missingOg: 'Missing OG title or description',
    missingTwitter: 'Missing Twitter title or description',
    missingContactCtas: '/contact-us/ missing visible WhatsApp + email CTAs',
    invalidContactCtaHref: 'Contact CTA href does not match dispatched destinations',
  };
  const counts = Object.fromEntries(Object.keys(blockerLabels).map(k => [k, 0]));
  const failures = []; // detailed list

  function recordFailure(category, route, viewportName, detail) {
    counts[category] = (counts[category] || 0) + 1;
    failures.push({ category, route, viewport: viewportName, detail });
  }

  for (const r of results) {
    const slug = (routes.find(rt => rt.route === r.route) || {}).slug || r.route;
    const vpName = r.viewport.name;
    const m = r.app.metrics;
    if (r.app.status !== 200) {
      recordFailure('routeStatusNon200', r.route, vpName, `status=${r.app.status}`);
    }
    if (m.brokenImageCount > 0) {
      recordFailure('brokenImages', r.route, vpName, `${m.brokenImageCount} broken visible image(s)`);
    }
    if (r.app.pageErrors.length > 0) {
      recordFailure('pageErrors', r.route, vpName, r.app.pageErrors.slice(0, 3).join(' | '));
    }
    const filteredFailedRequests = r.app.failedRequests.filter(req => {
      const url = String(req).split(' :: ')[0];
      return !FAILED_REQUEST_ALLOWLIST.some(entry => entry.pattern.test(url));
    });
    if (filteredFailedRequests.length > 0) {
      recordFailure('failedRequests', r.route, vpName, `${filteredFailedRequests.length} failure(s); first: ${filteredFailedRequests[0].slice(0, 200)}`);
    }
    if (m.overflowX) {
      recordFailure('overflowX', r.route, vpName, `scrollWidth=${m.scrollWidth} > innerWidth=${m.innerWidth}`);
    }
    if (m.visibleEntryLimitMessage) {
      recordFailure('visibleEntryLimit', r.route, vpName, 'entry-limit text in body innerText');
    }
    if (m.visibleFormQuotaMessage && !m.visibleEntryLimitMessage) {
      recordFailure('formQuotaMessage', r.route, vpName, 'form quota / disabled message visible');
    }
    if (m.entryLimitInMetadata) {
      recordFailure('entryLimitMetadata', r.route, vpName, JSON.stringify(m.metadata));
    }
    if (m.rawShortcodeMatches && m.rawShortcodeMatches.length > 0) {
      recordFailure('rawShortcode', r.route, vpName, m.rawShortcodeMatches.join(', '));
    }
    if (!m.title || !m.title.trim()) {
      recordFailure('emptyTitle', r.route, vpName, 'document.title empty');
    }
    if ((!m.h1 || m.h1.length === 0) && !H1_EXCEPTION_SLUGS.has(slug)) {
      recordFailure('missingH1', r.route, vpName, 'no <h1> elements');
    }
    if (!m.navHasRequired) {
      recordFailure('navUnusable', r.route, vpName, `nav lacks one of home/about/contact (saw ${m.navText.length} items)`);
    }
    if (!m.metadata.description) {
      recordFailure('missingMetaDescription', r.route, vpName, 'meta[name=description] missing or empty');
    }
    if (!m.metadata.canonical) {
      recordFailure('missingCanonical', r.route, vpName, 'link[rel=canonical] missing or empty');
    }
    if (!m.metadata.ogTitle || !m.metadata.ogDescription) {
      recordFailure('missingOg', r.route, vpName, `og:title="${m.metadata.ogTitle}", og:description="${m.metadata.ogDescription}"`);
    }
    if (!m.metadata.twitterTitle || !m.metadata.twitterDescription) {
      recordFailure('missingTwitter', r.route, vpName, `twitter:title="${m.metadata.twitterTitle}", twitter:description="${m.metadata.twitterDescription}"`);
    }
    // Contact CTA validity is asserted on the contact page specifically: both
    // CTAs must be visibly present, with hrefs exactly matching the dispatched
    // WhatsApp number and email address.
    if (r.route === '/contact-us/') {
      if (m.whatsappVisibleCount < 1 || m.mailtoVisibleCount < 1) {
        recordFailure(
          'missingContactCtas',
          r.route,
          vpName,
          `whatsappVisible=${m.whatsappVisibleCount}, mailtoVisible=${m.mailtoVisibleCount}`
        );
      }
      if (m.whatsappLinkCount === 0 || m.mailtoLinkCount === 0) {
        recordFailure(
          'invalidContactCtaHref',
          r.route,
          vpName,
          `wa.me/233531113454 count=${m.whatsappLinkCount}, mailto:hello@elevatecareerhub.com count=${m.mailtoLinkCount}`
        );
      }
    }
  }

  const totalBlockers = Object.values(counts).reduce((a, b) => a + b, 0);
  const summary = {
    generatedAt: new Date().toISOString(),
    appBase,
    routes,
    viewports,
    failedRequestAllowlist: FAILED_REQUEST_ALLOWLIST.map(e => ({
      pattern: e.pattern.toString(),
      reason: e.reason,
    })),
    h1ExceptionSlugs: Array.from(H1_EXCEPTION_SLUGS),
    blockerCounts: counts,
    blockerLabels,
    failures,
    totalBlockers,
    pass: totalBlockers === 0,
    results,
  };
  await fs.writeFile(path.join(outDir, 'qa-results.json'), JSON.stringify(summary, null, 2));

  // ─── Human-readable summary ──────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  WordPress HTML QA — Hardened Gate Summary');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`  Routes checked      : ${routes.length}`);
  console.log(`  Viewports per route : ${viewports.map(v => v.name).join(', ')}`);
  console.log(`  Allowlisted hosts   : ${FAILED_REQUEST_ALLOWLIST.length}`);
  console.log(`  H1 exceptions       : ${H1_EXCEPTION_SLUGS.size}`);
  console.log('-------------------------------------------------------------------');
  for (const [key, label] of Object.entries(blockerLabels)) {
    const count = counts[key] || 0;
    const marker = count === 0 ? 'PASS' : 'FAIL';
    console.log(`  [${marker}] ${label}: ${count}`);
  }
  console.log('-------------------------------------------------------------------');
  if (totalBlockers > 0) {
    console.log(`  Total blocker findings: ${totalBlockers}`);
    console.log('  First 20 failure details:');
    for (const f of failures.slice(0, 20)) {
      console.log(`    - [${f.category}] ${f.route} ${f.viewport}: ${f.detail}`);
    }
  }
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`  Result: ${summary.pass ? 'PASS (exit 0)' : 'FAIL (exit 1)'}`);
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`  WordPress HTML QA screenshots/results written to ${outDir}`);

  if (!summary.pass) {
    process.exitCode = 1;
  }
} finally {
  const killPreview = signal => {
    try { process.kill(-preview.child.pid, signal); }
    catch { preview.child.kill(signal); }
  };
  await new Promise(resolve => {
    const timer = setTimeout(() => {
      killPreview('SIGKILL');
      resolve();
    }, 5000);
    preview.child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    killPreview('SIGTERM');
  });
  await fs.writeFile(path.join(outDir, 'preview.log'), preview.getLog()).catch(() => {});
}
