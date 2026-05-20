import { chromium } from '/opt/homebrew/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
const outDir = '/Users/greatdamzi/Projects/Elevate-Frontend/outputs/design-system-qa';
const order = ['home','about','career-services','educational-services','blog','contact-us','diy-products','product-remote-job-playbook'];
const browser = await chromium.launch({headless:true});
for (const vp of ['mobile390','desktop1440','tablet768']) {
  const page = await browser.newPage({viewport:{width:1600,height:1200}});
  const figures = [];
  for (const name of order) {
    const file = path.join(outDir, `${name}-${vp}.png`);
    const b64 = await fs.readFile(file, 'base64');
    figures.push(`<figure><figcaption>${name}</figcaption><img src="data:image/png;base64,${b64}"></figure>`);
  }
  await page.setContent(`<!doctype html><style>
    body{margin:0;background:#f6f4ed;font-family:Arial,sans-serif;color:#002E47;padding:20px} h1{font-size:24px;margin:0 0 16px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;align-items:start}figure{margin:0;background:white;border:1px solid #c0c7d1;border-radius:12px;overflow:hidden;box-shadow:0 10px 28px rgba(0,99,154,.08)}figcaption{font-weight:700;padding:8px 10px;background:#fbf9f2;border-bottom:1px solid #e4e2dc}img{width:100%;height:auto;display:block;}</style><h1>${vp} contact sheet</h1><div class="grid">${figures.join('\n')}</div>`);
  await page.screenshot({path:path.join(outDir, `contact-sheet-${vp}.jpg`), fullPage:true, quality:88});
  await page.close();
}
await browser.close();
