import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.BASE_URL || 'http://127.0.0.1:4174';
const outDir = '/Users/greatdamzi/Projects/Elevate-Frontend/outputs/mobile-menu-qa-v2-lite';
await fs.mkdir(outDir, { recursive: true, mode: 0o700 });

const routes = ['/', '/about/', '/career-services/', '/educational-services/', '/diy-products/', '/contact-us/'];
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

async function collectIconControls(page) {
  return await page.evaluate(() => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
    };
    return Array.from(document.querySelectorAll('a, button, [role="button"]')).filter((el) => {
      if (!visible(el)) return false;
      const text = `${el.getAttribute('aria-label') || ''} ${el.textContent || ''} ${el.className || ''}`.toLowerCase();
      return !!el.querySelector('svg') || /icon|menu|toggle|hamburger|social|share|whatsapp|instagram|facebook|twitter|x/i.test(text);
    }).slice(0, 40).map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        label: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
        cls: String(el.className || '').slice(0, 120),
        href: el.getAttribute('href'),
        rect: { w: Math.round(r.width), h: Math.round(r.height) },
        pointerEvents: cs.pointerEvents,
        tappable: Math.round(r.width) >= 44 && Math.round(r.height) >= 44 && cs.pointerEvents !== 'none',
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
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      status = response?.status() ?? null;
      await page.waitForTimeout(800);
    } catch (error) {
      loadError = String(error);
    }

    let metrics = { loadError };
    let menu = null;
    let iconControls = [];
    if (!loadError) {
      metrics = await page.evaluate(() => {
        const html = document.documentElement;
        const body = document.body;
        const navContainer = document.querySelector('.elementskit-menu-container.elementskit-menu-offcanvas-elements, .hfe-nav-menu__layout-vertical');
        const toggle = document.querySelector('.elementskit-menu-hamburger, .elementskit-menu-toggler, .hfe-nav-menu__toggle');
        const navLinks = navContainer ? Array.from(navContainer.querySelectorAll('a[href]')).filter((a) => {
          const r = a.getBoundingClientRect();
          const cs = getComputedStyle(a);
          return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
        }).map((a) => ({ text: (a.textContent || a.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 100), href: a.getAttribute('href') })) : [];
        return {
          title: document.title,
          h1s: Array.from(document.querySelectorAll('h1')).map((h) => h.textContent?.trim()).filter(Boolean),
          textLength: body.innerText.trim().length,
          scrollWidth: html.scrollWidth,
          innerWidth: window.innerWidth,
          overflowX: html.scrollWidth > window.innerWidth + 2,
          navToggleExists: !!toggle,
          navOpen: !!navContainer && navContainer.classList.contains('snapshot-menu-open'),
          navVisibleLinks: navLinks.slice(0, 10),
        };
      });
      iconControls = await collectIconControls(page);

      const toggleLocator = page.locator('.elementskit-menu-hamburger, .elementskit-menu-toggler, .hfe-nav-menu__toggle').first();
      const navContainerLocator = page.locator('.elementskit-menu-container.elementskit-menu-offcanvas-elements, .hfe-nav-menu__layout-vertical').first();
      if (await toggleLocator.count()) {
        const before = await navContainerLocator.evaluate((node) => ({
          open: node.classList.contains('snapshot-menu-open'),
          ariaHidden: node.getAttribute('aria-hidden'),
          visibility: getComputedStyle(node).visibility,
          opacity: getComputedStyle(node).opacity,
          pointerEvents: getComputedStyle(node).pointerEvents,
        })).catch(() => null);
        await toggleLocator.click({ timeout: 3000 });
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
        })).catch(() => null);
        await toggleLocator.click({ timeout: 3000 });
        await page.waitForTimeout(250);
        const afterClose = await navContainerLocator.evaluate((node) => ({
          open: node.classList.contains('snapshot-menu-open'),
          ariaHidden: node.getAttribute('aria-hidden'),
          visibility: getComputedStyle(node).visibility,
          opacity: getComputedStyle(node).opacity,
          pointerEvents: getComputedStyle(node).pointerEvents,
        })).catch(() => null);
        menu = { before, afterOpen, afterClose };
      }
    }

    const screenshotDir = path.join(outDir, slug(route), vp.name);
    await fs.mkdir(screenshotDir, { recursive: true, mode: 0o700 });
    await page.screenshot({ path: path.join(screenshotDir, 'closed.png'), fullPage: false });

    if (!loadError) {
      const toggleLocator = page.locator('.elementskit-menu-hamburger, .elementskit-menu-toggler, .hfe-nav-menu__toggle').first();
      try {
        if (await toggleLocator.count()) {
          const navContainerLocator = page.locator('.elementskit-menu-container.elementskit-menu-offcanvas-elements, .hfe-nav-menu__layout-vertical').first();
          const isOpen = await navContainerLocator.evaluate((node) => node.classList.contains('snapshot-menu-open')).catch(() => false);
          if (!isOpen) {
            await toggleLocator.click({ timeout: 3000 });
            await page.waitForTimeout(250);
          }
        }
      } catch {}
    }
    await page.screenshot({ path: path.join(screenshotDir, 'open.png'), fullPage: false });

    results.push({ route, viewport: vp.name, status, url, metrics, menu, iconControls, consoleMessages, pageErrors, failedRequests, screenshotDir });
    await page.close();
  }
  await context.close();
}

await browser.close();
await fs.writeFile(path.join(outDir, 'qa-results.json'), JSON.stringify({ base, generatedAt: new Date().toISOString(), routes, viewports, results }, null, 2));
console.log(`Wrote ${results.length} results to ${outDir}`);
