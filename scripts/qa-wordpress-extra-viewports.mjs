import { chromium } from '/opt/homebrew/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';

const projectRoot = path.resolve(new URL('..', import.meta.url).pathname);
const outDir = path.join(projectRoot, 'outputs', 'wordpress-html-extra-viewport-qa');

const routes = [
  { route: '/', slug: 'home' },
  { route: '/about/', slug: 'about' },
  { route: '/career-services/', slug: 'career-services' },
  { route: '/educational-services/', slug: 'educational-services' },
  { route: '/diy-products/', slug: 'diy-products' },
  { route: '/contact-us/', slug: 'contact-us' },
];

const viewports = [360, 390, 430, 768, 1024, 1440].map(width => ({
  name: `${width}w`,
  width,
  height: width >= 1024 ? 1100 : 900,
}));

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

const qaPort = Number(process.env.WORDPRESS_EXTRA_QA_PORT) || await getFreePort();
const appBase = `http://127.0.0.1:${qaPort}`;

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
  return { child, getLog: () => log };
}

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

async function collect(browser, route, vp) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.route('**/*', async routeRequest => {
    const url = routeRequest.request().url();
    if (/google|facebook|clarity|googletagmanager|google-analytics|wp-admin\/admin-ajax\.php/i.test(url)) {
      await routeRequest.fulfill({ status: 204, body: '' });
      return;
    }
    await routeRequest.continue();
  });

  const pageErrors = [];
  const failedRequests = [];
  page.on('pageerror', err => pageErrors.push(String(err.message || err).slice(0, 400)));
  page.on('requestfailed', req => failedRequests.push(`${req.url()} :: ${req.failure()?.errorText || 'failed'}`.slice(0, 500)));

  const response = await page.goto(new URL(route.route, appBase).href, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(800);
  await page.evaluate(async () => {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    for (let y = 0; y <= max; y += Math.max(420, window.innerHeight * 0.75)) {
      window.scrollTo(0, y);
      await delay(70);
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
  await Promise.race([
    page.evaluate(async () => Promise.all(Array.from(document.images).map(img => img.decode().catch(() => undefined)))),
    new Promise(resolve => setTimeout(resolve, 1500)),
  ]);

  const metrics = await page.evaluate(() => {
    const visibleText = document.body?.innerText || '';
    const images = Array.from(document.images).map(img => ({
      src: img.currentSrc || img.src,
      visible: !!(img.offsetWidth || img.offsetHeight || img.getClientRects().length),
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      width: img.clientWidth,
      height: img.clientHeight,
    }));
    const visibleLinks = Array.from(document.querySelectorAll('a')).filter(a => {
      const rect = a.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }).map(a => ({ text: (a.textContent || '').replace(/\s+/g, ' ').trim(), href: a.href })).filter(a => a.text || a.href);
    return {
      title: document.title,
      h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()).filter(Boolean),
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
      brokenVisibleImages: images.filter(img => img.visible && (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0)),
      visibleEntryLimitMessage: /maximum number of entries exceeded/i.test(visibleText),
      navLinkCount: visibleLinks.filter(a => /home|about|services|contact|products|blog/i.test(a.text)).length,
      ctaLinkCount: visibleLinks.filter(a => /contact|whats|mail|consult|book|purchase|service|product/i.test(`${a.text} ${a.href}`)).length,
    };
  });

  const screenshot = path.join(outDir, `${route.slug}-${vp.name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  await context.close();

  return {
    route: route.route,
    viewport: vp,
    status: response.status(),
    screenshot,
    metrics,
    pageErrors,
    failedRequests,
  };
}

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true, mode: 0o700 });
const preview = launchPreview();
let exitCode = 0;
try {
  await waitForUrl(appBase);
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const vp of viewports) {
    for (const route of routes) {
      console.log(`Checking ${route.route} at ${vp.width}px`);
      const result = await collect(browser, route, vp);
      results.push(result);
      const hasDefect = result.status !== 200 || result.metrics.overflowX || result.metrics.brokenVisibleImages.length > 0 || result.metrics.visibleEntryLimitMessage || result.pageErrors.length > 0;
      if (hasDefect) exitCode = 1;
    }
  }
  await browser.close();
  const summary = {
    generatedAt: new Date().toISOString(),
    appBase,
    routes,
    viewports,
    totals: {
      brokenVisibleImages: results.reduce((sum, r) => sum + r.metrics.brokenVisibleImages.length, 0),
      overflowCases: results.filter(r => r.metrics.overflowX).length,
      entryLimitCases: results.filter(r => r.metrics.visibleEntryLimitMessage).length,
      pageErrors: results.reduce((sum, r) => sum + r.pageErrors.length, 0),
      failedRequests: results.reduce((sum, r) => sum + r.failedRequests.length, 0),
    },
    results,
  };
  await fs.writeFile(path.join(outDir, 'extra-viewport-results.json'), JSON.stringify(summary, null, 2));
  console.log(`Extra viewport QA written to ${outDir}`);
  console.log(JSON.stringify(summary.totals, null, 2));
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

process.exitCode = exitCode;
