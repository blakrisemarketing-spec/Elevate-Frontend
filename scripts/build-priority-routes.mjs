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
  {
    route: '/privacy-policy/',
    outDir: 'privacy-policy',
    entry: 'src/priority/pages/PrivacyPolicy.tsx',
    component: 'PrivacyPolicyPage',
    title: 'Privacy Policy — Elevate Career Hub',
    description: 'How Elevate Career Hub collects, uses, and protects your personal information.',
    canonical: 'https://elevatecareerhub.com/privacy-policy/',
    ogImage: OG_IMAGE,
  },
  {
    route: '/terms/',
    outDir: 'terms',
    entry: 'src/priority/pages/Terms.tsx',
    component: 'TermsPage',
    title: 'Terms & Services — Elevate Career Hub',
    description: 'The terms that govern your use of the Elevate Career Hub website, services, and digital products.',
    canonical: 'https://elevatecareerhub.com/terms/',
    ogImage: OG_IMAGE,
  },
  {
    route: '/refund-policy/',
    outDir: 'refund-policy',
    entry: 'src/priority/pages/RefundPolicy.tsx',
    component: 'RefundPolicyPage',
    title: 'Refund & Delivery Policy — Elevate Career Hub',
    description: 'How Elevate Career Hub delivers its services and digital products, and when refunds apply.',
    canonical: 'https://elevatecareerhub.com/refund-policy/',
    ogImage: OG_IMAGE,
  },
  {
    route: '/faqs/',
    outDir: 'faqs',
    entry: 'src/priority/pages/Faqs.tsx',
    component: 'FaqsPage',
    title: 'Frequently Asked Questions — Elevate Career Hub',
    description: 'Answers to common questions about Elevate Career Hub services, payments, and process.',
    canonical: 'https://elevatecareerhub.com/faqs/',
    ogImage: OG_IMAGE,
  },
  {
    route: '/blog/',
    outDir: 'blog',
    entry: 'src/priority/pages/BlogIndex.tsx',
    component: 'BlogIndexPage',
    title: 'Blog — Career & Education Insights | Elevate Career Hub',
    description: 'Practical advice on CVs, applications, interviews, and standing out — from the Elevate Career Hub team.',
    canonical: 'https://elevatecareerhub.com/blog/',
    ogImage: OG_IMAGE,
  },
  {
    route: '/job-readiness-bootcamp/',
    outDir: 'job-readiness-bootcamp',
    entry: 'src/priority/pages/JobReadinessBootcamp.tsx',
    component: 'JobReadinessBootcampPage',
    title: 'Job Readiness Bootcamp — Elevate Career Hub',
    description: 'An 8-session live bootcamp to help you stop applying blindly and start getting interviews.',
    canonical: 'https://elevatecareerhub.com/job-readiness-bootcamp/',
    ogImage: OG_IMAGE,
  },
  {
    route: '/jrb-thank-you/',
    outDir: 'jrb-thank-you',
    entry: 'src/priority/pages/JrbThankYou.tsx',
    component: 'JrbThankYouPage',
    title: 'Welcome to the Job Readiness Bootcamp — Elevate Career Hub',
    description: 'Thank you for joining the Job Readiness Bootcamp.',
    canonical: 'https://elevatecareerhub.com/jrb-thank-you/',
    ogImage: OG_IMAGE,
    noindex: true,
  },
  {
    route: '/lets-keep-in-touch/',
    outDir: 'lets-keep-in-touch',
    entry: 'src/priority/pages/LetsKeepInTouch.tsx',
    component: 'LetsKeepInTouchPage',
    title: 'Let’s Keep in Touch — Elevate Career Hub',
    description: 'Follow along and reach out for practical career and scholarship tips from Elevate Career Hub.',
    canonical: 'https://elevatecareerhub.com/lets-keep-in-touch/',
    ogImage: OG_IMAGE,
  },
  {
    // Branded 404. Written to dist/404.html (not a route dir) and wired via
    // ErrorDocument in .htaccess. Not in registry.ts/pages.json — it is an error
    // document, not a navigable route.
    route: '/404.html',
    outFile: '404.html',
    entry: 'src/priority/pages/NotFound.tsx',
    component: 'NotFoundPage',
    title: 'Page not found — Elevate Career Hub',
    description: 'The page you are looking for could not be found.',
    canonical: 'https://elevatecareerhub.com/404.html',
    ogImage: OG_IMAGE,
    noindex: true,
  },
];

/**
 * Build route entries for the data-driven detail pages (products, services)
 * from the same data/*.ts files the dev registry uses. Each entry points at the
 * shared template and carries `props` (the slug) the template renders from.
 * Keeps the SSG list in sync with src/priority/registry.ts automatically.
 */
async function generateDataRoutes() {
  const { PRODUCTS } = await loadModuleExports('src/priority/data/products.ts');
  const { SERVICES } = await loadModuleExports('src/priority/data/services.ts');
  const { BLOG_POSTS } = await loadModuleExports('src/priority/data/blog.ts');
  const toOutDir = (route) => route.replace(/^\/|\/$/g, '');
  const routes = [];

  for (const p of PRODUCTS) {
    routes.push({
      route: p.route,
      outDir: toOutDir(p.route),
      entry: 'src/priority/pages/ProductDetail.tsx',
      component: 'ProductDetailPage',
      title: p.title,
      description: p.metaDescription,
      canonical: 'https://elevatecareerhub.com' + p.route,
      ogImage: OG_IMAGE,
      hasCheckout: !p.freeDownloadPath, // paid products show a buy button
      props: { slug: p.catalogId },
    });
  }

  for (const s of SERVICES) {
    routes.push({
      route: s.route,
      outDir: toOutDir(s.route),
      entry: 'src/priority/pages/ServiceDetail.tsx',
      component: 'ServiceDetailPage',
      title: s.title,
      description: s.metaDescription,
      canonical: 'https://elevatecareerhub.com' + s.route,
      ogImage: OG_IMAGE,
      hasCheckout: Array.isArray(s.priceTierIds) && s.priceTierIds.length > 0,
      props: { slug: s.slug },
    });
  }

  for (const post of BLOG_POSTS) {
    routes.push({
      route: post.route,
      outDir: toOutDir(post.route),
      entry: 'src/priority/pages/BlogPost.tsx',
      component: 'BlogPostPage',
      title: `${post.title} — Elevate Career Hub`,
      description: post.excerpt,
      canonical: 'https://elevatecareerhub.com' + post.route,
      ogImage: OG_IMAGE,
      props: { slug: post.slug },
    });
  }

  return routes;
}

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
 * Build dist/.htaccess from deploy/htaccess.conf, injecting the set of known
 * "virtual" SPA routes so unknown URLs return a real 404 (ErrorDocument) instead
 * of a soft-200 homepage. The allowlist is generated from src/generated/pages.json
 * — the same manifest the SPA uses — so it cannot drift from the app's routes.
 *
 * Safety: throws (aborting the build) if the manifest is missing/too small or the
 * generated regex fails its self-test, rather than ever shipping an .htaccess that
 * would 404 legitimate pages.
 */
async function buildHtaccess() {
  const templatePath = path.join(projectRoot, 'deploy', 'htaccess.conf');
  const template = await fs.readFile(templatePath, 'utf8');
  if (!template.includes('__SPA_ROUTES__')) {
    throw new Error('deploy/htaccess.conf is missing the __SPA_ROUTES__ placeholder');
  }

  const pagesPath = path.join(projectRoot, 'src', 'generated', 'pages.json');
  let pages;
  try {
    pages = JSON.parse(await fs.readFile(pagesPath, 'utf8'));
  } catch (err) {
    throw new Error(`Could not read ${pagesPath} for the .htaccess SPA allowlist: ${err.message}`);
  }

  // Directory-style, lowercase routes only (the SPA's virtual routes). Drop the
  // root and anything with a file extension or unexpected characters.
  const tokens = [...new Set(
    pages
      .map(p => p.route)
      .filter(r => typeof r === 'string' && /^\/[a-z0-9][a-z0-9\-/]*\/$/.test(r) && r !== '/')
      .map(r => r.replace(/^\/|\/$/g, ''))
      .filter(t => /^[a-z0-9][a-z0-9\-/]*$/.test(t)),
  )];

  if (tokens.length < 5) {
    throw new Error(`Refusing to emit .htaccess: only ${tokens.length} SPA route(s) found in pages.json (expected the full site)`);
  }

  const alternation = tokens.join('|');

  // Self-test the generated pattern before writing it.
  const re = new RegExp(`^/(${alternation})/?$`, 'i');
  for (const token of tokens) {
    if (!re.test(`/${token}/`)) {
      throw new Error(`.htaccess SPA allowlist self-test failed: /${token}/ does not match the generated pattern`);
    }
  }
  if (re.test('/this-route-should-never-exist-xyz/')) {
    throw new Error('.htaccess SPA allowlist self-test failed: a junk route matched the generated pattern');
  }

  const htaccess = template.replaceAll('__SPA_ROUTES__', alternation);
  if (htaccess.includes('__SPA_ROUTES__')) {
    throw new Error('.htaccess still contains the __SPA_ROUTES__ placeholder after substitution');
  }
  // Final-content sanity check: the generated rewrite condition must carry real
  // route tokens, never the literal placeholder (which would 404 every route).
  if (!new RegExp(`REQUEST_URI} \\^/\\(${tokens[0]}\\|`).test(htaccess)) {
    throw new Error('.htaccess SPA RewriteCond did not receive the generated route allowlist');
  }
  await fs.writeFile(path.join(distRoot, '.htaccess'), htaccess);
  console.log(`[ssg] .htaccess → dist/.htaccess (SPA allowlist: ${tokens.length} routes, real-404 fallback)`);
}

/**
 * Emit the Hostinger deploy artifacts into dist/:
 *   - api/catalog.json  (generated from the TS catalog — single source of truth)
 *   - api/verify-payment.php  (copied)
 *   - .htaccess  (generated from deploy/htaccess.conf — see buildHtaccess)
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
  await buildHtaccess();
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

  // Static routes + data-driven detail routes (products, services) generated
  // from src/priority/data/*.ts — the same source the dev registry uses.
  const dataRoutes = await generateDataRoutes();
  const ALL_ROUTES = [...PRIORITY_ROUTES, ...dataRoutes];

  // Build the checkout island + emit the Hostinger PHP/.htaccess deploy
  // artifacts once if any route uses checkout.
  if (ALL_ROUTES.some(r => r.hasCheckout)) {
    await buildCheckoutIsland();
    await emitDeployArtifacts();
  }

  const results = [];
  for (const route of ALL_ROUTES) {
    const Component = await loadComponent(route.entry, route.component);
    // route.props (e.g. { slug }) is undefined for static pages, which ignore it.
    const body = '<div id="root">' + renderToStaticMarkup(Component(route.props)) + '</div>';
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
    // Most routes write to dist/<outDir>/index.html; a route may instead set
    // `outFile` to write to a specific file (e.g. dist/404.html).
    const outFile = route.outFile
      ? path.join(distRoot, route.outFile)
      : path.join(distRoot, route.outDir, 'index.html');
    await ensureDir(path.dirname(outFile));
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
