import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.BASE_URL || 'http://127.0.0.1:4178';
const outDir = '/Users/greatdamzi/Projects/Elevate-Frontend/outputs/design-system-qa';
await fs.mkdir(outDir, { recursive: true, mode: 0o700 });

const routes = [
  '/',
  '/about/',
  '/career-services/',
  '/educational-services/',
  '/blog/',
  '/contact-us/',
  '/diy-products/',
  '/product/remote-job-playbook/',
];
const viewports = [
  { name: 'mobile390', width: 390, height: 844 },
  { name: 'desktop1440', width: 1440, height: 1100 },
  { name: 'tablet768', width: 768, height: 1024 },
];

const browser = await chromium.launch({ headless: true });
const results = [];

function slug(route) {
  return route === '/' ? 'home' : route.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '-');
}

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  for (const route of routes) {
    const page = await context.newPage();
    const consoleMessages = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on('console', msg => {
      if (['error', 'warning'].includes(msg.type())) consoleMessages.push(`${msg.type()}: ${msg.text()}`.slice(0, 500));
    });
    page.on('pageerror', err => pageErrors.push(String(err.message || err).slice(0, 500)));
    page.on('requestfailed', req => failedRequests.push(`${req.method()} ${req.url()} :: ${req.failure()?.errorText || 'failed'}`.slice(0, 500)));
    const url = new URL(route, base).toString();
    let status = null;
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      status = response?.status() ?? null;
      await page.waitForTimeout(500);
    } catch (e) {
      results.push({ route, viewport: vp.name, error: String(e), consoleMessages, pageErrors, failedRequests });
      await page.close();
      continue;
    }

    const metrics = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const sampleTextEl = document.querySelector('h1, h2, p, a, button');
      const mainEl = document.querySelector('main') || body;
      const cards = Array.from(document.querySelectorAll('article, .elementor-widget-container, .e-con, .card, [class*=card], .product, form, section')).slice(0, 20);
      const buttons = Array.from(document.querySelectorAll('a, button, input[type=submit]')).filter(el => {
        const text = (el.innerText || el.value || '').trim();
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && text && (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || /btn|button|checkout|contact|book|buy|cart|read|get|learn|shop|service/i.test(`${el.className} ${text}`));
      }).slice(0, 15);
      const imgs = Array.from(document.images).map(img => ({
        src: img.currentSrc || img.src,
        alt: img.alt || '',
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        clientWidth: img.clientWidth,
        clientHeight: img.clientHeight,
        visible: !!(img.offsetWidth || img.offsetHeight || img.getClientRects().length),
      }));
      const brokenImages = imgs.filter(img => img.visible && (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0));
      const wideElements = Array.from(document.querySelectorAll('body *')).map(el => {
        const r = el.getBoundingClientRect();
        if (!r || r.width <= 0 || r.height <= 0) return null;
        return { tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 100), text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
      }).filter(Boolean).filter(el => el.right > window.innerWidth + 2 || el.left < -2).slice(0, 20);
      const invisibleTextEls = Array.from(document.querySelectorAll('h1,h2,h3,p,a,button,label,input,textarea')).map(el => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
        return { text: text.slice(0, 80), color: cs.color, bg: cs.backgroundColor, opacity: cs.opacity, display: cs.display, visibility: cs.visibility, width: Math.round(r.width), height: Math.round(r.height) };
      }).filter(el => el.text && (el.opacity === '0' || el.display === 'none' || el.visibility === 'hidden' || el.width === 0 || el.height === 0)).slice(0, 15);
      const bodyStyle = getComputedStyle(body);
      const htmlStyle = getComputedStyle(html);
      const sampleStyle = sampleTextEl ? getComputedStyle(sampleTextEl) : null;
      const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()).filter(Boolean);
      const links = Array.from(document.querySelectorAll('a[href]')).map(a => ({ text: (a.innerText || a.getAttribute('aria-label') || '').trim().slice(0,80), href: a.getAttribute('href') })).slice(0, 80);
      return {
        title: document.title,
        h1s,
        textLength: body.innerText.trim().length,
        scrollWidth: html.scrollWidth,
        innerWidth: window.innerWidth,
        overflowX: html.scrollWidth > window.innerWidth + 2,
        bodyBg: bodyStyle.backgroundColor,
        htmlBg: htmlStyle.backgroundColor,
        mainBg: getComputedStyle(mainEl).backgroundColor,
        sampleTextColor: sampleStyle?.color,
        sampleFont: sampleStyle?.fontFamily,
        cards: cards.map(el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0,80), bg: cs.backgroundColor, border: cs.borderColor, radius: cs.borderRadius, shadow: cs.boxShadow, width: Math.round(r.width), height: Math.round(r.height) }; }),
        buttons: buttons.map(el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { text: (el.innerText || el.value || '').trim().slice(0,80), bg: cs.backgroundColor, color: cs.color, border: cs.borderColor, radius: cs.borderRadius, width: Math.round(r.width), height: Math.round(r.height), href: el.getAttribute('href') }; }),
        imageCount: imgs.length,
        brokenImages,
        wideElements,
        invisibleTextEls,
        linkCount: document.querySelectorAll('a[href]').length,
        emptyOrHashLinks: links.filter(l => !l.href || l.href === '#' || l.href === '/#'),
      };
    });

    let mobileNav = null;
    if (vp.width <= 390 && route === '/') {
      mobileNav = await page.evaluate(async () => {
        const candidates = Array.from(document.querySelectorAll('button, [role=button], a')).filter(el => {
          const label = `${el.getAttribute('aria-label') || ''} ${el.textContent || ''} ${el.className || ''}`;
          const r = el.getBoundingClientRect();
          return r.width > 20 && r.height > 20 && /menu|nav|hamburger|toggle|bars|open/i.test(label);
        });
        return candidates.map(el => ({ tag: el.tagName.toLowerCase(), label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0,80), cls: String(el.className || '').slice(0,120), rect: (() => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() })).slice(0, 10);
      });
      const navButton = page.locator('button, [role=button], a').filter({ hasText: /menu/i }).first();
      try {
        if (await navButton.count()) {
          await navButton.click({ timeout: 3000 });
          await page.waitForTimeout(300);
        }
      } catch {}
    }

    const screenshot = path.join(outDir, `${slug(route)}-${vp.name}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    results.push({ route, viewport: vp.name, status, screenshot, metrics, consoleMessages, pageErrors, failedRequests, mobileNav });
    await page.close();
  }
  await context.close();
}

await browser.close();
await fs.writeFile(path.join(outDir, 'qa-results.json'), JSON.stringify({ base, generatedAt: new Date().toISOString(), routes, viewports, results }, null, 2));
console.log(`Wrote ${results.length} results to ${outDir}`);
