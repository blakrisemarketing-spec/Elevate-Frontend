import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath (not URL.pathname) so paths containing spaces or other
// URL-encoded characters — e.g. ".../01. GitHub/..." — resolve correctly.
const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourceRoot = path.join(projectRoot, 'Wordpress Files');
const distRoot = path.join(projectRoot, 'dist');
const CONTACT_EMAIL = 'hello@elevatecareerhub.com';
const WHATSAPP_BASE = 'https://wa.me/233531113454';
const ENTRY_LIMIT_TEXT = ['Maximum number of entries', 'exceeded.'].join(' ');
const QUOTA_CLASS = ['ff_form', 'not_render'].join('_');
const SAFE_CONTACT_DESCRIPTION = 'Message Elevate Career Hub on WhatsApp or email us for help with CVs, applications, interviews, scholarships, and education planning.';
const BLOCKED_COMMERCE_ROUTES = new Set(['/cart/', '/checkout/', '/my-account/', '/shop/', '/manage-profile/']);
const ASSISTED_COMMERCE_ROUTE = '/contact-us/';
const pagesManifestPath = path.join(projectRoot, 'src', 'generated', 'pages.json');
const COMMERCE_SCRIPT_NAMES = new Set([
  'woocommerce.min.js',
  'add-to-cart-variation.min.js',
  'single-product.min.js',
  'order-attribution.min.js',
  'wpo-minify-footer-googlesitekit-events-provider-woocommerce.min.js',
  'wpo-minify-footer-eael-257.min.js',
  'general.min.js',
]);

const routes = [
  { route: '/', file: 'Home.html', assets: 'Home_files', label: 'Home', slug: 'home' },
  { route: '/about/', file: 'About.html', assets: 'About_files', label: 'About', slug: 'about' },
  { route: '/career-services/', file: 'Career-services.html', assets: 'Career-services_files', label: 'Career Services', slug: 'career-services' },
  { route: '/educational-services/', file: 'Education-services.html', assets: 'Education-services_files', label: 'Educational Services', slug: 'educational-services' },
  { route: '/diy-products/', file: 'DIY-Products.html', assets: 'DIY-Products_files', label: 'DIY Products', slug: 'diy-products' },
  { route: '/contact-us/', file: 'Contact.html', assets: 'Contact_files', label: 'Contact Us', slug: 'contact-us' },
];

const priorityRoutes = new Set(routes.map(route => route.route));

const launchSeoByRoute = new Map([
  ['/', {
    title: 'Elevate Career Hub — Career & Education Support in Ghana',
    h1: 'Complete Hub for Career and Education Success',
    description: 'Elevate Career Hub helps students, graduates, and professionals strengthen applications, CVs, interviews, and education plans with practical expert support.',
  }],
  ['/about/', {
    title: 'About Elevate Career Hub',
    h1: 'Helping Ambitious People Move Forward With Confidence',
    description: 'Learn how Elevate Career Hub supports career growth and education goals through practical guidance, trusted resources, and personalized services.',
  }],
  ['/career-services/', {
    title: 'Career Services — CVs, Cover Letters, LinkedIn & Interview Prep',
    h1: 'Career Services That Help You Stand Out',
    description: 'Get expert support with CV writing, cover letters, LinkedIn optimization, interview preparation, and career bundles tailored to your goals.',
  }],
  ['/educational-services/', {
    title: 'Educational Services — Graduate School & Scholarship Support',
    h1: 'Education Support for Stronger Applications',
    description: 'Prepare stronger graduate school and scholarship applications with support for CVs, essays, school selection, references, and interviews.',
  }],
  ['/diy-products/', {
    title: 'DIY Career & Education Products — Elevate Career Hub',
    h1: 'Practical DIY Resources for Your Next Step',
    description: 'Explore Elevate Career Hub DIY resources for career and education planning, then message us for purchase support or guidance.',
  }],
  ['/contact-us/', {
    title: 'Contact Elevate Career Hub',
    h1: 'Talk to Elevate Career Hub',
    description: SAFE_CONTACT_DESCRIPTION,
  }],
]);

const globalAltTextByImage = new Map([
  ['2-1024x474.png', 'Elevate Career Hub logo'],
  ['2.png', 'Elevate Career Hub logo'],
  ['T6-Copy-e1706661330276-683x1024.webp', 'Smiling professional supported by Elevate Career Hub'],
  ['T6-Copy-e1706661330276-600x900.webp', 'Smiling professional supported by Elevate Career Hub'],
  ['Frame-blue-683x1024.webp', 'Elevate Career Hub career and education support graphic'],
  ['Frame-second-614x1024.webp', 'Confident Elevate Career Hub client portrait'],
  ['Frame-second-600x1000.webp', 'Confident Elevate Career Hub client portrait'],
  ['Harvard.png', 'Harvard University logo'],
  ['EY.png', 'EY logo'],
  ['KPMG.png', 'KPMG logo'],
  ['CU.png', 'Concordia University logo'],
  ['SFU.png', 'Simon Fraser University logo'],
  ['MU.png', 'McGill University logo'],
  ['pwc.png', 'PwC logo'],
  ['ubc.png', 'University of British Columbia logo'],
  ['R9-Copy-1024x1024.webp', 'Elevate Career Hub client success portrait'],
  ['R9-Copy-600x600.webp', 'Elevate Career Hub client success portrait'],
  ['T9-1024x1024.webp', 'Elevate Career Hub client portrait'],
  ['T3-copy-scaled-e1708862469995-1024x1024.webp', 'Elevate Career Hub advisor portrait'],
  ['Rosemary-Headshots-44-scaled-e1708820376937-1024x1024.webp', 'Elevate Career Hub career-services advisor portrait'],
  ['isew-58_Original-scaled-e1708821520190-1024x1024.webp', 'Elevate Career Hub education-services advisor portrait'],
  ['Naa-7_Original-scaled-e1708822884258-1024x1024.webp', 'Elevate Career Hub advisor presenting DIY resources'],
  ['Rosemary-Headshots-50-scaled-e1708822468830-1024x1024.webp', 'Elevate Career Hub advisor ready to support client inquiries'],
  ['Naa-5_Original-683x1024.webp', 'Naa Lamle Lamptey of Elevate Career Hub'],
  ['Rosemary.webp', 'Rosemary Agyeiwah Great-Damzi of Elevate Career Hub'],
  ['Nhyira.jpg', 'Elevate Career Hub client testimonial portrait'],
  ['R1-Copy-600x600.webp', 'Elevate Career Hub client success portrait'],
  ['R5-Copy-600x600.webp', 'Elevate Career Hub client success portrait'],
  ['R10-Copy-600x600.webp', 'Elevate Career Hub client success portrait'],
  ['portrait-of-mid-adult-businesswoman-smiling-agains-5F3S7X7.jpg', 'Smiling professional representing Elevate Career Hub clients'],
]);

const routeAltTextByImage = new Map([
  ['/', new Map([
    ['icon-1.webp', 'Career services icon'],
    ['icon-2.webp', 'Educational services icon'],
    ['icon-3.webp', 'DIY products icon'],
    ['Number-1.webp', 'Step one: aspire and consult with Elevate Career Hub'],
    ['Number-2.webp', 'Step two: choose and pay for your Elevate service'],
    ['Number-3.webp', 'Step three: build momentum with Elevate support'],
  ])],
  ['/career-services/', new Map([
    ['icon-1.webp', 'CV writing service icon'],
    ['icon-6.webp', 'Cover letter service icon'],
    ['icon-3.webp', 'LinkedIn optimization service icon'],
    ['icon-4.webp', 'Interview preparation service icon'],
    ['Price-icon.webp', 'Career bundle pricing icon'],
    ['Price-icon-2.webp', 'Career bundle pricing icon'],
  ])],
  ['/educational-services/', new Map([
    ['icon-1.webp', 'Graduate school CV service icon'],
    ['icon-2.webp', 'Reference letter draft service icon'],
    ['icon-3.webp', 'LinkedIn optimization service icon'],
    ['icon-5.webp', 'School selection support icon'],
    ['icon-4.webp', 'Interview preparation service icon'],
    ['icon-6.webp', 'Statement of purpose and scholarship essay service icon'],
    ['Price-icon.webp', 'Education package pricing icon'],
    ['Price-icon-2.webp', 'Education package pricing icon'],
  ])],
]);

const decorativeImageNames = new Set([
  'Asset-14.png',
  'shape_Asset-6.png',
  'cirrc-bg-614x1024.webp',
  'missing-decorative.svg',
  'tr',
]);

const knownInternalRoutes = new Set([
  '/',
  '/about/',
  '/career-services/',
  '/educational-services/',
  '/diy-products/',
  '/contact-us/',
  '/blog/',
  '/faqs/',
  '/cover-letter/',
  '/curriculum-vitae/',
  '/interview-preparation-session/',
  '/linkedin-optimization/',
  '/reference-letter/',
  '/statement-of-purpose/',
  '/suggestion-of-schools/',
  '/product/becoming-a-job-magnet-on-linkedin/',
  '/product/complete-grad-school-bundle/',
  '/product/how-to-write-the-resume-that-lands-the-interview/',
  '/product/mastering-the-art-of-job-hunting-in-the-uk-as-an-international-student/',
  '/product/nailing-your-job-interviews/',
  '/product/remote-job-playbook/',
  '/product/the-complete-job-search-bundle/',
  '/career-strategy-session/',
  '/job-readiness-bootcamp/',
  '/jrb-thank-you/',
  '/lets-keep-in-touch/',
  '/how-our-career-development-company-can-help-you-stand-out/',
  '/how-to-boost-your-career-with-professional-resume-writing/',
  '/the-importance-of-professional-documents-in-career-development/',
  '/tips-for-crafting-an-effective-resume-cover-letter-personal-statement-and-school-application/',
]);

function outputDirForRoute(route) {
  if (route === '/') return distRoot;
  return path.join(distRoot, route.replace(/^\//, '').replace(/\/$/, ''));
}

function normalizeInternalPathname(pathname) {
  let clean = pathname.replace(/^\/index\.php(?=\/|$)/, '') || '/';
  if (!clean.endsWith('/') && !path.extname(clean)) clean += '/';
  return clean;
}

async function pathExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function walkFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(full));
    else files.push(full);
  }
  return files;
}

async function neutralizeAnalyticsScripts(targetAssets) {
  const noopScript = '/* Third-party analytics/commerce side effect disabled for local static launch MVP. */\n';
  for (const file of await walkFiles(targetAssets)) {
    const name = path.basename(file);
    if (name === 'clarity.js' || name === 'fbevents.js' || name === 's0czv2pv6k' || name === 'js' || COMMERCE_SCRIPT_NAMES.has(name)) {
      await fs.writeFile(file, noopScript);
    }
  }
}

const LOCAL_FONT_ASSETS = new Map([
  ['eicons.eot', 'e26bf3cd7f-eicons.eot'],
  ['eicons.woff2', '30614081d9-eicons.woff2'],
  ['eicons.woff', '1238d9ac2f-eicons.woff'],
  ['eicons.ttf', '4e06ba4282-eicons.ttf'],
  ['eicons.svg', '55a58fae2a-eicons.svg'],
  ['fa-solid-900.eot', '17f48baa19-fa-solid-900.eot'],
  ['fa-solid-900.woff2', '45609e55db-fa-solid-900.woff2'],
  ['fa-solid-900.woff', 'ab7026c485-fa-solid-900.woff'],
  ['fa-solid-900.ttf', '229edbe04e-fa-solid-900.ttf'],
  ['fa-solid-900.svg', '4401c986f0-fa-solid-900.svg'],
  ['fa-brands-400.eot', '4520f2c8cd-fa-brands-400.eot'],
  ['fa-brands-400.woff2', '40d22e09d5-fa-brands-400.woff2'],
  ['fa-brands-400.woff', 'f4c363edcb-fa-brands-400.woff'],
  ['fa-brands-400.ttf', 'a39bfb0867-fa-brands-400.ttf'],
  ['fa-brands-400.svg', '9244ab1a56-fa-brands-400.svg'],
  ['fa-regular-400.eot', '0098366dd6-fa-regular-400.eot'],
  ['fa-regular-400.woff2', '2449bd27a5-fa-regular-400.woff2'],
  ['fa-regular-400.woff', '1e92f026f8-fa-regular-400.woff'],
  ['fa-regular-400.ttf', '61af866168-fa-regular-400.ttf'],
  ['fa-regular-400.svg', 'cff4e5c63f-fa-regular-400.svg'],
  ['elementskit.woff', '9dd9e57dbd-elementskit.woff'],
  ['WooCommerce.woff2', '9ce027d2b5-WooCommerce.woff2'],
  ['WooCommerce.woff', '4383bbfed1-WooCommerce.woff'],
  ['WooCommerce.ttf', '17c4a88f9c-WooCommerce.ttf'],
]);

async function copyLocalFontAssets(targetAssets) {
  const fontsDir = path.join(targetAssets, 'fonts');
  await fs.rm(fontsDir, { recursive: true, force: true });
  await fs.mkdir(fontsDir, { recursive: true, mode: 0o700 });
  for (const [publicName, sourceName] of LOCAL_FONT_ASSETS.entries()) {
    const sourcePath = path.join(projectRoot, 'public', 'vendor', 'elevate-assets', sourceName);
    try {
      await fs.copyFile(sourcePath, path.join(fontsDir, publicName));
    } catch {
      // Best-effort: some fonts are not bundled locally, but the icon font set is the important launch path.
    }
  }
}

function stripLegacyDependencyReferences(html) {
  let out = html;
  out = out.replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (match, attrs) => {
    return /type=(['"])application\/ld\+json\1/i.test(attrs) ? match : '';
  });
  out = out.replace(/<link\b[^>]*(?:href|data-href)=(['"])[^'"]*\/wp-content\/(?:plugins|themes)\/[^'"]*\1[^>]*>/gi, '');
  out = out.replace(/<link\b[^>]*(?:href|data-href)=(['"])[^'"]*staging\.elevatecareerhub\.com\/wp-content\/uploads\/elementor\/google-fonts[^'"]*\1[^>]*>/gi, '');
  out = out.replace(/\/\*#\s*sourceURL=[^*]*(?:wp-content\/plugins|wp-content\/themes)[\s\S]*?\*\//gi, '');
  return out;
}

function cleanCssRemoteDependencies(css) {
  let out = css;
  out = out.replace(/@font-face\s*\{[^{}]*(?:staging\.elevatecareerhub\.com\/wp-content\/uploads\/elementor\/google-fonts|wp-content\/plugins)[^{}]*\}/gi, '');
  out = out.replace(/\/\*#\s*sourceURL=[^*]*(?:wp-content\/plugins|wp-content\/themes)[\s\S]*?\*\//gi, '');
  out = out.replace(/url\((['"]?)(?:https?:)?\/\/[^)'"]*\/wp-content\/plugins\/[^)'"]*\1\)/gi, 'none');
  out = out.replace(/url\((['"]?)https?:\/\/staging\.elevatecareerhub\.com\/wp-content\/uploads\/elementor\/google-fonts\/[^)'"]*\1\)/gi, 'none');
  return out;
}

async function neutralizeRemoteDependencyFiles(targetDir) {
  for (const file of await walkFiles(targetDir)) {
    const ext = path.extname(file).toLowerCase();
    if (!['.css', '.html', '.js'].includes(ext)) continue;
    let text = await fs.readFile(file, 'utf8');
    const original = text;
    if (ext === '.css') text = cleanCssRemoteDependencies(text);
    if (ext === '.html') text = stripLegacyDependencyReferences(text);
    if (text !== original) await fs.writeFile(file, text);
  }
}

const RECOVERED_UPLOADS_BASE = '/assets/wp-content/uploads';

const missingDecorativeImage = '/assets/missing-decorative.svg';

const recoveredImageReplacements = new Map([
  ['portrait-of-mid-adult-businesswoman-smiling-agains-5F3S7X7.jpg', `${RECOVERED_UPLOADS_BASE}/2024/01/T6-Copy-e1706661330276-600x900.webp`],
  ['composite-collage-of-happy-diverse-multicultural-y2-G8UCHFH.jpg', `${RECOVERED_UPLOADS_BASE}/2024/01/R1-Copy-600x600.webp`],
  ['composite-collage-of-happy-diverse-multicultural-y3-G8UCHFH.jpg', `${RECOVERED_UPLOADS_BASE}/2024/01/R5-Copy-600x600.webp`],
  ['composite-collage-of-happy-diverse-multicultural-y4-G8UCHFH.jpg', `${RECOVERED_UPLOADS_BASE}/2024/01/R9-Copy-600x600.webp`],
  ['composite-collage-of-happy-diverse-multicultural-y5-G8UCHFH.jpg', `${RECOVERED_UPLOADS_BASE}/2024/01/R10-Copy-600x600.webp`],
  ['Nhyira.jpg', `${RECOVERED_UPLOADS_BASE}/2025/06/Nhyira.jpg`],
  ['Number-1.webp', `${RECOVERED_UPLOADS_BASE}/2024/01/Number-1.webp`],
  ['Number-2.webp', `${RECOVERED_UPLOADS_BASE}/2024/01/Number-2.webp`],
  ['Number-3.webp', `${RECOVERED_UPLOADS_BASE}/2024/01/Number-3.webp`],
  ['Price-icon-2.webp', `${RECOVERED_UPLOADS_BASE}/2024/01/Price-icon-2.webp`],
  ['Frame-second-614x1024.webp', `${RECOVERED_UPLOADS_BASE}/2024/01/Frame-second-614x1024.webp`],
]);

const decorativeImagesToRemove = new Set([
  'Asset-14.png',
  'shape_Asset-6.png',
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rewriteImageSourceAttributes(html) {
  let out = html;

  // Prefer the local Vite-served upload copies over old WordPress remote srcset URLs.
  // This keeps responsive image selection intact without calling legacy infrastructure.
  out = out.replace(/https?:\/\/(?:www\.)?elevatecareerhub\.com\/wp-content\/uploads/gi, RECOVERED_UPLOADS_BASE);
  out = out.replace(/https?:\/\/staging\.elevatecareerhub\.com\/wp-content\/uploads/gi, RECOVERED_UPLOADS_BASE);

  for (const missingName of decorativeImagesToRemove) {
    const pattern = new RegExp(`(src=(["']))\\.\/[^"']*${escapeRegExp(missingName)}\\2`, 'gi');
    out = out.replace(pattern, (_match, _full, quote) => `src=${quote}${missingDecorativeImage}${quote}`);
  }

  for (const [brokenName, replacement] of recoveredImageReplacements) {
    const pattern = new RegExp(`(src=(["']))\\.\/[^"']*${escapeRegExp(brokenName)}\\2`, 'gi');
    out = out.replace(pattern, (_match, _full, quote) => `src=${quote}${replacement}${quote}`);
  }

  // The exported pages duplicate some trust-bearing images in sliders/animated blocks.
  // Native lazy loading leaves those visible nodes incomplete in browser QA, so make
  // page images eager for the static MVP snapshot. The pages are already local-only.
  out = out.replace(/\sloading=(["'])lazy\1/gi, ' loading=$1eager$1');

  return out;
}

function injectLaunchSafeguardCss(html) {
  const css = `<style id="ech-launch-visual-safeguards">
html[data-ech-source="local-wordpress-html"],
html[data-ech-source="local-wordpress-html"] body {
  max-width: 100%;
}
html[data-ech-source="local-wordpress-html"] *,
html[data-ech-source="local-wordpress-html"] *::before,
html[data-ech-source="local-wordpress-html"] *::after {
  box-sizing: border-box;
}
/* Elementor's animation library normally removes .elementor-invisible after firing
   the entry animation. We don't ship that JS for the static MVP, so we force the
   invisibility off — content must be visible on a static export. */
html[data-ech-source="local-wordpress-html"] .elementor-invisible {
  visibility: visible !important;
  opacity: 1 !important;
  animation: none !important;
}
html[data-ech-source="local-wordpress-html"] img,
html[data-ech-source="local-wordpress-html"] svg,
html[data-ech-source="local-wordpress-html"] video,
html[data-ech-source="local-wordpress-html"] canvas,
html[data-ech-source="local-wordpress-html"] iframe {
  max-width: 100%;
}
html[data-ech-source="local-wordpress-html"] .elementor-section,
html[data-ech-source="local-wordpress-html"] .elementor-container,
html[data-ech-source="local-wordpress-html"] .elementor-column,
html[data-ech-source="local-wordpress-html"] .elementor-widget-wrap,
html[data-ech-source="local-wordpress-html"] .elementor-widget-container {
  min-width: 0;
}
html[data-ech-source="local-wordpress-html"] .ech-inline-arrow,
html[data-ech-source="local-wordpress-html"] .ech-inline-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, sans-serif !important;
  font-weight: 700;
  line-height: 1;
  vertical-align: middle;
}
html[data-ech-source="local-wordpress-html"] .ech-inline-icon {
  min-width: 1em;
}
@media (max-width: 1024px) {
  html[data-ech-source="local-wordpress-html"] .elementor-section.elementor-section-boxed > .elementor-container,
  html[data-ech-source="local-wordpress-html"] .elementor-section > .elementor-container {
    max-width: min(100%, 100vw);
  }
  html[data-ech-source="local-wordpress-html"] .elementor-section,
  html[data-ech-source="local-wordpress-html"] .elementor-container,
  html[data-ech-source="local-wordpress-html"] .elementor-widget-wrap {
    left: auto !important;
    right: auto !important;
  }
  html[data-ech-source="local-wordpress-html"] .elementor-element {
    max-width: 100%;
  }
  html[data-ech-source="local-wordpress-html"] .elementskit-menu-toggler,
  html[data-ech-source="local-wordpress-html"] .elementor-icon.elementor-social-icon {
    min-width: 44px !important;
    min-height: 44px !important;
  }
  html[data-ech-source="local-wordpress-html"] .elementskit-menu-close.elementskit-menu-toggler {
    min-width: 44px !important;
    min-height: 44px !important;
    line-height: 1;
  }
  html[data-ech-source="local-wordpress-html"] .elementskit-menu-container.elementskit-menu-offcanvas-elements.snapshot-menu-open,
  html[data-ech-source="local-wordpress-html"] .hfe-nav-menu__layout-vertical.snapshot-menu-open {
    left: 0 !important;
    transform: translateX(0) !important;
  }
  html[data-ech-source="local-wordpress-html"] .elementor-icon.elementor-social-icon {
    width: 44px !important;
    height: 44px !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
  }
}
@media (max-width: 430px) {
  html[data-ech-source="local-wordpress-html"] .hfe-nav-menu__layout-vertical,
  html[data-ech-source="local-wordpress-html"] .hfe-nav-menu,
  html[data-ech-source="local-wordpress-html"] .hfe-nav-menu li,
  html[data-ech-source="local-wordpress-html"] .hfe-nav-menu .hfe-menu-item {
    width: auto !important;
    max-width: calc(100vw - 56px);
  }
}
</style>`;
  if (html.includes('id="ech-launch-visual-safeguards"')) return html;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${css}\n</head>`);
  return `${css}\n${html}`;
}

function injectLaunchMobileMenuSupport(html) {
  const script = `<script id="ech-launch-mobile-menu-support">
(function(){
  const routeMap = new Map([
    ['/index.php/services/', '/career-services/'],
    ['/index.php/services/#career-services', '/career-services/'],
    ['/services/', '/career-services/'],
    ['/services/#career-services', '/career-services/'],
    ['/index.php/#educational-services', '/educational-services/'],
    ['/index.php/about/', '/about/'],
    ['/index.php/contact-us/', '/contact-us/'],
    ['/index.php/diy-products/', '/diy-products/']
  ]);
  const blocked = new Set(['/cart/', '/checkout/', '/my-account/', '/shop/', '/manage-profile/']);
  const getMenu = () => document.querySelector('.elementskit-menu-container, .hfe-nav-menu__layout-vertical');
  const setOpen = (button, open) => {
    const menu = getMenu();
    if (!menu) return;
    const next = typeof open === 'boolean' ? open : !menu.classList.contains('snapshot-menu-open');
    menu.classList.toggle('snapshot-menu-open', next);
    button.classList.toggle('snapshot-menu-open', next);
  };
  const setAccordionState = (card, open) => {
    const accordion = card && card.closest('.elementskit-accordion');
    if (!accordion) return;
    accordion.querySelectorAll('.elementskit-card').forEach(item => {
      const header = item.querySelector('.elementskit-card-header');
      const toggler = item.querySelector('.elementskit-btn-link');
      const panel = item.querySelector('.collapse');
      const isOpen = item === card ? open : false;
      item.classList.toggle('active', isOpen);
      if (header) header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (toggler) {
        toggler.classList.toggle('collapsed', !isOpen);
        toggler.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
      if (panel) {
        panel.classList.toggle('show', isOpen);
        panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      }
    });
  };
  const bindAccordions = () => {
    document.querySelectorAll('.elementskit-accordion .elementskit-card-header').forEach(header => {
      if (header.dataset.echAccordionBound === 'true') return;
      header.dataset.echAccordionBound = 'true';
      if (!header.hasAttribute('role')) header.setAttribute('role', 'button');
      if (!header.hasAttribute('tabindex')) header.setAttribute('tabindex', '0');
      const activate = event => {
        if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
        if (event.type === 'click' && event.button !== 0) return;
        const card = header.closest('.elementskit-card');
        if (!card) return;
        const toggler = header.querySelector('.elementskit-btn-link');
        const isOpen = card.classList.contains('active') || (toggler && toggler.getAttribute('aria-expanded') === 'true');
        event.preventDefault();
        event.stopPropagation();
        setAccordionState(card, !isOpen);
      };
      header.addEventListener('click', activate);
      header.addEventListener('keydown', activate);
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAccordions, { once: true });
  } else {
    bindAccordions();
  }
  document.addEventListener('click', function(event){
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const toggle = target.closest('.elementskit-menu-hamburger, .elementskit-menu-toggler, .hfe-nav-menu__toggle');
    if (toggle instanceof HTMLElement) {
      event.preventDefault();
      setOpen(toggle);
      return;
    }
    const anchor = target.closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('#') || href.includes('wa.me')) return;
    let url;
    try { url = new URL(href, window.location.origin); } catch { return; }
    const local = url.origin === window.location.origin || url.hostname === 'elevatecareerhub.com';
    if (!local) return;
    const pathname = url.pathname.endsWith('/') || /\\.[^/]+$/.test(url.pathname) ? url.pathname : url.pathname + '/';
    if (url.hash && pathname === window.location.pathname) return;
    const exact = pathname + url.hash;
    const mapped = routeMap.get(exact) || routeMap.get(pathname);
    if (blocked.has(pathname)) {
      event.preventDefault();
      window.location.assign('/contact-us/');
      return;
    }
    if (mapped) {
      event.preventDefault();
      window.location.assign(mapped);
    }
  }, true);
})();
</script>`;
  if (html.includes('id="ech-launch-mobile-menu-support"')) return html;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${script}\n</body>`);
  return `${html}\n${script}`;
}

function escapeAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function upsertAttribute(tag, attr, value) {
  const escaped = escapeAttribute(value);
  const pattern = new RegExp(`\\s${attr}=(['\"]) [\\s\\S]*?\\1`.replace(' ', ''), 'i');
  if (pattern.test(tag)) return tag.replace(pattern, ` ${attr}=\"${escaped}\"`);
  return tag.replace(/\s*\/?>(\s*)$/i, ` ${attr}=\"${escaped}\">`);
}

function upsertMetaName(html, name, content) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\bname=(['\"])${escapeRegExp(name)}\\1)[^>]*>`, 'i');
  if (pattern.test(html)) return html.replace(pattern, tag => upsertAttribute(tag, 'content', content));
  return html.replace(/<\/head>/i, `<meta name=\"${escapeAttribute(name)}\" content=\"${escapeAttribute(content)}\">\n</head>`);
}

function upsertMetaProperty(html, property, content) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\bproperty=(['\"])${escapeRegExp(property)}\\1)[^>]*>`, 'i');
  if (pattern.test(html)) return html.replace(pattern, tag => upsertAttribute(tag, 'content', content));
  return html.replace(/<\/head>/i, `<meta property=\"${escapeAttribute(property)}\" content=\"${escapeAttribute(content)}\">\n</head>`);
}

function upsertCanonical(html, href) {
  const pattern = /<link\b(?=[^>]*\brel=(['"])canonical\1)[^>]*>/i;
  if (pattern.test(html)) return html.replace(pattern, tag => upsertAttribute(tag, 'href', href));
  return html.replace(/<\/head>/i, `<link rel=\"canonical\" href=\"${escapeAttribute(href)}\">\n</head>`);
}

function ensureLaunchMetadata(html, routeDef) {
  const seo = launchSeoByRoute.get(routeDef.route);
  if (!seo) return html;
  const canonical = `https://elevatecareerhub.com${routeDef.route}`;
  let out = html;
  if (/<title>[\s\S]*?<\/title>/i.test(out)) out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttribute(seo.title)}</title>`);
  else out = out.replace(/<head([^>]*)>/i, `<head$1>\n<title>${escapeAttribute(seo.title)}</title>`);
  out = upsertMetaName(out, 'description', seo.description);
  out = upsertCanonical(out, canonical);
  out = upsertMetaProperty(out, 'og:title', seo.title);
  out = upsertMetaProperty(out, 'og:description', seo.description);
  out = upsertMetaProperty(out, 'og:url', canonical);
  out = upsertMetaName(out, 'twitter:title', seo.title);
  out = upsertMetaName(out, 'twitter:description', seo.description);
  out = upsertMetaName(out, 'twitter:card', 'summary_large_image');
  return out;
}

function ensureLaunchH1(html, routeDef) {
  const seo = launchSeoByRoute.get(routeDef.route);
  if (!seo) return html;
  let h1Seen = false;
  let out = html.replace(/<h1\b([^>]*)>[\s\S]*?<\/h1>/gi, (match, attrs) => {
    if (!h1Seen) {
      h1Seen = true;
      return `<h1${attrs}>${escapeAttribute(seo.h1)}</h1>`;
    }
    return match.replace(/^<h1\b/i, '<h2').replace(/<\/h1>$/i, '</h2>');
  });
  if (h1Seen) return out;
  return out.replace(/<h2\b([^>]*)>[\s\S]*?<\/h2>/i, (_match, attrs) => `<h1${attrs}>${escapeAttribute(seo.h1)}</h1>`);
}

function basenameFromImageTag(tag) {
  const raw = tag.match(/\bsrc=(['"])(.*?)\1/i)?.[2] || '';
  const withoutQuery = raw.split(/[?#]/)[0];
  return decodeURIComponent(withoutQuery.substring(withoutQuery.lastIndexOf('/') + 1));
}

function altTextForImage(routeDef, imageName, currentAlt) {
  const normalizedAlt = (currentAlt || '').trim();
  const weakAlt = normalizedAlt === '' || normalizedAlt === '2' || /^fbpx$/i.test(normalizedAlt);
  if (!weakAlt) return normalizedAlt;
  if (decorativeImageNames.has(imageName)) return '';
  const routeAlt = routeAltTextByImage.get(routeDef.route)?.get(imageName);
  if (routeAlt) return routeAlt;
  return globalAltTextByImage.get(imageName) ?? normalizedAlt;
}

function setImageAlt(tag, alt) {
  let out = tag;
  if (/\balt=(['"])[\s\S]*?\1/i.test(out)) out = out.replace(/\balt=(['"])[\s\S]*?\1/i, `alt=\"${escapeAttribute(alt)}\"`);
  else out = out.replace(/\s*\/?>(\s*)$/i, ` alt=\"${escapeAttribute(alt)}\">`);
  if (alt === '' && !/\baria-hidden=/i.test(out)) out = out.replace(/^<img\b/i, '<img aria-hidden=\"true\"');
  return out;
}

function improveImageAltText(html, routeDef) {
  return html.replace(/<img\b[^>]*>/gi, tag => {
    const imageName = basenameFromImageTag(tag);
    const currentAlt = tag.match(/\balt=(['"])([\s\S]*?)\1/i)?.[2] ?? '';
    const alt = altTextForImage(routeDef, imageName, currentAlt);
    return setImageAlt(tag, alt);
  });
}

function whatsappUrl(message) {
  return `${WHATSAPP_BASE}?text=${encodeURIComponent(message)}`;
}

function contactFallbackBlock() {
  const whatsapp = whatsappUrl('Hello Elevate Career Hub, I would like help with CVs, applications, interviews, scholarships, school selection, DIY resources, or education/career planning.');
  return `<section class="ech-contact-fallback" aria-labelledby="ech-contact-fallback-title">
  <style>
    .ech-contact-fallback{background:#f8fbff;border:1px solid #dce8f7;border-radius:24px;padding:32px;margin:18px 0;color:#12213f;box-shadow:0 18px 45px rgba(18,33,63,.08)}
    .ech-contact-fallback__eyebrow{color:#006bb6;font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-size:13px;margin:0 0 8px}
    .ech-contact-fallback h3{font-size:clamp(26px,4vw,40px);line-height:1.15;margin:0 0 12px;color:#0b1f3a}
    .ech-contact-fallback p{font-size:16px;line-height:1.75;margin:0 0 18px;color:#334155}
    .ech-contact-fallback ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:0 0 24px;padding:0;list-style:none}
    .ech-contact-fallback li{background:#fff;border:1px solid #e5edf7;border-radius:14px;padding:12px 14px;font-weight:600;color:#1f365c}
    .ech-contact-fallback__actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
    .ech-contact-fallback__button{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:14px 22px;font-weight:800;text-decoration:none!important;line-height:1.2;transition:transform .18s ease,box-shadow .18s ease}
    .ech-contact-fallback__button:focus-visible{outline:3px solid #88c7ff;outline-offset:3px}
    .ech-contact-fallback__button:hover{transform:translateY(-1px);box-shadow:0 12px 24px rgba(0,0,0,.12)}
    .ech-contact-fallback__button--primary{background:#10b981;color:#fff!important}
    .ech-contact-fallback__button--secondary{background:#fff;color:#0b4f8a!important;border:1px solid #b9d7ef}
    @media (max-width:480px){.ech-contact-fallback{padding:24px 18px;border-radius:18px}.ech-contact-fallback__button{width:100%}}
  </style>
  <p class="ech-contact-fallback__eyebrow">WhatsApp-first support</p>
  <h3 id="ech-contact-fallback-title">Talk to Elevate Career Hub</h3>
  <p>Tell us what you are working on and we will guide you to the right next step. You can ask about CVs, cover letters, applications, interviews, scholarships, school selection, DIY resources, and education or career planning.</p>
  <ul aria-label="Topics Elevate Career Hub can help with">
    <li>CVs and cover letters</li>
    <li>Graduate school applications</li>
    <li>Interview preparation</li>
    <li>Scholarships and essays</li>
    <li>School selection</li>
    <li>DIY career resources</li>
  </ul>
  <div class="ech-contact-fallback__actions">
    <a class="ech-contact-fallback__button ech-contact-fallback__button--primary" href="${escapeAttribute(whatsapp)}">Message us on WhatsApp</a>
    <a class="ech-contact-fallback__button ech-contact-fallback__button--secondary" href="mailto:${CONTACT_EMAIL}">Email ${CONTACT_EMAIL}</a>
  </div>
</section>`;
}

function updateMetaContent(html, selectorPattern, content) {
  return html.replace(selectorPattern, (match) => match.replace(/content=(['"])[\s\S]*?\1/i, `content="${escapeAttribute(content)}"`));
}

function cleanContactMetadata(html) {
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/i, '<title>Contact Elevate Career Hub</title>');
  if (!/<title>[\s\S]*?<\/title>/i.test(out)) out = out.replace(/<head([^>]*)>/i, `<head$1><title>Contact Elevate Career Hub</title>`);
  out = updateMetaContent(out, /<meta\s+name=(['"])description\1[^>]*>/i, SAFE_CONTACT_DESCRIPTION);
  out = updateMetaContent(out, /<meta\s+property=(['"])og:description\1[^>]*>/i, SAFE_CONTACT_DESCRIPTION);
  out = updateMetaContent(out, /<meta\s+name=(['"])twitter:description\1[^>]*>/i, SAFE_CONTACT_DESCRIPTION);
  out = updateMetaContent(out, /<meta\s+property=(['"])og:title\1[^>]*>/i, 'Contact Elevate Career Hub');
  out = updateMetaContent(out, /<meta\s+name=(['"])twitter:title\1[^>]*>/i, 'Contact Elevate Career Hub');
  return out;
}

function replaceBrokenContactForm(html) {
  let out = cleanContactMetadata(html);
  const fallback = contactFallbackBlock();
  const brokenFormPattern = new RegExp(`<div\\s+id=(["'])ff_form_1\\1\\s+class=(["'])${QUOTA_CLASS}\\2>[\\s\\S]*?<\\/div>`, 'i');
  out = out.replace(brokenFormPattern, fallback);
  out = out.replaceAll(ENTRY_LIMIT_TEXT, '');
  out = out.replace(new RegExp(QUOTA_CLASS, 'g'), 'ech-form-replaced');
  return out;
}

function getProductName(anchorHtml) {
  const aria = anchorHtml.match(/aria-label=(['"])(.*?)\1/i)?.[2] || '';
  const success = anchorHtml.match(/data-success_message=(['"])(.*?)\1/i)?.[2] || '';
  const raw = aria || success || 'this DIY resource';
  return raw
    .replace(/^Add to cart:\s*/i, '')
    .replace(/\s+has been added to your cart\.?$/i, '')
    .replace(/[“”]/g, '')
    .trim() || 'this DIY resource';
}

function rewriteAddToCartAnchor(anchorHtml) {
  const productName = getProductName(anchorHtml);
  const href = whatsappUrl(`Hello Elevate Career Hub, I would like to purchase or ask about ${productName}.`);
  let out = anchorHtml
    .replace(/\sdata-(?:quantity|product_id|product_sku|success_message)=(['"])[\s\S]*?\1/gi, '')
    .replace(/\saria-describedby=(['"])[\s\S]*?\1/gi, '')
    .replace(/\srel=(['"])[\s\S]*?\1/gi, '')
    .replace(/\shref=(['"])[\s\S]*?\1/i, ` href="${escapeAttribute(href)}"`)
    .replace(/\saria-label=(['"])[\s\S]*?\1/i, ` aria-label="Message Elevate Career Hub on WhatsApp about ${escapeAttribute(productName)}"`);
  if (!/\shref=/i.test(out)) out = out.replace(/^<a\b/i, `<a href="${escapeAttribute(href)}"`);
  if (!/\saria-label=/i.test(out)) out = out.replace(/^<a\b/i, `<a aria-label="Message Elevate Career Hub on WhatsApp about ${escapeAttribute(productName)}"`);
  out = out.replace(/\sclass=(['"])(.*?)\1/i, (_m, quote, classes) => {
    const cleaned = classes
      .split(/\s+/)
      .filter(Boolean)
      .filter(cls => !/^(?:product_type_|add_to_cart_button|ajax_add_to_cart)/.test(cls))
      .concat('ech-assisted-commerce-link')
      .join(' ');
    return ` class=${quote}${cleaned}${quote}`;
  });
  if (!/\starget=/i.test(out)) out = out.replace(/^<a\b/i, '<a target="_blank"');
  if (!/\srel=/i.test(out)) out = out.replace(/^<a\b/i, '<a rel="noopener"');
  return out.replace(/>([\s\S]*?)<\/a>$/i, '>Message us to purchase</a>');
}

function rewriteAssistedCommerce(html) {
  let out = html;
  out = out.replace(/<a\b[^>]*\bclass=(['"])[^'"]*(?:add_to_cart_button|ajax_add_to_cart)[^'"]*\1[^>]*>[\s\S]*?<\/a>/gi, rewriteAddToCartAnchor);
  out = out.replace(/<li\b[^>]*class=(['"])[^'"]*eael-product-list-quick-view-button[^'"]*\1[^>]*>[\s\S]*?<\/li>/gi, '');
  out = out.replace(/<a\b([^>]*\bclass=(['"])[^'"]*open-popup-link[^'"]*\2[^>]*)>[\s\S]*?<\/a>/gi, '');
  return out;
}

function rewriteBlockedCommerceLinks(html) {
  return html.replace(/\b(href|action)=(['"])([^'"]*)\2/gi, (match, attr, quote, rawHref) => {
    try {
      const url = new URL(rawHref, 'https://elevatecareerhub.com');
      const pathname = normalizeInternalPathname(url.pathname);
      if (BLOCKED_COMMERCE_ROUTES.has(pathname)) return `${attr}=${quote}${ASSISTED_COMMERCE_ROUTE}${quote}`;
      if (url.searchParams.has('add-to-cart')) {
        const product = url.searchParams.get('add-to-cart') || 'this DIY resource';
        return `${attr}=${quote}${escapeAttribute(whatsappUrl(`Hello Elevate Career Hub, I would like to purchase or ask about product ${product}.`))}${quote}`;
      }
    } catch {
      return match;
    }
    return match;
  });
}

function applyLaunchConversionFixes(html, routeDef) {
  let out = html;
  if (routeDef.route === '/contact-us/') out = replaceBrokenContactForm(out);
  out = rewriteAssistedCommerce(out);
  out = rewriteBlockedCommerceLinks(out);
  return out;
}

function iconFallbackForClassList(classValue) {
  const classes = new Set(String(classValue).split(/\s+/).filter(Boolean));
  const has = (...names) => names.some(name => classes.has(name));

  if (has('icon')) {
    if (has('icon-arrow-right', 'icon-right-arrow', 'icon-right-arrow2', 'icon-double-angle-pointing-to-right')) return '→';
    if (has('icon-left-arrow2', 'icon-left-arrows')) return '←';
    if (has('icon-down-arrow1')) return '▾';
    if (has('icon-tick', 'icon-check')) return '✓';
    if (has('icon-testimonial-quote')) return '❝';
    if (has('icon-comments')) return '💬';
    if (has('icon-menu1')) return '☰';
    if (has('icon-facebook')) return 'f';
    if (has('icon-twitter')) return '𝕏';
    if (has('icon-linkedin')) return 'in';
    if (has('icon-whatsapp-2')) return 'WA';
    if (has('icon-Money')) return '$';
  }

  if (has('fas', 'far', 'fab')) {
    if (has('fa-arrow-up')) return '↑';
    if (has('fa-phone', 'fa-phone-alt')) return '☎';
    if (has('fa-instagram')) return 'IG';
    if (has('fa-twitter')) return '𝕏';
    if (has('fa-linkedin-in')) return 'in';
    if (has('fa-youtube')) return '▶';
    if (has('fa-check')) return '✓';
    if (has('fa-plus')) return '+';
    if (has('fa-minus')) return '−';
    if (has('fa-angle-right', 'fa-chevron-right')) return '›';
    if (has('fa-times-circle')) return '×';
    if (has('fa-calendar-check')) return '📅';
    if (has('fa-envelope')) return '✉';
    if (has('fa-file-alt')) return '📄';
    if (has('fa-facebook', 'fa-facebook-f')) return 'f';
    if (has('fa-whatsapp')) return 'WA';
    if (has('fa-search')) return '⌕';
  }

  return null;
}

function replaceIconFontMarkup(html) {
  return html.replace(/<i\b([^>]*)class=(['"])([^'"]*?)\2([^>]*)>\s*<\/i>/gi, (match, before, quote, classValue, after) => {
    const fallback = iconFallbackForClassList(classValue);
    if (!fallback) return match;
    return `<span aria-hidden="true" class="ech-inline-icon">${fallback}</span>`;
  });
}

function rewriteNavigationOnly(html, routeDef) {
  let out = html;

  // Rewrite Elevate same-site navigation so static routes are reachable, and keep
  // launch-blocked commerce paths from pretending cart/checkout/account are live.
  out = out.replace(/\b(href|action)=(['"])(https?:\/\/(?:www\.)?elevatecareerhub\.com)([^'"]*)\2/gi, (_m, attr, quote, _origin, rawPath) => {
    let local = rawPath || '/';
    try {
      const url = new URL(`https://elevatecareerhub.com${rawPath || '/'}`);
      const pathname = normalizeInternalPathname(url.pathname);
      if (BLOCKED_COMMERCE_ROUTES.has(pathname)) return `${attr}=${quote}${ASSISTED_COMMERCE_ROUTE}${quote}`;
      if (knownInternalRoutes.has(pathname) || pathname === routeDef.route || pathname === '/') {
        local = `${pathname}${url.search}${url.hash}`;
      } else {
        local = `${pathname}${url.search}${url.hash}`;
      }
    } catch {
      local = rawPath || '/';
    }
    return `${attr}=${quote}${local}${quote}`;
  });

  out = out
    .replace(/href=(['"])\/index\.php\/contact-us\//gi, 'href=$1/contact-us/')
    .replace(/href=(['"])\/index\.php\/diy-products\//gi, 'href=$1/diy-products/')
    .replace(/href=(['"])\/index\.php\/about\//gi, 'href=$1/about/')
    .replace(/href=(['"])\/index\.php\/#/gi, 'href=$1/#')
    .replace(/href=(['"])\/index\.php\/services\/#career-services/gi, 'href=$1/career-services/#career-services');

  out = out.replace(/<html(\s|>)/i, '<html data-ech-source="local-wordpress-html"$1');
  out = rewriteImageSourceAttributes(out);
  out = replaceIconFontMarkup(out);
  out = applyLaunchConversionFixes(out, routeDef);
  out = ensureLaunchMetadata(out, routeDef);
  out = ensureLaunchH1(out, routeDef);
  out = improveImageAltText(out, routeDef);
  out = injectLaunchSafeguardCss(out);
  out = stripLegacyDependencyReferences(out);
  out = injectLaunchMobileMenuSupport(out);
  return out;
}

async function copyRoute(routeDef) {
  const htmlPath = path.join(sourceRoot, routeDef.file);
  const assetsPath = path.join(sourceRoot, routeDef.assets);
  if (!(await pathExists(htmlPath))) throw new Error(`Missing source HTML: ${htmlPath}`);
  if (!(await pathExists(assetsPath))) throw new Error(`Missing source assets: ${assetsPath}`);

  const targetDir = outputDirForRoute(routeDef.route);
  await fs.mkdir(targetDir, { recursive: true, mode: 0o700 });

  const raw = await fs.readFile(htmlPath, 'utf8');
  const rewrittenHtml = rewriteNavigationOnly(raw, routeDef);
  await fs.writeFile(path.join(targetDir, 'index.html'), rewrittenHtml);

  // Vite preview can fall back to the React shell for extensionless routes.
  // Keep those fetched snapshots aligned with the same local WordPress source
  // so either serving path renders the same source-truth artifacts.
  const snapshotDir = path.join(distRoot, 'snapshots');
  await fs.mkdir(snapshotDir, { recursive: true, mode: 0o700 });
  await fs.writeFile(path.join(snapshotDir, `${routeDef.slug}.html`), rewrittenHtml);

  const targetAssets = path.join(targetDir, routeDef.assets);
  await fs.rm(targetAssets, { recursive: true, force: true });
  await fs.cp(assetsPath, targetAssets, { recursive: true, preserveTimestamps: true });
  await copyLocalFontAssets(targetAssets);
  await neutralizeAnalyticsScripts(targetAssets);
  await neutralizeRemoteDependencyFiles(targetAssets);

  return {
    route: routeDef.route,
    label: routeDef.label,
    sourceHtml: path.relative(projectRoot, htmlPath),
    sourceAssets: path.relative(projectRoot, assetsPath),
    distHtml: path.relative(projectRoot, path.join(targetDir, 'index.html')),
    distAssets: path.relative(projectRoot, targetAssets),
  };
}

function redirectShell(route, target = ASSISTED_COMMERCE_ROUTE) {
  const title = 'Redirecting to Elevate Career Hub';
  return `<!doctype html>
<html lang="en-US"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${target}"><link rel="canonical" href="${target}"></head><body><main><h1>${title}</h1><p>This launch route is handled through assisted commerce. Continue to <a href="${target}">contact Elevate Career Hub</a>.</p></main><script>location.replace(${JSON.stringify(target)});</script></body></html>`;
}

const SITE_ORIGIN = 'https://elevatecareerhub.com';
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/assets/wp-content/uploads/2024/01/2.png`;

const NON_PRIORITY_SEO = new Map([
  ['/blog/', {
    title: 'News & Insights — Elevate Career Hub',
    h1: 'News & Insights',
    description: 'Latest Elevate Career Hub articles on resumes, cover letters, interviews, applications, and education planning.',
    summary: 'Latest articles from Elevate Career Hub, organized as a clean editorial feed.',
  }],
  ['/career-strategy-session/', {
    title: '1-on-1 Career Strategy Session — Elevate Career Hub',
    h1: 'Career Strategy Session',
    description: 'Book a 1-on-1 career strategy session with Elevate Career Hub to map your next career move with a clear, practical plan.',
    summary: 'Sit down with an Elevate Career Hub advisor for a focused 1-on-1 session. We help you clarify your goals, weigh your options, and leave with a clear plan for the next stretch of your career.',
  }],
  ['/cover-letter/', {
    title: 'Cover Letter Writing Service — Elevate Career Hub',
    h1: 'Cover Letter Writing',
    description: 'Get a tailored, compelling cover letter from Elevate Career Hub that introduces you to employers and matches the role you want.',
    summary: 'A great cover letter does the introducing for you. Elevate Career Hub writes tailored cover letters that match the role, sound like you, and give the hiring manager a reason to keep reading.',
  }],
  ['/curriculum-vitae/', {
    title: 'CV Writing Service — Elevate Career Hub',
    h1: 'Curriculum Vitae (CV) Writing',
    description: 'Elevate Career Hub builds professional CVs that tell your story clearly and position you for the roles you want.',
    summary: 'Your CV is more than a document — it is your professional story. Elevate Career Hub helps you structure it, sharpen it, and position your experience for the roles you actually want.',
  }],
  ['/faqs/', {
    title: 'Frequently Asked Questions — Elevate Career Hub',
    h1: 'Frequently Asked Questions',
    description: 'Answers to common questions about Elevate Career Hub services, pricing, timelines, and how to get started.',
    summary: 'Quick answers about the services we offer, how long things take, what we charge, and how to get started. If your question is not here, message us on WhatsApp and we will help.',
  }],
  ['/how-our-career-development-company-can-help-you-stand-out/', {
    title: 'How Elevate Career Hub Helps You Stand Out',
    h1: 'How Our Career Development Company Helps You Stand Out',
    description: 'How Elevate Career Hub helps you stand out — strong resumes, compelling cover letters, polished LinkedIn, and confident interviews.',
    summary: 'Standing out in a competitive market takes more than effort — it takes the right materials and the right plan. Here is how Elevate Career Hub helps you put both in place.',
  }],
  ['/how-to-boost-your-career-with-professional-resume-writing/', {
    title: 'Boost Your Career with Professional Resume Writing',
    h1: 'How to Boost Your Career with Professional Resume Writing',
    description: 'Why a professionally written resume can change your career trajectory — and how Elevate Career Hub builds yours.',
    summary: 'A strong resume opens doors. Recent graduate or seasoned professional, this is how a professionally written resume — and the Elevate Career Hub approach — moves your career forward.',
  }],
  ['/interview-preparation-session/', {
    title: 'Interview Preparation Session — Elevate Career Hub',
    h1: 'Interview Preparation Session',
    description: 'Practice with an Elevate Career Hub coach to walk into your next interview prepared, focused, and confident.',
    summary: 'Interviews are the gateway to the role you want. Elevate Career Hub runs focused 1-on-1 prep sessions so you walk in calm, sharp, and ready to answer the questions that matter.',
  }],
  ['/job-readiness-bootcamp/', {
    title: 'Job Readiness Bootcamp — Elevate Career Hub',
    h1: 'Job Readiness Bootcamp',
    description: 'A live online bootcamp from Elevate Career Hub to stop applying blindly and start getting interviews.',
    summary: 'Stop applying blindly. The Elevate Career Hub Job Readiness Bootcamp is a live online programme that closes the gap between being qualified and actually getting interviews.',
  }],
  ['/jrb-thank-you/', {
    title: 'Welcome to the Job Readiness Bootcamp — Elevate Career Hub',
    h1: 'Welcome to the Job Readiness Bootcamp',
    description: 'Thanks for completing payment for the Elevate Career Hub Job Readiness Bootcamp. One short form left to tailor your experience.',
    summary: 'Thanks for completing your payment for the Job Readiness Bootcamp. One short form left so we can tailor the experience to your goals before we begin.',
    noindex: true,
  }],
  ['/lets-keep-in-touch/', {
    title: 'Let’s Keep in Touch — Elevate Career Hub',
    h1: 'Let’s Keep in Touch',
    description: 'Stay in touch with Elevate Career Hub for career and education tips, new resources, and programme announcements.',
    summary: 'We share practical career and education tips, new DIY resources, and programme dates a few times a month. Drop your email and we will keep you in the loop.',
  }],
  ['/linkedin-optimization/', {
    title: 'LinkedIn Optimization Service — Elevate Career Hub',
    h1: 'LinkedIn Optimization',
    description: 'Elevate Career Hub turns your LinkedIn profile into a polished, recruiter-ready version of your professional brand.',
    summary: 'Your LinkedIn profile is your digital handshake. Elevate Career Hub rewrites it to look polished, sound like you, and tell recruiters exactly why they should reach out.',
  }],
  ['/product/becoming-a-job-magnet-on-linkedin/', {
    title: 'Becoming a Job Magnet on LinkedIn — DIY Product',
    h1: 'Becoming a Job Magnet on LinkedIn',
    description: 'A DIY guide from Elevate Career Hub to turn your LinkedIn profile into a job-attracting asset.',
    summary: 'A self-guided product from Elevate Career Hub. Follow the framework to rebuild your LinkedIn profile, attract the right recruiters, and turn LinkedIn into a job-search advantage.',
  }],
  ['/product/complete-grad-school-bundle/', {
    title: 'Complete Grad School Bundle — DIY Product',
    h1: 'Complete Grad School Bundle',
    description: 'An all-in-one Elevate Career Hub DIY bundle for graduate school applicants — essays, CV, references, and more.',
    summary: 'An all-in-one DIY bundle for graduate school applicants. Templates, examples, and walkthroughs for the essays, CV, and supporting materials a strong application needs.',
  }],
  ['/product/how-to-write-the-resume-that-lands-the-interview/', {
    title: 'How to Write the Resume That Lands the Interview — DIY Product',
    h1: 'How to Write the Resume That Lands the Interview',
    description: 'An Elevate Career Hub DIY product on writing the kind of resume that actually gets you to interview.',
    summary: 'Write the resume that gets you to interview. This Elevate Career Hub DIY product walks through the structure, language, and framing that hiring managers actually respond to.',
  }],
  ['/product/mastering-the-art-of-job-hunting-in-the-uk-as-an-international-student/', {
    title: 'Job Hunting in the UK as an International Student — DIY Product',
    h1: 'Mastering the Art of Job Hunting in the UK as an International Student',
    description: 'Elevate Career Hub DIY guide for international students job-hunting in the UK — the rules, the strategy, the playbook.',
    summary: 'A DIY playbook for international students job-hunting in the UK. The visa rules, the application strategy, and the small moves that turn applications into offers.',
  }],
  ['/product/nailing-your-job-interviews/', {
    title: 'Nailing Your Job Interviews — DIY Product',
    h1: 'Nailing Your Job Interviews',
    description: 'A DIY interview preparation product from Elevate Career Hub to help you walk in prepared and walk out remembered.',
    summary: 'Interview prep you can run on your own time. Frameworks, sample answers, and walkthroughs from Elevate Career Hub for the questions that decide whether you get the offer.',
  }],
  ['/product/remote-job-playbook/', {
    title: 'Remote Job Playbook — DIY Product',
    h1: 'Remote Job Playbook',
    description: 'An Elevate Career Hub DIY playbook for landing legitimate, well-paid remote roles.',
    summary: 'A practical playbook for landing legitimate, well-paid remote roles. Where to look, how to position yourself, and how to stand out in a remote-first hiring process.',
  }],
  ['/product/the-complete-job-search-bundle/', {
    title: 'The Complete Job Search Bundle — DIY Product',
    h1: 'The Complete Job Search Bundle',
    description: 'Elevate Career Hub’s end-to-end DIY bundle covering CV, cover letter, LinkedIn, and interview prep.',
    summary: 'The end-to-end DIY bundle: CV, cover letter, LinkedIn, and interview prep — every Elevate Career Hub framework for the modern job search in one package.',
  }],
  ['/reference-letter/', {
    title: 'Reference Letter Service — Elevate Career Hub',
    h1: 'Reference Letter Drafts',
    description: 'Elevate Career Hub drafts strong, specific reference letters that genuinely back the application they support.',
    summary: 'Reference letters are powerful endorsements. Elevate Career Hub drafts specific, credible reference letters that genuinely back the application they are sent with.',
  }],
  ['/statement-of-purpose/', {
    title: 'Statement of Purpose & Scholarship Essay — Elevate Career Hub',
    h1: 'Statement of Purpose & Scholarship Essay',
    description: 'Elevate Career Hub helps you write a Statement of Purpose or scholarship essay that admissions committees actually want to read.',
    summary: 'Your Statement of Purpose is the linchpin of your application. Elevate Career Hub helps you write one that is specific, honest, and clearly answers why you, why this programme, and why now.',
  }],
  ['/suggestion-of-schools/', {
    title: 'School Suggestion Service — Elevate Career Hub',
    h1: 'School Suggestion Service',
    description: 'Get a tailored shortlist of schools from Elevate Career Hub based on your goals, profile, and budget.',
    summary: 'Picking the right school changes everything that follows. Elevate Career Hub builds you a tailored shortlist based on your goals, your profile, and what is actually realistic for you.',
  }],
  ['/the-importance-of-professional-documents-in-career-development/', {
    title: 'The Importance of Professional Documents in Career Development',
    h1: 'The Importance of Professional Documents in Career Development',
    description: 'Why resumes, cover letters, and personal statements still decide careers — and how to make yours work for you.',
    summary: 'Resumes, cover letters, and personal statements are still the gatekeepers of most careers. This is why they matter, and how to make sure yours are working for you, not against you.',
  }],
  ['/tips-for-crafting-an-effective-resume-cover-letter-personal-statement-and-school-application/', {
    title: 'Tips for Crafting an Effective Resume, Cover Letter & Application',
    h1: 'Tips for Crafting an Effective Resume, Cover Letter, Personal Statement, and School Application',
    description: 'Practical Elevate Career Hub tips for stronger resumes, cover letters, personal statements, and school applications.',
    summary: 'Practical Elevate Career Hub tips for the documents that decide your career: resume, cover letter, personal statement, and school application — each one sharper, clearer, and more you.',
  }],
]);

function htmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function snapshotPrimaryCta(route) {
  if (route.startsWith('/product/') || route === '/diy-products/') {
    return { href: '/contact-us/', label: 'Message Elevate Career Hub' };
  }
  if (route === '/job-readiness-bootcamp/' || route === '/career-strategy-session/' || route === '/interview-preparation-session/') {
    return { href: '/contact-us/', label: 'Book a session' };
  }
  if (route === '/blog/' || route.startsWith('/how-') || route.startsWith('/the-importance-') || route.startsWith('/tips-')) {
    return { href: '/contact-us/', label: 'Talk to a career advisor' };
  }
  return { href: '/contact-us/', label: 'Talk to Elevate Career Hub' };
}

function blogCategoryForRoute(route, title) {
  const value = `${route} ${title}`.toLowerCase();
  if (value.includes('resume') || value.includes('curriculum vitae') || value.includes('cv')) return 'CV & Resume';
  if (value.includes('cover letter') || value.includes('personal statement')) return 'Applications';
  if (value.includes('interview')) return 'Interview Prep';
  if (value.includes('linkedin')) return 'LinkedIn';
  if (value.includes('school') || value.includes('scholarship') || value.includes('graduate')) return 'Education';
  if (value.includes('job')) return 'Job Search';
  return 'Career Growth';
}

function blogSummaryForTitle(title) {
  const value = title.toLowerCase();
  if (value.includes('resume')) return 'Practical resume guidance to help you get more interviews and present your experience clearly.';
  if (value.includes('cover letter')) return 'Clear advice for writing cover letters and application documents that sound confident and human.';
  if (value.includes('interview')) return 'Useful interview prep insights so you can answer with more confidence and less stress.';
  if (value.includes('linkedin')) return 'Simple LinkedIn improvements that help your profile look credible, current, and searchable.';
  if (value.includes('school') || value.includes('graduate') || value.includes('scholarship')) return 'Support for education planning, school selection, and applications that need to land well.';
  if (value.includes('job')) return 'Job search ideas, tools, and tactics to help you move with more clarity.';
  return 'Short, practical guidance from Elevate Career Hub to help you move forward with confidence.';
}

function formatPostDate(dateValue) {
  if (!dateValue) return 'Updated recently';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Updated recently';
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

function buildBlogShell(reactShellHtml, page, seo, pages) {
  const route = page.route;
  const canonical = `${SITE_ORIGIN}${route}`;
  const title = seo.title;
  const description = seo.description;
  const h1 = seo.h1;
  const summary = seo.summary;
  const cta = snapshotPrimaryCta(route);
  const noindex = seo.noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index,follow">';
  const assetTags = [];
  const scriptMatches = reactShellHtml.match(/<script\b[^>]*src=["'][^"']+["'][^>]*><\/script>/gi) || [];
  const linkMatches = reactShellHtml.match(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
  assetTags.push(...linkMatches);
  assetTags.push(...scriptMatches);

  const posts = pages
    .filter(item => item.type === 'posts')
    .sort((a, b) => new Date(b.dateModified || 0) - new Date(a.dateModified || 0))
    .slice(0, 8)
    .map(item => ({
      href: item.route,
      title: item.title,
      category: blogCategoryForRoute(item.route, item.title),
      summary: blogSummaryForTitle(item.title),
      date: formatPostDate(item.dateModified),
    }));

  const postCards = posts.map(post => `
        <article class="ech-blog-card">
          <p class="ech-blog-card__meta">${htmlEscape(post.category)} · ${htmlEscape(post.date)}</p>
          <h2>${htmlEscape(post.title)}</h2>
          <p>${htmlEscape(post.summary)}</p>
          <a href="${htmlEscape(post.href)}">Read article</a>
        </article>`).join('');

  const head = [
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `<title>${htmlEscape(title)}</title>`,
    `<meta name="description" content="${htmlEscape(description)}">`,
    noindex,
    `<link rel="canonical" href="${htmlEscape(canonical)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${htmlEscape(title)}">`,
    `<meta property="og:description" content="${htmlEscape(description)}">`,
    `<meta property="og:url" content="${htmlEscape(canonical)}">`,
    `<meta property="og:image" content="${htmlEscape(DEFAULT_OG_IMAGE)}">`,
    `<meta property="og:site_name" content="Elevate Career Hub">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${htmlEscape(title)}">`,
    `<meta name="twitter:description" content="${htmlEscape(description)}">`,
    `<meta name="twitter:image" content="${htmlEscape(DEFAULT_OG_IMAGE)}">`,
    ...assetTags,
  ].join('\n    ');

  const featured = posts[0];
  const secondaryPosts = posts.slice(1);
  const featuredCard = featured ? `
        <article class="ech-blog-featured">
          <p class="ech-blog-featured__meta">Featured · ${htmlEscape(featured.category)} · ${htmlEscape(featured.date)}</p>
          <h2>${htmlEscape(featured.title)}</h2>
          <p>${htmlEscape(featured.summary)}</p>
          <a href="${htmlEscape(featured.href)}">Read article</a>
        </article>` : '';

  const listItems = secondaryPosts.map(post => `
            <li class="ech-blog-list__item">
              <div>
                <p class="ech-blog-list__meta">${htmlEscape(post.category)} · ${htmlEscape(post.date)}</p>
                <h3><a href="${htmlEscape(post.href)}">${htmlEscape(post.title)}</a></h3>
                <p>${htmlEscape(post.summary)}</p>
              </div>
              <a class="ech-blog-list__link" href="${htmlEscape(post.href)}">Read</a>
            </li>`).join('');

  const navLinks = [
    ['/', 'Home'],
    ['/about/', 'About'],
    ['/educational-services/', 'Educational Services'],
    ['/career-services/', 'Career Services'],
    ['/blog/', 'Blog'],
    ['/contact-us/', 'Contact Us'],
  ];

  const navItems = navLinks.map(([href, label]) => `<a class="elementskit-nav-link${href === '/blog/' ? ' active' : ''}" href="${href}">${label}</a>`).join('');

  const bodyContent = `<div id="root"><main class="ech-prerender ech-blog-prerender">
      <style>
        html[data-ech-prerender="non-priority"] body{margin:0;background:#fbf9f2;color:#1b1c18;font-family:'DM Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
        html[data-ech-prerender="non-priority"] .ech-prerender{max-width:1440px;margin:0 auto;padding:0 1.5rem 4rem}
        html[data-ech-prerender="non-priority"] .ech-site-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:0;border-bottom:0}
        html[data-ech-prerender="non-priority"] .ech-site-header #masthead{width:100%}
        html[data-ech-prerender="non-priority"] .ech-site-brand{display:inline-flex;align-items:center;text-decoration:none!important}
        html[data-ech-prerender="non-priority"] .ech-site-brand img{display:block;width:1024px;max-width:42vw;height:auto}
        html[data-ech-prerender="non-priority"] .ech-site-nav{display:flex;align-items:center;flex-wrap:wrap;justify-content:flex-end;gap:.9rem}
        html[data-ech-prerender="non-priority"] .ech-site-nav__wrap{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.35rem 0 1rem;border-bottom:1px solid #c0c7d1}
        html[data-ech-prerender="non-priority"] .elementskit-nav-link{color:#002E47;text-decoration:none;font-weight:700;font-size:.95rem}
        html[data-ech-prerender="non-priority"] .elementskit-nav-link.active{color:#005281}
        html[data-ech-prerender="non-priority"] .ech-site-nav__cta{display:inline-flex;align-items:center;justify-content:center;border-radius:.5rem;padding:.78rem 1rem;background:#005281;color:#fff!important;text-decoration:none!important;font-weight:700;box-shadow:inset 0 -2px 0 rgba(0,0,0,.12)}
        html[data-ech-prerender="non-priority"] .ech-blog-hero{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(320px,.95fr);gap:1.5rem;align-items:center;padding:2rem 0 1.8rem;border-bottom:1px solid #c0c7d1}
        html[data-ech-prerender="non-priority"] .ech-blog-hero__eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:.76rem;font-weight:700;color:#005281;margin:0 0 .65rem}
        html[data-ech-prerender="non-priority"] .ech-blog-hero h1{margin:0;font-family:Lexend,'DM Sans',system-ui,sans-serif;font-size:clamp(2.4rem,5vw,4.2rem);line-height:1.02;letter-spacing:-.025em;max-width:12ch;color:#002E47}
        html[data-ech-prerender="non-priority"] .ech-blog-hero__summary{margin:.95rem 0 0;max-width:58ch;font-size:1.06rem;line-height:1.7;color:#404750}
        html[data-ech-prerender="non-priority"] .ech-blog-hero__actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1.15rem}
        html[data-ech-prerender="non-priority"] .ech-blog-hero__button{display:inline-flex;align-items:center;justify-content:center;border-radius:.5rem;padding:.8rem 1.1rem;font-weight:700;text-decoration:none!important;line-height:1.2}
        html[data-ech-prerender="non-priority"] .ech-blog-hero__button--primary{background:#005281;color:#fff!important;box-shadow:inset 0 -2px 0 rgba(0,0,0,.12)}
        html[data-ech-prerender="non-priority"] .ech-blog-hero__button--secondary{background:#fff;color:#005281!important;border:1px solid #006BA6}
        html[data-ech-prerender="non-priority"] .ech-blog-hero__panel{display:grid;grid-template-columns:1fr 1fr;gap:.85rem;background:#fff;border:1px solid #e4e2dc;border-radius:1.5rem;padding:1.1rem;box-shadow:0 20px 40px rgba(0,82,129,.06)}
        html[data-ech-prerender="non-priority"] .ech-blog-hero__panel img{display:block;width:100%;height:auto;border-radius:1rem}
        html[data-ech-prerender="non-priority"] .ech-blog-hero__caption{grid-column:1/-1;margin:0;padding-top:.15rem;color:#404750;line-height:1.65;font-size:.98rem}
        html[data-ech-prerender="non-priority"] .ech-blog-chips{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1rem}
        html[data-ech-prerender="non-priority"] .ech-blog-chip{display:inline-flex;align-items:center;border-radius:9999px;padding:.45rem .8rem;background:#f0eee7;border:1px solid #e4e2dc;color:#002E47;font-size:.86rem;font-weight:700;text-decoration:none!important}
        html[data-ech-prerender="non-priority"] .ech-blog-layout{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(280px,.8fr);gap:1.5rem;align-items:start;margin-top:1.5rem}
        html[data-ech-prerender="non-priority"] .ech-blog-featured{background:#fff;border:1px solid #e4e2dc;border-radius:1.5rem;padding:1.6rem;box-shadow:0 20px 40px rgba(0,82,129,.06)}
        html[data-ech-prerender="non-priority"] .ech-blog-featured__meta,.ech-blog-list__meta{margin:0 0 .55rem;font-size:.76rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#005281}
        html[data-ech-prerender="non-priority"] .ech-blog-featured h2{margin:0 0 .8rem;font-family:Lexend,'DM Sans',system-ui,sans-serif;font-size:clamp(1.7rem,2.4vw,2.55rem);line-height:1.12;letter-spacing:-.02em;color:#002E47}
        html[data-ech-prerender="non-priority"] .ech-blog-featured p{margin:0 0 1rem;max-width:68ch;line-height:1.75;color:#404750}
        html[data-ech-prerender="non-priority"] .ech-blog-featured a{font-weight:700;color:#005281;text-decoration:none}
        html[data-ech-prerender="non-priority"] .ech-blog-sidebar{position:sticky;top:1rem;display:grid;gap:1rem}
        html[data-ech-prerender="non-priority"] .ech-blog-panel{background:#fff;border:1px solid #e4e2dc;border-radius:1rem;padding:1.2rem;box-shadow:0 16px 34px rgba(0,82,129,.05)}
        html[data-ech-prerender="non-priority"] .ech-blog-panel h2{margin:.15rem 0 .65rem;font-family:Lexend,'DM Sans',system-ui,sans-serif;font-size:1.15rem;line-height:1.25;color:#002E47}
        html[data-ech-prerender="non-priority"] .ech-blog-panel p{margin:0 0 .9rem;line-height:1.65;color:#404750}
        html[data-ech-prerender="non-priority"] .ech-blog-panel ul{margin:0;padding-left:1.05rem;line-height:1.7;color:#404750}
        html[data-ech-prerender="non-priority"] .ech-blog-list{margin:1.25rem 0 0;padding:0;list-style:none;border-top:1px solid #e4e2dc;background:#fff;border:1px solid #e4e2dc;border-radius:1.5rem;overflow:hidden;box-shadow:0 20px 40px rgba(0,82,129,.05)}
        html[data-ech-prerender="non-priority"] .ech-blog-list__item{display:flex;gap:1rem;justify-content:space-between;border-bottom:1px solid #e4e2dc;padding:1.2rem 1.35rem}
        html[data-ech-prerender="non-priority"] .ech-blog-list__item:last-child{border-bottom:0}
        html[data-ech-prerender="non-priority"] .ech-blog-list__item h3{margin:0 0 .45rem;font-family:Lexend,'DM Sans',system-ui,sans-serif;font-size:1.08rem;line-height:1.35;letter-spacing:-.01em}
        html[data-ech-prerender="non-priority"] .ech-blog-list__item h3 a{color:#002E47;text-decoration:none}
        html[data-ech-prerender="non-priority"] .ech-blog-list__item p{margin:0;line-height:1.65;color:#404750;max-width:58ch}
        html[data-ech-prerender="non-priority"] .ech-blog-list__link{white-space:nowrap;align-self:flex-start;color:#005281;font-weight:700;text-decoration:none;padding-top:1.85rem}
        html[data-ech-prerender="non-priority"] .ech-blog-footer{margin-top:1.5rem;padding-top:1.15rem;border-top:1px solid #c0c7d1;display:flex;justify-content:space-between;gap:1rem;align-items:center;color:#404750}
        html[data-ech-prerender="non-priority"] .ech-blog-footer a{color:#005281;font-weight:700;text-decoration:none}
        @media (max-width: 900px){html[data-ech-prerender="non-priority"] .ech-site-nav__wrap,html[data-ech-prerender="non-priority"] .ech-blog-hero{grid-template-columns:1fr;display:grid}html[data-ech-prerender="non-priority"] .ech-site-nav__wrap{gap:.85rem}html[data-ech-prerender="non-priority"] .ech-site-nav{justify-content:flex-start}html[data-ech-prerender="non-priority"] .ech-blog-layout{grid-template-columns:1fr}html[data-ech-prerender="non-priority"] .ech-blog-sidebar{position:static}html[data-ech-prerender="non-priority"] .ech-blog-list__item{flex-direction:column}html[data-ech-prerender="non-priority"] .ech-blog-list__link{padding-top:0}html[data-ech-prerender="non-priority"] .ech-blog-hero__panel{grid-template-columns:1fr}}
        @media (max-width: 640px){html[data-ech-prerender="non-priority"] .ech-prerender{padding:0 .9rem 3rem}html[data-ech-prerender="non-priority"] .ech-site-brand img{width:145px;max-width:52vw}html[data-ech-prerender="non-priority"] .ech-blog-hero h1{max-width:none}html[data-ech-prerender="non-priority"] .ech-blog-list__item{padding:1rem 1rem 1.1rem}html[data-ech-prerender="non-priority"] .ech-blog-footer{flex-direction:column;align-items:flex-start}}
      </style>
      <header class="ech-site-header">
        <div class="ech-site-nav__wrap">
          <a class="ech-site-brand" href="/" aria-label="Elevate Career Hub home">
            <img src="/assets/wp-content/uploads/2024/01/2-1024x474.png" alt="Elevate Career Hub logo" />
          </a>
          <nav class="ech-site-nav" aria-label="Main navigation">
            ${navItems}
          </nav>
          <a class="ech-site-nav__cta" href="/diy-products/">DIY Products</a>
        </div>
      </header>
      <section class="ech-blog-hero" aria-label="Blog hero">
        <div>
          <p class="ech-blog-hero__eyebrow">Blog</p>
          <h1>${htmlEscape(h1)}</h1>
          <p class="ech-blog-hero__summary">${htmlEscape(summary)}</p>
          <div class="ech-blog-hero__actions">
            <a class="ech-blog-hero__button ech-blog-hero__button--primary" href="${htmlEscape(cta.href)}">${htmlEscape(cta.label)}</a>
            <a class="ech-blog-hero__button ech-blog-hero__button--secondary" href="/contact-us/">Contact</a>
          </div>
          <div class="ech-blog-chips" aria-label="Topics">
            <span class="ech-blog-chip">All posts</span>
            <span class="ech-blog-chip">CV &amp; Resume</span>
            <span class="ech-blog-chip">Applications</span>
            <span class="ech-blog-chip">Interview Prep</span>
            <span class="ech-blog-chip">Education</span>
          </div>
        </div>
        <div class="ech-blog-hero__panel">
          <img src="/assets/wp-content/uploads/2024/01/T6-Copy-e1706661330276-683x1024.webp" alt="Smiling professional supported by Elevate Career Hub" />
          <img src="/assets/wp-content/uploads/2024/01/Frame-blue-683x1024.webp" alt="Elevate Career Hub career and education support graphic" />
          <p class="ech-blog-hero__caption">Career and education guidance, presented in the same elevated format as the rest of the site.</p>
        </div>
      </section>
      <section class="ech-blog-layout" aria-label="Blog articles">
        <div>
          ${featuredCard}
          <ul class="ech-blog-list">${listItems}</ul>
        </div>
        <aside class="ech-blog-sidebar">
          <section class="ech-blog-panel">
            <p class="ech-blog-top__eyebrow" style="margin-bottom:.5rem">About this feed</p>
            <h2>Latest articles first</h2>
            <p>Short, useful articles that match the services on the site: CVs, applications, interviews, school choices, and job search strategy.</p>
          </section>
          <section class="ech-blog-panel">
            <p class="ech-blog-top__eyebrow" style="margin-bottom:.5rem">Browse</p>
            <h2>Topics</h2>
            <ul>
              <li>Career growth</li>
              <li>CVs and cover letters</li>
              <li>Interview prep</li>
              <li>School and scholarship applications</li>
            </ul>
          </section>
        </aside>
      </section>
      <section class="ech-blog-footer">
        <div><strong>Need help applying what you read?</strong> Talk to Elevate Career Hub for tailored support.</div>
        <a href="/contact-us/">Contact us</a>
      </section>
    </main></div>`;
  return `<!doctype html>
<html lang="en-US" data-ech-prerender="non-priority">
  <head>
    ${head}
  </head>
  <body>
    ${bodyContent}
  </body>
</html>
`;
}

function buildNonPriorityShell(reactShellHtml, page, seo, pages) {
  if (page.route === '/blog/') return buildBlogShell(reactShellHtml, page, seo, pages);
  const route = page.route;
  const canonical = `${SITE_ORIGIN}${route}`;
  const title = seo.title;
  const description = seo.description;
  const h1 = seo.h1;
  const summary = seo.summary;
  const cta = snapshotPrimaryCta(route);
  const noindex = seo.noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index,follow">';

  // Extract the asset script + stylesheet links from the original Vite shell so SPA hydration still works.
  const assetTags = [];
  const scriptMatches = reactShellHtml.match(/<script\b[^>]*src=["'][^"']+["'][^>]*><\/script>/gi) || [];
  const linkMatches = reactShellHtml.match(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
  assetTags.push(...linkMatches);
  assetTags.push(...scriptMatches);

  const head = [
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `<title>${htmlEscape(title)}</title>`,
    `<meta name="description" content="${htmlEscape(description)}">`,
    noindex,
    `<link rel="canonical" href="${htmlEscape(canonical)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${htmlEscape(title)}">`,
    `<meta property="og:description" content="${htmlEscape(description)}">`,
    `<meta property="og:url" content="${htmlEscape(canonical)}">`,
    `<meta property="og:image" content="${htmlEscape(DEFAULT_OG_IMAGE)}">`,
    `<meta property="og:site_name" content="Elevate Career Hub">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${htmlEscape(title)}">`,
    `<meta name="twitter:description" content="${htmlEscape(description)}">`,
    `<meta name="twitter:image" content="${htmlEscape(DEFAULT_OG_IMAGE)}">`,
    ...assetTags,
  ].join('\n    ');

  // Body content lives inside #root so the page is meaningful before JS runs.
  // React's createRoot.render replaces this on hydration without errors.
  const bodyContent = `<div id="root"><main class="ech-prerender" style="max-width:760px;margin:3rem auto;padding:1.5rem;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1f2937;line-height:1.6;">
      <p style="font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;margin:0 0 0.75rem;">Elevate Career Hub</p>
      <h1 style="font-size:1.85rem;line-height:1.2;margin:0 0 1rem;color:#0f172a;">${htmlEscape(h1)}</h1>
      <p style="margin:0 0 1.5rem;font-size:1.05rem;">${htmlEscape(summary)}</p>
      <p style="margin:0 0 2rem;"><a href="${htmlEscape(cta.href)}" style="display:inline-block;background:#0f766e;color:#ffffff;padding:0.75rem 1.4rem;border-radius:0.5rem;text-decoration:none;font-weight:600;">${htmlEscape(cta.label)}</a></p>
      <nav aria-label="Elevate Career Hub" style="font-size:0.95rem;">
        <p style="margin:0 0 0.5rem;color:#374151;">Explore Elevate Career Hub:</p>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:0.5rem 1.25rem;">
          <li><a href="/" style="color:#0f766e;">Home</a></li>
          <li><a href="/about/" style="color:#0f766e;">About</a></li>
          <li><a href="/career-services/" style="color:#0f766e;">Career Services</a></li>
          <li><a href="/educational-services/" style="color:#0f766e;">Educational Services</a></li>
          <li><a href="/diy-products/" style="color:#0f766e;">DIY Products</a></li>
          <li><a href="/contact-us/" style="color:#0f766e;">Contact</a></li>
        </ul>
      </nav>
    </main></div>`;

  return `<!doctype html>
<html lang="en-US" data-ech-prerender="non-priority">
  <head>
    ${head}
  </head>
  <body>
    ${bodyContent}
  </body>
</html>
`;
}

async function writeIndexForRoute(route, html) {
  const targetDir = outputDirForRoute(route);
  await fs.mkdir(targetDir, { recursive: true, mode: 0o700 });
  await fs.writeFile(path.join(targetDir, 'index.html'), html);
}

async function cleanDistSnapshots() {
  if (!(await pathExists(distRoot))) return;
  for (const file of await walkFiles(distRoot)) {
    if (path.extname(file).toLowerCase() !== '.html') continue;
    await fs.rm(file, { force: true });
  }
}

function routeDecision(page) {
  if (priorityRoutes.has(page.route)) return { behavior: 'serve-static', target: page.route, reason: 'Priority launch route emitted as a direct WordPress source-of-truth static index.html.' };
  if (BLOCKED_COMMERCE_ROUTES.has(page.route)) return { behavior: 'redirect-to-safe-route', target: ASSISTED_COMMERCE_ROUTE, reason: 'Internal WooCommerce/account flow is not in MVP; route is redirected to assisted WhatsApp/email contact.' };
  return { behavior: 'rewrite-to-app', target: page.route, reason: 'Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot.' };
}

async function writeDirectRouteFiles(reactShellHtml, pages) {
  const emitted = [];
  for (const page of pages) {
    const decision = routeDecision(page);
    let html = reactShellHtml;
    if (decision.behavior === 'serve-static') {
      // Priority routes already got their direct static WordPress copy in copyRoute().
      // Leave them alone here.
      continue;
    }
    if (decision.behavior === 'redirect-to-safe-route') {
      html = redirectShell(page.route, decision.target);
    } else {
      // Non-priority migrated route. Pre-render a static shell with route-specific
      // <head> metadata + meaningful <body> content so crawlers and social previews
      // see real, indexable content. SPA hydration still runs (asset tags preserved).
      const seo = NON_PRIORITY_SEO.get(page.route);
      html = seo ? buildNonPriorityShell(reactShellHtml, page, seo, pages) : reactShellHtml;
    }
    await writeIndexForRoute(page.route, html);
    const snapshotDir = path.join(distRoot, 'snapshots');
    await fs.mkdir(snapshotDir, { recursive: true, mode: 0o700 });
    await fs.writeFile(path.join(snapshotDir, `${page.slug}.html`), html);
    emitted.push({ route: page.route, behavior: decision.behavior, target: decision.target });
  }
  return emitted;
}

async function writeStaticHostFallbacks(pages) {
  const lines = [
    '# Elevate Frontend launch routing fallback.',
    '# Direct static index.html files are emitted for all migrated routes; these redirects protect hosts that honor Netlify/Cloudflare Pages-style _redirects.',
  ];
  for (const route of BLOCKED_COMMERCE_ROUTES) lines.push(`${route} ${ASSISTED_COMMERCE_ROUTE} 302!`);
  for (const page of pages) {
    for (const alias of page.aliases || []) lines.push(`${alias} ${page.route} 301!`);
  }
  await fs.writeFile(path.join(distRoot, '_redirects'), `${lines.join('\n')}\n`);
}

async function writeRouteClassification(pages) {
  const rows = pages.map(page => ({
    route: page.route,
    type: page.type,
    title: page.title,
    ...routeDecision(page),
  }));
  const generatedAt = new Date().toISOString();
  const jsonPath = path.join(projectRoot, 'outputs', 'route-launch-classification-20260510.json');
  const mdPath = path.join(projectRoot, 'outputs', 'route-launch-classification-20260510.md');
  await fs.writeFile(jsonPath, JSON.stringify({ generatedAt, totalRoutes: rows.length, routes: rows }, null, 2));
  const md = [
    '# Elevate Frontend Route Launch Classification — 2026-05-10',
    '',
    `Generated: ${generatedAt}`,
    '',
    '| Route | Type | Launch behavior | Target | Decision reason |',
    '|---|---|---|---|---|',
    ...rows.map(row => `| \`${row.route}\` | ${row.type} | ${row.behavior} | \`${row.target}\` | ${row.reason} |`),
    '',
    'Commerce/account rule: `/cart/`, `/checkout/`, `/my-account/`, `/shop/`, and `/manage-profile/` are not public MVP flows. They redirect to `/contact-us/` for assisted commerce.',
  ].join('\n');
  await fs.writeFile(mdPath, md);
  return { jsonPath, mdPath, rows };
}

await fs.mkdir(distRoot, { recursive: true });
const reactShellHtml = await fs.readFile(path.join(distRoot, 'index.html'), 'utf8');
const pages = JSON.parse(await fs.readFile(pagesManifestPath, 'utf8'));
await cleanDistSnapshots();
const copied = [];
for (const route of routes) copied.push(await copyRoute(route));
await writeDirectRouteFiles(reactShellHtml, pages);
await writeStaticHostFallbacks(pages);
const routeClassification = await writeRouteClassification(pages);

await fs.mkdir(path.join(projectRoot, 'outputs'), { recursive: true, mode: 0o700 });
await fs.writeFile(
  path.join(projectRoot, 'outputs', 'wordpress-html-route-map.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), sourceRoot: path.relative(projectRoot, sourceRoot), routes: copied }, null, 2),
);

console.log(`Copied ${copied.length} WordPress HTML source-of-truth routes into dist with visual-preserving normalization only.`);
