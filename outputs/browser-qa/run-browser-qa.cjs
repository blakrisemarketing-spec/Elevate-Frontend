const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4173';
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = __dirname;
const SNAPSHOT_DIR = path.join(PROJECT_ROOT, 'public', 'snapshots');

const routes = [
  { route: '/', label: 'home', snapshot: 'home.html' },
  { route: '/about/', label: 'about', snapshot: 'about.html' },
  { route: '/career-services/', label: 'career-services', snapshot: 'career-services.html' },
  { route: '/educational-services/', label: 'educational-services', snapshot: 'educational-services.html' },
  { route: '/blog/', label: 'blog', snapshot: 'blog.html' },
  { route: '/contact-us/', label: 'contact-us', snapshot: 'contact-us.html' },
  { route: '/diy-products/', label: 'diy-products', snapshot: 'diy-products.html' },
  { route: '/product/remote-job-playbook/', label: 'product-remote-job-playbook', snapshot: 'product-remote-job-playbook.html' },
  { route: '/how-to-boost-your-career-with-professional-resume-writing/', label: 'post-how-to-boost-career', snapshot: 'how-to-boost-your-career-with-professional-resume-writing.html' }
];

const widths = [360, 390, 430, 768, 1024, 1280, 1440, 1920];
const PARITY_THRESHOLD = 0.8; // Flags major omitted sections while avoiding false failures from collapsed FAQ/mobile-menu text.
function heightFor(width) { return width < 768 ? 780 : width < 1200 ? 900 : 1080; }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function stripText(s) { return (s || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

(async () => {
  ensureDir(OUT_DIR);
  const browser = await chromium.launch({ headless: true });
  const summary = {
    startedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    browser: 'Chromium via Playwright ' + (require('child_process').execSync('playwright --version').toString().trim()),
    routes: [],
    defects: [],
    global: { totalScreenshots: 0 }
  };

  for (const r of routes) {
    const routeResult = { route: r.route, label: r.label, snapshot: r.snapshot, viewports: [] };
    summary.routes.push(routeResult);
    for (const width of widths) {
      const viewport = { width, height: heightFor(width) };
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
      const page = await context.newPage();
      const consoleMessages = [];
      const failedRequests = [];
      const badResponses = [];
      page.on('console', msg => {
        if (['error', 'warning'].includes(msg.type())) consoleMessages.push({ type: msg.type(), text: msg.text() });
      });
      page.on('requestfailed', req => failedRequests.push({ url: req.url(), resourceType: req.resourceType(), errorText: req.failure()?.errorText || '' }));
      page.on('response', res => {
        const url = res.url();
        if (url.startsWith(BASE_URL) && res.status() >= 400) badResponses.push({ url, status: res.status(), statusText: res.statusText() });
      });

      const url = BASE_URL + r.route;
      const started = Date.now();
      let navError = null;
      let metrics = {};
      let menu = null;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(500);
        metrics = await page.evaluate(() => {
          const doc = document.documentElement;
          const body = document.body;
          const main = document.querySelector('main');
          const text = (main?.innerText || body.innerText || '').replace(/\s+/g, ' ').trim();
          const visibleImages = Array.from(document.images).filter(img => img.getBoundingClientRect().width > 0 && img.getBoundingClientRect().height > 0);
          const brokenImages = visibleImages.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.currentSrc || img.src);
          const badOverflow = Array.from(document.body.querySelectorAll('*')).filter(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return false;
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed') return false;
            return rect.right > window.innerWidth + 2 || rect.left < -2;
          }).slice(0, 10).map(el => ({ tag: el.tagName, className: String(el.className || '').slice(0, 120), right: Math.round(el.getBoundingClientRect().right), left: Math.round(el.getBoundingClientRect().left) }));
          const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()).filter(Boolean);
          return {
            title: document.title,
            path: location.pathname,
            textSample: text.slice(0, 220),
            textLength: text.length,
            hasSnapshotError: /Page unavailable|could not be loaded/i.test(text),
            bodyScrollWidth: doc.scrollWidth,
            bodyClientWidth: doc.clientWidth,
            horizontalOverflow: doc.scrollWidth > doc.clientWidth + 2,
            badOverflow,
            visibleImageCount: visibleImages.length,
            brokenImages,
            h1s
          };
        });

        // Mobile menu smoke test where a hamburger/toggler exists.
        menu = await page.evaluate(async () => {
          const toggler = document.querySelector('.elementskit-menu-hamburger, .elementskit-menu-toggler, .hfe-nav-menu__toggle');
          if (!toggler) return { tested: false, reason: 'No hamburger/toggler found' };
          const beforeClasses = String(toggler.className || '');
          toggler.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          await new Promise(r => setTimeout(r, 150));
          const afterClasses = String(toggler.className || '');
          const openNode = document.querySelector('.snapshot-menu-open');
          return { tested: true, beforeClasses, afterClasses, opened: !!openNode, openNodeClass: openNode ? String(openNode.className || '').slice(0, 160) : '' };
        });
      } catch (err) {
        navError = err && err.stack ? err.stack : String(err);
      }

      const routeDir = path.join(OUT_DIR, r.label, String(width));
      ensureDir(routeDir);
      const screenshotPath = path.join(routeDir, 'screenshot.png');
      try { await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' }); summary.global.totalScreenshots++; } catch (err) { console.error('screenshot failed', r.route, width, err); }

      routeResult.viewports.push({
        width,
        height: viewport.height,
        url,
        durationMs: Date.now() - started,
        screenshot: path.relative(PROJECT_ROOT, screenshotPath),
        navError,
        consoleMessages,
        failedRequests,
        badResponses,
        metrics,
        menu
      });
      await context.close();
    }

    // Lightweight parity check: compare app main text at 1280 against preserved snapshot text.
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(BASE_URL + r.route, { waitUntil: 'networkidle', timeout: 30000 });
    const appText = await page.locator('main').innerText().catch(() => '');
    const snapshotPath = path.join(SNAPSHOT_DIR, r.snapshot);
    let parity = { snapshotExists: fs.existsSync(snapshotPath), textSimilarity: null, snapshotTextLength: 0, appTextLength: appText.length };
    if (parity.snapshotExists) {
      const snapText = stripText(fs.readFileSync(snapshotPath, 'utf8'));
      const appNorm = appText.replace(/\s+/g, ' ').trim();
      parity.snapshotTextLength = snapText.length;
      const commonPrefix = (() => { let i = 0; const max = Math.min(snapText.length, appNorm.length); while (i < max && snapText[i] === appNorm[i]) i++; return i; })();
      const tokensA = new Set(snapText.toLowerCase().split(/\W+/).filter(Boolean));
      const tokensB = new Set(appNorm.toLowerCase().split(/\W+/).filter(Boolean));
      let inter = 0; for (const t of tokensA) if (tokensB.has(t)) inter++;
      const union = new Set([...tokensA, ...tokensB]).size || 1;
      parity.textSimilarity = Number((inter / union).toFixed(4));
      parity.commonPrefixChars = commonPrefix;
    }
    routeResult.parity = parity;
    await context.close();
  }

  // Summarize defects automatically from collected evidence.
  for (const r of summary.routes) {
    for (const vp of r.viewports) {
      const loc = `${r.route} @ ${vp.width}px`;
      if (vp.navError) summary.defects.push({ severity: 'Critical', location: loc, type: 'route-render', detail: vp.navError, screenshot: vp.screenshot });
      if (vp.metrics?.hasSnapshotError) summary.defects.push({ severity: 'Critical', location: loc, type: 'snapshot-load', detail: 'Rendered Page unavailable snapshot error', screenshot: vp.screenshot });
      if (vp.badResponses?.length) summary.defects.push({ severity: 'High', location: loc, type: 'local-network', detail: vp.badResponses, screenshot: vp.screenshot });
      if (vp.failedRequests?.filter(x => x.url.startsWith(BASE_URL)).length) summary.defects.push({ severity: 'High', location: loc, type: 'failed-local-request', detail: vp.failedRequests.filter(x => x.url.startsWith(BASE_URL)), screenshot: vp.screenshot });
      if (vp.consoleMessages?.filter(x => x.type === 'error').length) summary.defects.push({ severity: 'Medium', location: loc, type: 'console-error', detail: vp.consoleMessages.filter(x => x.type === 'error'), screenshot: vp.screenshot });
      if (vp.metrics?.horizontalOverflow) summary.defects.push({ severity: vp.width < 768 ? 'High' : 'Medium', location: loc, type: 'horizontal-overflow', detail: { bodyScrollWidth: vp.metrics.bodyScrollWidth, bodyClientWidth: vp.metrics.bodyClientWidth, offenders: vp.metrics.badOverflow }, screenshot: vp.screenshot });
      if (vp.metrics?.brokenImages?.length) summary.defects.push({ severity: 'High', location: loc, type: 'broken-images', detail: vp.metrics.brokenImages, screenshot: vp.screenshot });
      if (vp.menu?.tested && !vp.menu.opened && vp.width < 768) summary.defects.push({ severity: 'High', location: loc, type: 'mobile-menu', detail: vp.menu, screenshot: vp.screenshot });
    }
    if (r.parity?.snapshotExists && r.parity.textSimilarity !== null && r.parity.textSimilarity < PARITY_THRESHOLD) {
      summary.defects.push({ severity: 'Medium', location: `${r.route} @ parity`, type: 'snapshot-parity', detail: { ...r.parity, threshold: PARITY_THRESHOLD } });
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'browser-qa-results.json'), JSON.stringify(summary, null, 2));
  await browser.close();
  console.log(JSON.stringify({ routes: summary.routes.length, screenshots: summary.global.totalScreenshots, defects: summary.defects.length, out: path.join(OUT_DIR, 'browser-qa-results.json') }, null, 2));
})().catch(err => { console.error(err); process.exit(1); });
