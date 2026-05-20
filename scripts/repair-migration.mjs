import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ORIGIN = 'https://elevatecareerhub.com';
const ROOT = process.cwd();
const SNAPSHOT_DIR = path.join(ROOT, 'public', 'snapshots');
const VENDOR_CSS_DIR = path.join(ROOT, 'public', 'vendor', 'elevate-css');
const VENDOR_ASSET_DIR = path.join(ROOT, 'public', 'vendor', 'elevate-assets');
const PUBLIC_DIR = path.join(ROOT, 'public');
const GENERATED_DIR = path.join(ROOT, 'src', 'generated');
const ISSUES_PATH = path.join(ROOT, 'outputs', 'migration-issues.json');

const issues = [];

function decodeEntities(value = '') {
  return value
    .replace(/&#8217;/g, '’')
    .replace(/&#8211;/g, '–')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const unavailableAssetFallbacks = new Map([
  ['/assets/wp-content/uploads/2024/01/Asset-14.png', '/assets/missing-decorative.svg'],
  ['/assets/wp-content/uploads/2024/01/shape_Asset-6.png', '/assets/missing-decorative.svg'],
  ['/assets/wp-content/uploads/2024/01/Asset-13.png', '/assets/missing-decorative.svg'],
  ['/assets/wp-content/uploads/2024/01/portrait-of-mid-adult-businesswoman-smiling-agains-5F3S7X7.jpg', '/assets/wp-content/uploads/2024/01/T6-Copy-e1706661330276-600x900.webp'],
  ['/assets/wp-content/uploads/2024/01/composite-collage-of-happy-diverse-multicultural-y2-G8UCHFH.jpg', '/assets/wp-content/uploads/2024/01/R1-Copy-600x600.webp'],
  ['/assets/wp-content/uploads/2024/01/composite-collage-of-happy-diverse-multicultural-y3-G8UCHFH.jpg', '/assets/wp-content/uploads/2024/01/R5-Copy-600x600.webp'],
  ['/assets/wp-content/uploads/2024/01/composite-collage-of-happy-diverse-multicultural-y4-G8UCHFH.jpg', '/assets/wp-content/uploads/2024/01/R9-Copy-600x600.webp'],
  ['/assets/wp-content/uploads/2024/01/composite-collage-of-happy-diverse-multicultural-y5-G8UCHFH.jpg', '/assets/wp-content/uploads/2024/01/R10-Copy-600x600.webp'],
]);

function normalizeAssetRefs(html) {
  let out = html
    // Broken crawler output sometimes concatenated the site origin two or more times.
    .replace(/(?:https?:\/\/elevatecareerhub\.com){2,}(\/wp-content\/uploads\/[^"'\s),<]+)/gi, '/assets$1')
    // Upload assets are vendored under public/assets/wp-content/uploads.
    .replace(/https?:\/\/(?:staging\.)?elevatecareerhub\.com\/wp-content\/uploads\//gi, '/assets/wp-content/uploads/')
    .replace(/(?<!assets)\/wp-content\/uploads\//gi, '/assets/wp-content/uploads/')
    // Guard against repeated repair passes and earlier substring replacements.
    .replace(/\/assets\/(?:assets\/)+wp-content\/uploads\//gi, '/assets/wp-content/uploads/')
    .replace(/\/assets\/(?:assets\/)+/gi, '/assets/')
    // WordPress lazy loading is JS/scroll dependent; eager local images make QA deterministic.
    .replace(/\sloading=(['"])lazy\1/gi, ' loading="eager"');
  for (const [missing, fallback] of unavailableAssetFallbacks) out = out.split(missing).join(fallback);
  return out;
}

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return fallback; }
}

async function fetchWithTimeout(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'OpenClaw Elevate migration repair' }, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function downloadUploadAsset(url) {
  try {
    const u = new URL(url, ORIGIN);
    if (!u.pathname.startsWith('/wp-content/uploads/')) return normalizeAssetRefs(url);
    const localPath = `/assets${decodeURIComponent(u.pathname)}`;
    const dest = path.join(PUBLIC_DIR, localPath.replace(/^\//, ''));
    try { await fs.access(dest); return localPath; } catch {}
    await fs.mkdir(path.dirname(dest), { recursive: true });
    const res = await fetchWithTimeout(u.href, 15000);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(dest, buf);
    return localPath;
  } catch (error) {
    issues.push({ type: 'asset-download-failed', url, error: String(error.message || error) });
    return normalizeAssetRefs(url);
  }
}

function findProductCards(diyHtml) {
  const cards = new Map();
  const productBlockRe = /<div class="product\s+post-(\d+)[\s\S]*?(?=<div class="product\s+post-|<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/section>)/g;
  let match;
  while ((match = productBlockRe.exec(diyHtml))) {
    const block = match[0];
    const link = block.match(/href="(\/product\/[^"]+)"/i)?.[1];
    if (!link) continue;
    const slug = link.replace(/^\/product\//, '').replace(/\/$/, '');
    const priceHtml = block.match(/<h3 class="eael-product-list-price">([\s\S]*?)<\/h3>/i)?.[1]?.trim() || '';
    const img = block.match(/<img\b[^>]*>/i)?.[0] || '';
    const excerpt = block.match(/<div class="eael-product-list-excerpt">([\s\S]*?)<\/div>/i)?.[1]?.trim() || '';
    cards.set(slug, { priceHtml, img, excerpt });
  }
  return cards;
}

async function buildProductSnapshots() {
  const pages = await readJson(path.join(GENERATED_DIR, 'pages.json'), []);
  const productPages = pages.filter((p) => p.type === 'product');
  if (!productPages.length) return;

  const diyPath = path.join(SNAPSHOT_DIR, 'diy-products.html');
  const diyHtml = normalizeAssetRefs(await fs.readFile(diyPath, 'utf8'));
  const headerEnd = diyHtml.indexOf('</header>');
  const footerStart = diyHtml.indexOf('<footer');
  const header = headerEnd >= 0 ? diyHtml.slice(0, headerEnd + '</header>'.length) : '<div id="page" class="hfeed site">';
  const footer = footerStart >= 0 ? diyHtml.slice(footerStart) : '</div><!-- #page -->';
  const cardData = findProductCards(diyHtml);

  let storeProducts = [];
  try {
    const res = await fetchWithTimeout(`${ORIGIN}/wp-json/wc/store/v1/products?per_page=100`, 20000);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    storeProducts = await res.json();
  } catch (error) {
    issues.push({ type: 'store-product-fetch-failed', url: `${ORIGIN}/wp-json/wc/store/v1/products?per_page=100`, error: String(error.message || error) });
  }
  const productsBySlug = new Map(storeProducts.map((p) => [p.slug, p]));

  for (const page of productPages) {
    const slug = page.route.replace(/^\/product\//, '').replace(/\/$/, '');
    const product = productsBySlug.get(slug) || {};
    const card = cardData.get(slug) || {};
    const title = decodeEntities(product.name || page.title || slug.replace(/-/g, ' '));
    const description = normalizeAssetRefs(product.description || product.short_description || card.excerpt || `<p>${escapeHtml(title)}</p>`);
    const shortDescription = normalizeAssetRefs(product.short_description || card.excerpt || '');
    const priceHtml = normalizeAssetRefs(product.price_html || card.priceHtml || '');
    const image = product.images?.[0];
    let imageHtml = card.img || '';
    if (image?.src) {
      const localSrc = await downloadUploadAsset(image.src);
      const alt = escapeHtml(image.alt || title);
      imageHtml = `<img decoding="async" width="600" height="600" src="${localSrc}" class="attachment-woocommerce_single size-woocommerce_single wp-post-image" alt="${alt}" loading="eager" />`;
    }
    imageHtml = normalizeAssetRefs(imageHtml);
    const sku = escapeHtml(product.sku || '');
    const categories = Array.isArray(product.categories) ? product.categories.map((c) => escapeHtml(c.name)).join(', ') : '';

    const productBody = `
      <div data-elementor-type="single-product" class="elementor elementor-product elevate-product-snapshot">
        <section class="elementor-section elementor-top-section elementor-section-boxed elevate-product-hero" data-element_type="section" data-e-type="section">
          <div class="elementor-container elementor-column-gap-default elevate-product-container">
            <div class="woocommerce product elevate-product-layout">
              <nav class="woocommerce-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> &nbsp;/&nbsp; <a href="/diy-products/">DIY Products</a> &nbsp;/&nbsp; ${escapeHtml(title)}</nav>
              <div class="product type-product status-publish purchasable product-type-simple elevate-product-detail">
                <div class="woocommerce-product-gallery woocommerce-product-gallery--with-images elevate-product-gallery">
                  ${imageHtml}
                </div>
                <div class="summary entry-summary elevate-product-summary">
                  <h1 class="product_title entry-title">${escapeHtml(title)}</h1>
                  ${priceHtml ? `<p class="price">${priceHtml}</p>` : ''}
                  ${shortDescription ? `<div class="woocommerce-product-details__short-description">${shortDescription}</div>` : ''}
                  <form class="cart" action="/diy-products/" method="post" enctype="multipart/form-data">
                    <button type="submit" name="add-to-cart" value="${escapeHtml(String(product.id || page.id))}" class="single_add_to_cart_button button alt">Enroll now</button>
                  </form>
                  <div class="product_meta">
                    ${sku ? `<span class="sku_wrapper">SKU: <span class="sku">${sku}</span></span>` : ''}
                    ${categories ? `<span class="posted_in">Category: ${categories}</span>` : ''}
                  </div>
                </div>
              </div>
              <div class="woocommerce-tabs wc-tabs-wrapper elevate-product-description">
                <h2>Description</h2>
                ${description}
              </div>
            </div>
          </div>
        </section>
      </div>`;

    const snapshot = normalizeAssetRefs(`${header}\n${productBody}\n${footer}`);
    await fs.writeFile(path.join(SNAPSHOT_DIR, `${page.slug}.html`), snapshot);
  }
}

async function repairSnapshotAssetRefs() {
  const entries = await fs.readdir(SNAPSHOT_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const file = path.join(SNAPSHOT_DIR, entry.name);
    const current = await fs.readFile(file, 'utf8');
    const repaired = normalizeAssetRefs(current);
    if (repaired !== current) await fs.writeFile(file, repaired);
  }
}

async function vendorCssUrlAssets() {
  await fs.mkdir(VENDOR_ASSET_DIR, { recursive: true });
  const entries = await fs.readdir(VENDOR_CSS_DIR, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.css')) continue;
    const file = path.join(VENDOR_CSS_DIR, entry.name);
    let css = await fs.readFile(file, 'utf8');

    // The old staging-hosted local Google font URLs are not resolvable. Remove only those
    // @font-face blocks so text falls back cleanly instead of logging network failures.
    css = css.replace(/@font-face\s*{[^{}]*staging\.elevatecareerhub\.com[^{}]*}/gi, '');

    const urls = Array.from(new Set(Array.from(css.matchAll(/url\((['"]?)(https?:\/\/[^)'"\s]+)\1\)/gi)).map((m) => m[2].replace(/&amp;/g, '&'))));
    for (const url of urls) {
      let replacement = null;
      try {
        const source = new URL(url);
        if (!/(^|\.)elevatecareerhub\.com$/i.test(source.hostname)) continue;
        if (source.hostname === 'staging.elevatecareerhub.com') continue;
        const basename = path.basename(source.pathname).replace(/[^a-z0-9_.-]/gi, '-') || 'asset.bin';
        const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 10);
        const filename = `${hash}-${basename}`;
        const dest = path.join(VENDOR_ASSET_DIR, filename);
        const localUrl = `/vendor/elevate-assets/${filename}`;
        try { await fs.access(dest); replacement = localUrl; } catch {
          const res = await fetchWithTimeout(url, 15000);
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
          replacement = localUrl;
        }
      } catch (error) {
        issues.push({ type: 'vendor-css-asset-failed', url, file: path.relative(ROOT, file), error: String(error.message || error) });
      }
      if (replacement) {
        const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        css = css.replace(new RegExp(escaped.replace(/&/g, '(?:&|&amp;)'), 'g'), replacement);
      }
    }
    await fs.writeFile(file, css);
  }
}

async function updateIssues() {
  if (!issues.length) return;
  const existing = await readJson(ISSUES_PATH, []);
  const merged = [...existing, ...issues];
  await fs.writeFile(ISSUES_PATH, JSON.stringify(merged, null, 2));
}

await repairSnapshotAssetRefs();
await buildProductSnapshots();
await repairSnapshotAssetRefs();
await vendorCssUrlAssets();
await updateIssues();
console.log(`Repair complete. Issues added: ${issues.length}`);
