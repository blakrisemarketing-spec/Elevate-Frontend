import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ORIGIN = 'https://elevatecareerhub.com';
const ROOT = process.cwd();
const OUT_SRC = path.join(ROOT, 'src', 'generated');
const OUT_PUBLIC = path.join(ROOT, 'public');
const OUT_OUTPUTS = path.join(ROOT, 'outputs');
const CSS_DIR = path.join(OUT_PUBLIC, 'vendor', 'elevate-css');
const ASSET_DIR = path.join(OUT_PUBLIC, 'assets');
const SNAPSHOT_DIR = path.join(OUT_PUBLIC, 'snapshots');

const START_TYPES = ['pages', 'posts', 'product'];
const INDEX_ALIASES = new Map([
  ['/index.php/contact-us/', '/contact-us/'],
  ['/index.php/about/', '/about/'],
  ['/index.php/diy-products/', '/diy-products/'],
  ['/index.php/faqs/', '/faqs/'],
  ['/index.php/services/', '/career-services/'],
  ['/index.php/services/#career-services', '/career-services/'],
  ['/services/', '/career-services/'],
  ['/services/#career-services', '/career-services/'],
  ['/index.php/#educational-services', '/educational-services/'],
]);

await Promise.all([
  fs.mkdir(OUT_SRC, { recursive: true }),
  fs.mkdir(CSS_DIR, { recursive: true }),
  fs.mkdir(ASSET_DIR, { recursive: true }),
  fs.mkdir(SNAPSHOT_DIR, { recursive: true }),
  fs.mkdir(OUT_OUTPUTS, { recursive: true }),
]);

const fetched = new Map();
async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function getText(url) {
  if (fetched.has(url)) return fetched.get(url);
  const res = await fetchWithTimeout(url, { redirect: 'follow', headers: { 'user-agent': 'OpenClaw Elevate migration crawler' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  const text = await res.text();
  fetched.set(url, text);
  return text;
}

async function getJson(url) {
  return JSON.parse(await getText(url));
}

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

function stripTags(value = '') {
  return decodeEntities(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function normalizePath(input) {
  if (!input) return '/';
  let raw = input;
  try {
    const url = new URL(input, ORIGIN);
    if (url.origin !== ORIGIN) return input;
    raw = url.pathname + (url.hash || '');
  } catch {}
  raw = raw.replace(/\/index\.php(?=\/|$)/, '');
  if (raw === '') raw = '/';
  if (!raw.includes('.') && !raw.endsWith('/') && !raw.includes('#')) raw += '/';
  if (INDEX_ALIASES.has(input)) return INDEX_ALIASES.get(input);
  if (INDEX_ALIASES.has(raw)) return INDEX_ALIASES.get(raw);
  return raw;
}

function pageSlugFromPath(route) {
  if (route === '/') return 'home';
  return route.replace(/^\//, '').replace(/\/$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
}

function extract(html, regex, fallback = '') {
  const match = html.match(regex);
  return match ? decodeEntities(match[1].trim()) : fallback;
}

function extractBody(html) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return body ? body[1] : html;
}

function stripUnsafeScripts(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '');
}

function findUrls(text, regex) {
  const out = [];
  let match;
  while ((match = regex.exec(text))) out.push(match[1] || match[2] || match[0]);
  return out;
}

function cssFileName(url) {
  const u = new URL(url);
  const base = path.basename(u.pathname).replace(/[^a-z0-9_.-]/gi, '-');
  const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 8);
  return `${base.replace(/\.css$/i, '')}-${hash}.css`;
}

function assetPathFromUrl(url) {
  const u = new URL(url, ORIGIN);
  let pathname = decodeURIComponent(u.pathname);
  if (!pathname.startsWith('/wp-content/uploads/')) return null;
  return pathname.replace(/^\//, '');
}

async function downloadAsset(url, issues) {
  try {
    const assetPath = assetPathFromUrl(url);
    if (!assetPath) return null;
    const dest = path.join(ASSET_DIR, assetPath);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    try { await fs.access(dest); return `/assets/${assetPath}`; } catch {}
    const res = await fetchWithTimeout(url, { redirect: 'follow' }, 15000);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(dest, buf);
    return `/assets/${assetPath}`;
  } catch (error) {
    issues.push({ type: 'asset-download-failed', url, error: String(error.message || error) });
    return url;
  }
}

async function rewriteAssets(html, assetInventory, issues) {
  const urls = new Set();
  const patterns = [
    /https?:\/\/elevatecareerhub\.com(\/wp-content\/uploads\/[^"'\s),]+)|http:\/\/elevatecareerhub\.com(\/wp-content\/uploads\/[^"'\s),]+)/gi,
    /\/wp-content\/uploads\/[^"'\s),]+/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html))) {
      const p = match[1] || match[2] || match[0];
      const url = p.startsWith('http') ? p.replace('http://', 'https://') : `${ORIGIN}${p}`;
      urls.add(url.replace(/&amp;/g, '&'));
    }
  }
  const replacements = new Map();
  for (const url of urls) {
    const local = await downloadAsset(url, issues);
    if (!local) continue;
    replacements.set(url, local);
    replacements.set(url.replace('https://', 'http://'), local);
    replacements.set(new URL(url).pathname, local);
    if (local.startsWith('/assets/')) assetInventory.set(url, { source: url, local });
  }
  let out = html;
  for (const [from, to] of replacements) {
    out = out.split(from).join(to).split(from.replace(/&/g, '&amp;')).join(to);
  }
  return out;
}

function rewriteLinks(html) {
  return html.replace(/(href|action)=(['"])(.*?)\2/gi, (all, attr, quote, href) => {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('https://wa.me/') || href.startsWith('http://wa.me/')) return all;
    try {
      const u = new URL(href, ORIGIN);
      if (u.origin === ORIGIN) return `${attr}=${quote}${normalizePath(u.href)}${quote}`;
    } catch {}
    return all;
  });
}

function extractLinks(html, pageRoute) {
  const links = [];
  const re = /<a\b[^>]*href=(['"])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(html))) {
    const href = decodeEntities(match[2]);
    const text = stripTags(match[3]);
    let kind = 'external';
    let mapped = href;
    try {
      const u = new URL(href, ORIGIN);
      if (u.origin === ORIGIN) {
        kind = 'internal';
        mapped = normalizePath(u.href);
      } else if (href.startsWith('#')) {
        kind = 'anchor';
      }
    } catch {}
    if (href.startsWith('#')) kind = 'anchor';
    if (href.startsWith('mailto:')) kind = 'email';
    if (href.includes('wa.me')) kind = 'whatsapp';
    links.push({ pageRoute, text, original: href, mapped, kind });
  }
  return links;
}

async function fetchRestItems() {
  const items = [];
  for (const type of START_TYPES) {
    try {
      const arr = await getJson(`${ORIGIN}/wp-json/wp/v2/${type}?per_page=100&_embed=1`);
      for (const item of arr) items.push({ type, item });
    } catch (error) {
      console.warn(`Could not fetch REST type ${type}:`, error.message);
    }
  }
  return items;
}

async function downloadCss(cssLinks, issues) {
  const localLinks = [];
  for (const link of cssLinks) {
    try {
      const filename = cssFileName(link.href);
      const dest = path.join(CSS_DIR, filename);
      let css = await getText(link.href);
      const cssBase = new URL(link.href);
      css = css.replace(/url\((['"]?)(?!data:|#)([^)'"\s]+)\1\)/gi, (all, q, raw) => {
        try {
          const absolute = new URL(raw.replace(/&amp;/g, '&'), cssBase).href;
          return `url(${absolute})`;
        } catch { return all; }
      });
      await fs.writeFile(dest, css);
      localLinks.push({ ...link, localHref: `/vendor/elevate-css/${filename}` });
    } catch (error) {
      issues.push({ type: 'css-download-failed', url: link.href, error: String(error.message || error) });
      localLinks.push(link);
    }
  }
  return localLinks;
}

const restItems = await fetchRestItems();
const allPages = [];
const cssLinksByHref = new Map();
const linkInventory = [];
const assetInventory = new Map();
const issues = [];

for (const { type, item } of restItems) {
  const originalUrl = item.link;
  console.log(`Fetching ${type} ${originalUrl}`);
  const route = normalizePath(originalUrl);
  const slug = pageSlugFromPath(route);
  let html;
  try {
    html = await getText(originalUrl);
  } catch (error) {
    issues.push({ type: 'page-fetch-failed', url: originalUrl, error: String(error.message || error) });
    continue;
  }

  const cssRe = /<link\b[^>]*rel=(['"])stylesheet\1[^>]*href=(['"])(.*?)\2[^>]*>/gi;
  let cm;
  while ((cm = cssRe.exec(html))) {
    const tag = cm[0];
    const href = decodeEntities(cm[3]).replace(/^http:\/\//, 'https://');
    if (!href.startsWith(ORIGIN) && !href.includes('fonts.googleapis.com')) continue;
    if (!cssLinksByHref.has(href)) cssLinksByHref.set(href, { href, tag, media: extract(tag, /media=(['"])(.*?)\1/i, 'all') });
  }

  let body = stripUnsafeScripts(extractBody(html));
  body = rewriteLinks(body);
  body = await rewriteAssets(body, assetInventory, issues);

  const title = extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i, stripTags(item.title?.rendered || 'Elevate Career Hub'));
  const description = extract(html, /<meta\s+name=(['"])description\1\s+content=(['"])(.*?)\2/i, '') || extract(html, /<meta\s+content=(['"])(.*?)\1\s+name=(['"])description\3/i, '');
  const canonical = extract(html, /<link\s+rel=(['"])canonical\1\s+href=(['"])(.*?)\2/i, originalUrl);
  const ogImage = extract(html, /<meta\s+property=(['"])og:image\1\s+content=(['"])(.*?)\2/i, '');

  linkInventory.push(...extractLinks(body, route));

  await fs.writeFile(path.join(SNAPSHOT_DIR, `${slug}.html`), body);

  allPages.push({
    id: item.id,
    type,
    route,
    aliases: Array.from(INDEX_ALIASES.entries()).filter(([, v]) => v === route).map(([k]) => k),
    originalUrl,
    slug,
    title,
    description,
    canonical,
    ogImage,
    dateModified: item.modified || item.modified_gmt || '',
    htmlPath: `/snapshots/${slug}.html`,
  });
}

allPages.sort((a, b) => a.route.localeCompare(b.route));
const localCss = await downloadCss(Array.from(cssLinksByHref.values()), issues);

const cssImport = localCss.map((l) => `@import url('${l.localHref || l.href}');`).join('\n');
await fs.writeFile(path.join(OUT_SRC, 'pages.json'), JSON.stringify(allPages, null, 2));
await fs.writeFile(path.join(OUT_SRC, 'vendor-css.css'), `${cssImport}\n`);

const routes = allPages.map((p) => ({ originalUrl: p.originalUrl, route: p.route, aliases: p.aliases, title: p.title, type: p.type, id: p.id }));
const assets = Array.from(assetInventory.values()).sort((a, b) => a.local.localeCompare(b.local));
await fs.writeFile(path.join(OUT_OUTPUTS, 'route-map.json'), JSON.stringify(routes, null, 2));
await fs.writeFile(path.join(OUT_OUTPUTS, 'link-map.json'), JSON.stringify(linkInventory, null, 2));
await fs.writeFile(path.join(OUT_OUTPUTS, 'asset-inventory.json'), JSON.stringify(assets, null, 2));
await fs.writeFile(path.join(OUT_OUTPUTS, 'migration-issues.json'), JSON.stringify(issues, null, 2));

function mdTable(rows, headers) {
  return [`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`, ...rows.map((row) => `| ${headers.map((h) => String(row[h] ?? '').replace(/\|/g, '\\|')).join(' | ')} |`)].join('\n');
}

await fs.writeFile(path.join(OUT_OUTPUTS, 'route-map.md'), `# Elevate Career Hub Route Map\n\n${mdTable(routes.map(r => ({ Type: r.type, ID: r.id, Original: r.originalUrl, Route: r.route, Aliases: r.aliases.join(', '), Title: r.title })), ['Type','ID','Original','Route','Aliases','Title'])}\n`);
await fs.writeFile(path.join(OUT_OUTPUTS, 'asset-inventory.md'), `# Elevate Career Hub Asset Inventory\n\n${mdTable(assets.map(a => ({ Source: a.source, Local: a.local })), ['Source','Local'])}\n`);
await fs.writeFile(path.join(OUT_OUTPUTS, 'link-map.md'), `# Elevate Career Hub Link Map\n\n${mdTable(linkInventory.map(l => ({ Page: l.pageRoute, Text: l.text, Kind: l.kind, Original: l.original, Mapped: l.mapped })), ['Page','Text','Kind','Original','Mapped'])}\n`);

console.log(`Crawled ${allPages.length} pages/products/posts`);
console.log(`Downloaded ${assets.length} upload assets`);
console.log(`Vendored ${localCss.length} CSS files`);
console.log(`Issues: ${issues.length}`);
