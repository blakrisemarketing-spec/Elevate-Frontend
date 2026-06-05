/**
 * Renders priority pages to static HTML with inlined Tailwind CSS.
 *
 * For each entry in PRIORITY_ROUTES:
 *   1. esbuild bundles the React component to an in-memory CJS module
 *   2. react-dom/server.renderToStaticMarkup produces the body markup
 *   3. Wraps in a minimal HTML shell with the route's <head> metadata
 *   4. Inlines the Tailwind CSS in <style> for zero-roundtrip first paint
 *   5. Writes to dist/<route>/index.html
 *
 * Tailwind CSS is generated once per build via the CLI before this script runs
 * (see package.json build script).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as esbuild } from 'esbuild';
import { renderToStaticMarkup } from 'react-dom/server';

// fileURLToPath (not URL.pathname) so paths containing spaces or other
// URL-encoded characters — e.g. ".../01. GitHub/..." — resolve correctly.
const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const distRoot = path.join(projectRoot, 'dist');
const cssPath = path.join(projectRoot, '.tmp', 'priority.css');

const OG_IMAGE = 'https://elevatecareerhub.com/assets/wp-content/uploads/2024/01/2.png';

const PRIORITY_ROUTES = [
  {
    route: '/',
    outDir: '',
    entry: 'src/priority/pages/Home.tsx',
    component: 'HomePage',
    title: 'Elevate Career Hub — Career & Education Support in Ghana',
    description: 'Elevate Career Hub helps students, graduates, and professionals strengthen applications, CVs, interviews, and education plans with practical expert support.',
    canonical: 'https://elevatecareerhub.com/',
    ogImage: OG_IMAGE,
  },
  {
    route: '/about/',
    outDir: 'about',
    entry: 'src/priority/pages/About.tsx',
    component: 'AboutPage',
    title: 'About Elevate Career Hub',
    description: 'Learn how Elevate Career Hub supports career growth and education goals through practical guidance, trusted resources, and personalized services.',
    canonical: 'https://elevatecareerhub.com/about/',
    ogImage: OG_IMAGE,
  },
  {
    route: '/career-services/',
    outDir: 'career-services',
    entry: 'src/priority/pages/CareerServices.tsx',
    component: 'CareerServicesPage',
    title: 'Career Services — CVs, Cover Letters, LinkedIn & Interview Prep',
    description: 'Get expert support with CV writing, cover letters, LinkedIn optimization, interview preparation, and career bundles tailored to your goals.',
    canonical: 'https://elevatecareerhub.com/career-services/',
    ogImage: OG_IMAGE,
    hasCheckout: true,
  },
  {
    route: '/educational-services/',
    outDir: 'educational-services',
    entry: 'src/priority/pages/EducationalServices.tsx',
    component: 'EducationalServicesPage',
    title: 'Educational Services — Graduate School & Scholarship Support',
    description: 'Prepare stronger graduate school and scholarship applications with support for CVs, essays, school selection, references, and interviews.',
    canonical: 'https://elevatecareerhub.com/educational-services/',
    ogImage: OG_IMAGE,
    hasCheckout: true,
  },
  {
    route: '/diy-products/',
    outDir: 'diy-products',
    entry: 'src/priority/pages/DIYProducts.tsx',
    component: 'DIYProductsPage',
    title: 'DIY Career & Education Products — Elevate Career Hub',
    description: 'Explore Elevate Career Hub DIY resources for career and education planning, then message us on WhatsApp for purchase support or guidance.',
    canonical: 'https://elevatecareerhub.com/diy-products/',
    ogImage: OG_IMAGE,
    hasCheckout: true,
  },
  {
    route: '/contact-us/',
    outDir: 'contact-us',
    entry: 'src/priority/pages/ContactUs.tsx',
    component: 'ContactUsPage',
    title: 'Contact Elevate Career Hub',
    description: 'Message Elevate Career Hub on WhatsApp or email us for help with CVs, applications, interviews, scholarships, and education planning.',
    canonical: 'https://elevatecareerhub.com/contact-us/',
    ogImage: OG_IMAGE,
  },
  {
    route: '/payment/confirmed/',
    outDir: 'payment/confirmed',
    entry: 'src/priority/pages/PaymentConfirmed.tsx',
    component: 'PaymentConfirmedPage',
    title: 'Payment Confirmed — Elevate Career Hub',
    description: 'Your Elevate Career Hub payment was successful.',
    canonical: 'https://elevatecareerhub.com/payment/confirmed/',
    ogImage: OG_IMAGE,
    noindex: true,
  },
];

/** Compile the checkout island once → dist/assets/checkout.js. */
async function buildCheckoutIsland() {
  const outFile = path.join(distRoot, 'assets', 'checkout.js');
  await ensureDir(path.join(distRoot, 'assets'));
  await esbuild({
    entryPoints: [path.join(projectRoot, 'src/checkout/checkout-client.ts')],
    bundle: true,
    minify: true,
    format: 'iife',
    target: 'es2019',
    outfile: outFile,
    loader: { '.ts': 'ts' },
    define: {
      'import.meta.env.VITE_PAYSTACK_PUBLIC_KEY': JSON.stringify(process.env.VITE_PAYSTACK_PUBLIC_KEY || ''),
    },
    logLevel: 'silent',
  });
  const size = (await fs.stat(outFile)).size;
  console.log(`[ssg] checkout island → dist/assets/checkout.js (${(size / 1024).toFixed(1)} KB)`);
}

async function bundleEntry(entry) {
  const result = await esbuild({
    entryPoints: [path.join(projectRoot, entry)],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    target: 'node20',
    jsx: 'automatic',
    jsxImportSource: 'react',
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
    external: ['react', 'react-dom', 'react-dom/server'],
    logLevel: 'silent',
  });
  return result.outputFiles[0].text;
}

async function loadModuleExports(entry) {
  const code = await bundleEntry(entry);
  const module = { exports: {} };
  const wrappedRequire = (id) => require(id);
  const fn = new Function('module', 'exports', 'require', code);
  fn(module, module.exports, wrappedRequire);
  return module.exports;
}

/**
 * Emit the Hostinger deploy artifacts into dist/:
 *   - api/catalog.json  (generated from the TS catalog — single source of truth)
 *   - api/verify-payment.php  (copied)
 *   - .htaccess  (copied from deploy/htaccess.conf)
 */
async function emitDeployArtifacts() {
  const { CATALOG } = await loadModuleExports('src/checkout/catalog.ts');
  const slim = {};
  for (const [id, item] of Object.entries(CATALOG)) {
    slim[id] = {
      name: item.name,
      amountPesewas: item.amountPesewas,
      type: item.type,
      deliverablePath: item.deliverablePath || null,
    };
  }
  await ensureDir(path.join(distRoot, 'api'));
  await fs.writeFile(path.join(distRoot, 'api', 'catalog.json'), JSON.stringify(slim, null, 2));
  await fs.copyFile(path.join(projectRoot, 'api', 'verify-payment.php'), path.join(distRoot, 'api', 'verify-payment.php'));
  await fs.copyFile(path.join(projectRoot, 'api', 'email.php'), path.join(distRoot, 'api', 'email.php'));
  await fs.copyFile(path.join(projectRoot, 'deploy', 'htaccess.conf'), path.join(distRoot, '.htaccess'));
  console.log(`[ssg] deploy artifacts → dist/api/{catalog.json,verify-payment.php,email.php}, dist/.htaccess`);
}

async function loadComponent(entry, componentName) {
  const code = await bundleEntry(entry);
  const module = { exports: {} };
  const wrappedRequire = (id) => {
    if (id === 'react') return require('react');
    if (id === 'react-dom') return require('react-dom');
    if (id === 'react-dom/server') return require('react-dom/server');
    return require(id);
  };
  const fn = new Function('module', 'exports', 'require', code);
  fn(module, module.exports, wrappedRequire);
  if (!module.exports[componentName]) {
    throw new Error(`Component ${componentName} not exported from ${entry}`);
  }
  return module.exports[componentName];
}

function renderHtmlShell({ title, description, canonical, ogImage, css, body, hasCheckout, noindex }) {
  const robots = noindex ? 'noindex,nofollow' : 'index,follow';
  const checkoutScript = hasCheckout ? '\n    <script type="module" src="/assets/checkout.js"></script>' : '';
  return `<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta name="robots" content="${robots}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:image" content="${escapeHtml(ogImage)}">
    <meta property="og:site_name" content="Elevate Career Hub">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(ogImage)}">
    <meta name="theme-color" content="#0077B6">
    <link rel="preload" href="/fonts/Montserrat-ExtraBold.woff2" as="font" type="font/woff2" crossorigin>
    <style>${css}</style>${checkoutScript}
  </head>
  <body>${body}</body>
</html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true, mode: 0o755 });
}

/** Load .env then .env.local into process.env (without overwriting real env). */
async function loadDotEnv() {
  for (const file of ['.env', '.env.local']) {
    let text;
    try { text = await fs.readFile(path.join(projectRoot, file), 'utf8'); } catch { continue; }
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim().replace(/^["']|["']$/g, '');
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

async function main() {
  const { createRequire } = await import('node:module');
  globalThis.require = createRequire(import.meta.url);
  await loadDotEnv();

  let css = '';
  try {
    css = await fs.readFile(cssPath, 'utf8');
  } catch {
    throw new Error(`Tailwind CSS not found at ${cssPath} — run "tailwindcss -i src/priority/styles.css -o .tmp/priority.css --minify" first`);
  }

  // Build the checkout island + emit the Hostinger PHP/.htaccess deploy
  // artifacts once if any route uses checkout.
  if (PRIORITY_ROUTES.some(r => r.hasCheckout)) {
    await buildCheckoutIsland();
    await emitDeployArtifacts();
  }

  const results = [];
  for (const route of PRIORITY_ROUTES) {
    const Component = await loadComponent(route.entry, route.component);
    const body = '<div id="root">' + renderToStaticMarkup(Component()) + '</div>';
    const html = renderHtmlShell({
      title: route.title,
      description: route.description,
      canonical: route.canonical,
      ogImage: route.ogImage,
      css,
      body,
      hasCheckout: route.hasCheckout,
      noindex: route.noindex,
    });
    const outDir = path.join(distRoot, route.outDir);
    await ensureDir(outDir);
    const outFile = path.join(outDir, 'index.html');
    await fs.writeFile(outFile, html);
    const size = Buffer.byteLength(html);
    results.push({ route: route.route, file: path.relative(projectRoot, outFile), bytes: size, kb: +(size / 1024).toFixed(1) });
    console.log(`[ssg] ${route.route} → ${path.relative(projectRoot, outFile)} (${(size / 1024).toFixed(1)} KB)`);
  }
  console.log(`[ssg] rendered ${results.length} priority route(s)`);
}

main().catch(err => {
  console.error('[ssg] failed:', err);
  process.exit(1);
});
