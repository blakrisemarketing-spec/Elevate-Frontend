import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.BASE_URL || 'http://127.0.0.1:4174';
const outDir = '/Users/greatdamzi/Projects/Elevate-Frontend/outputs/mobile-menu-qa-v2';
await fs.mkdir(outDir, { recursive: true, mode: 0o700 });

const routes = [
  '/',
  '/about/',
  '/career-services/',
  '/educational-services/',
  '/diy-products/',
  '/contact-us/',
];
const viewports = [
  { name: 'mobile360', width: 360, height: 800 },
  { name: 'mobile390', width: 390, height: 844 },
  { name: 'mobile430', width: 430, height: 932 },
];

const browser = await chromium.launch({ headless: true });
const results = [];

function slug(route) {
  return route === '/' ? 'home' : route.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '-');
}

async function getIconControls(page) {
  return await page.evaluate(() => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
    };
    const controls = Array.from(document.querySelectorAll('a, button, [role="button"]')).filter((el) => {
      if (!visible(el)) return false;
      const text = `${el.getAttribute('aria-label') || ''} ${el.textContent || ''} ${el.className || ''}`.toLowerCase();
      const hasSvg = !!el.querySelector('svg');
      const hasIconClass = /icon|menu|toggle|hamburger|social|share|whatsapp|instagram|facebook|twitter|x/i.test(text);
      return hasSvg || hasIconClass;
    }).slice(0, 40);
    return controls.map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        label: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
        cls: String(el.className || '').slice(0, 120),
        href: el.getAttribute('href'),
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        pointerEvents: cs.pointerEvents,
        hasSvg: !!el.querySelector('svg'),
      };
    });
  });
}

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  for (const route of routes) {
    const page = await context.newPage();
    const consoleMessages = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on('console', (msg) => {
      if (['error', 'warning'].includes(msg.type())) consoleMessages.push(`${msg.type()}: ${msg.text()}`.slice(0, 500));
    });
    page.on('pageerror', (err) => pageErrors.push(String(err.message || err).slice(0, 500)));
    page.on('requestfailed', (req) => failedRequests.push(`${req.method()} ${req.url()} :: ${req.failure()?.errorText || 'failed'}`.slice(0, 500)));

    const url = new URL(route, base).toString();
    let status = null;
    let loadError = null;
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      status = response?.status() ?? null;
      await page.waitForTimeout(400);
    } catch (error) {
      loadError = String(error);
    }

    const metrics = loadError ? { loadError } : await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const navContainer = document.querySelector('.elementskit-menu-container.elementskit-menu-offcanvas-elements, .hfe-nav-menu__layout-vertical');
      const toggle = document.querySelector('.elementskit-menu-hamburger, .elementskit-menu-toggler, .hfe-nav-menu__toggle');
      const visibleNavLinks = navContainer ? Array.from(navContainer.querySelectorAll('a[href]')).filter((a) => {
        const r = a.getBoundingClientRect();
        const cs = getComputedStyle(a);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
      }).map((a) => ({ text: (a.textContent || a.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 100), href: a.getAttribute('href') })) : [];
      const iconControls = Array.from(document.querySelectorAll('a, button, [role="button"]')).filter((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (r.width <= 0 || r.height <= 0 || cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') return false;
        const text = `${el.getAttribute('aria-label') || ''} ${el.textContent || ''} ${el.className || ''}`.toLowerCase();
        return !!el.querySelector('svg') || /icon|menu|toggle|hamburger|social|share|whatsapp|instagram|facebook|twitter|x/i.test(text);
      }).slice(0, 40).map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          label: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
          cls: String(el.className || '').slice(0, 120),
          href: el.getAttribute('href'),
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
          pointerEvents: cs.pointerEvents,
          tabbable: el.matches('a[href], button, [role="button"]'),
        };
      });
      return {
        title: document.title,
        h1s: Array.from(document.querySelectorAll('h1')).map((h) => h.textContent?.trim()).filter(Boolean),
        textLength: body.innerText.trim().length,
        scrollWidth: html.scrollWidth,
        innerWidth: window.innerWidth,
        overflowX: html.scrollWidth > window.innerWidth + 2,
        pageErrors: window.__pageErrors || [],
        navToggleExists: !!toggle,
        navOpenClass: !!navContainer && navContainer.classList.contains('snapshot-menu-open'),
        navVisibleLinks: visibleNavLinks.slice(0, 10),
        iconControls,
      };
    });

    const navCheck = { open: null, close: null, tappableIcons: [] };
    if (!loadError) {
      const toggleLocator = page.locator('.elementskit-menu-hamburger, .elementskit-menu-toggler, .hfe-nav-menu__toggle').first();
      const navContainerLocator = page.locator('.elementskit-menu-container.elementskit-menu-offcanvas-elements, .hfe-nav-menu__layout-vertical').first();
      try {
        if (await toggleLocator.count()) {
          const before = await navContainerLocator.evaluate((node) => ({
            open: node.classList.contains('snapshot-menu-open'),
            ariaHidden: node.getAttribute('aria-hidden'),
            visibility: getComputedStyle(node).visibility,
            opacity: getComputedStyle(node).opacity,
            pointerEvents: getComputedStyle(node).pointerEvents,
            rect: (() => { const r = node.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })(),
          })).catch(() => null);
          await toggleLocator.click({ timeout: 4000 });
          await page.waitForTimeout(250);
          const afterOpen = await navContainerLocator.evaluate((node) => ({
            open: node.classList.contains('snapshot-menu-open'),
            ariaHidden: node.getAttribute('aria-hidden'),
            visibility: getComputedStyle(node).visibility,
            opacity: getComputedStyle(node).opacity,
            pointerEvents: getComputedStyle(node).pointerEvents,
            links: Array.from(node.querySelectorAll('a[href]')).filter((a) => {
              const r = a.getBoundingClientRect();
              const cs = getComputedStyle(a);
              return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
            }).slice(0, 10).map((a) => ({ text: (a.textContent || a.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 80), href: a.getAttribute('href') })),
            rect: (() => { const r = node.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })(),
          }));
          const iconControls = await getIconControls(page);
          const tappableIcons = [];
          for (const icon of iconControls) {
            const selector = [
              icon.href ? `a[href="${icon.href}"]` : null,
              icon.label ? `a[aria-label="${icon.label.replace(/"/g, '\\"')}"]` : null,
              icon.cls ? `${icon.tag}.${icon.cls.split(' ').filter(Boolean).join('.')}` : null,
              icon.tag,
            ].filter(Boolean)[0];
            if (!selector) continue;
            const locator = page.locator(selector).filter({ has: page.locator('svg') }).first();
            try {
              await locator.click({ trial: true, timeout: 2000 });
              tappableIcons.push({ label: icon.label, ok: true, rect: icon.rect });
            } catch (error) {
              tappableIcons.push({ label: icon.label, ok: false, error: String(error).slice(0, 250), rect: icon.rect });
            }
          }
          await toggleLocator.click({ timeout: 4000 });
          await page.waitForTimeout(250);
          const afterClose = await navContainerLocator.evaluate((node) => ({
            open: node.classList.contains('snapshot-menu-open'),
            ariaHidden: node.getAttribute('aria-hidden'),
            visibility: getComputedStyle(node).visibility,
            opacity: getComputedStyle(node).opacity,
            pointerEvents: getComputedStyle(node).pointerEvents,
          })).catch(() => null);
          navCheck.open = { before, afterOpen };
          navCheck.close = afterClose;
          navCheck.tappableIcons = tappableIcons;
        }
      } catch (error) {
        navCheck.error = String(error);
      }
    }

    const screenshotDir = path.join(outDir, slug(route), vp.name);
    await fs.mkdir(screenshotDir, { recursive: true, mode: 0o700 });
    await page.screenshot({ path: path.join(screenshotDir, 'closed.png'), fullPage: true });
    if (!loadError) {
      const toggleLocator = page.locator('.elementskit-menu-hamburger, .elementskit-menu-toggler, .hfe-nav-menu__toggle').first();
      if (await toggleLocator.count()) {
        try {
          const navContainerLocator = page.locator('.elementskit-menu-container.elementskit-menu-offcanvas-elements, .hfe-nav-menu__layout-vertical').first();
          const openNow = await navContainerLocator.evaluate((node) => node.classList.contains('snapshot-menu-open')).catch(() => false);
          if (!openNow) {
            await toggleLocator.click({ timeout: 4000 });
            await page.waitForTimeout(250);
          }
        } catch {}
      }
    }
    await page.screenshot({ path: path.join(screenshotDir, 'open.png'), fullPage: true });

    results.push({ route, viewport: vp.name, status, url, metrics, navCheck, consoleMessages, pageErrors, failedRequests, screenshotDir });
    await page.close();
  }
  await context.close();
}

await browser.close();
const report = { base, generatedAt: new Date().toISOString(), routes, viewports, results };
await fs.writeFile(path.join(outDir, 'qa-results.json'), JSON.stringify(report, null, 2));
console.log(`Wrote ${results.length} results to ${outDir}`);
