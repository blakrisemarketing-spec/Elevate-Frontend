import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import pages from './generated/pages.json';
import './generated/vendor-css.css';
import './styles.css';

interface PageSnapshot {
  id: number;
  type: string;
  route: string;
  aliases: string[];
  originalUrl: string;
  slug: string;
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  dateModified: string;
  htmlPath: string;
}

const snapshots = pages as PageSnapshot[];
const routeMap = new Map<string, PageSnapshot>();
const blockedCommerceRoutes = new Set(['/cart/', '/checkout/', '/my-account/', '/shop/', '/manage-profile/']);
const assistedCommerceTarget = '/contact-us/';
for (const page of snapshots) {
  routeMap.set(page.route, page);
  for (const alias of page.aliases) routeMap.set(alias, page);
}

function normalizeRoute(pathname: string): string {
  let route = pathname.replace(/\/index\.php(?=\/|$)/, '');
  if (!route) route = '/';
  if (!route.includes('.') && !route.endsWith('/')) route += '/';
  return route;
}

function setMeta(name: string, content: string, property = false): void {
  if (!content) return;
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let meta = document.head.querySelector<HTMLMetaElement>(selector);
  if (!meta) {
    meta = document.createElement('meta');
    if (property) meta.setAttribute('property', name);
    else meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function setCanonical(url: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}

function resolveSnapshot(): PageSnapshot {
  const route = normalizeRoute(window.location.pathname);
  const safeRoute = blockedCommerceRoutes.has(route) ? assistedCommerceTarget : route;
  return routeMap.get(safeRoute) || routeMap.get('/')!;
}

function whatsappUrl(message: string): string {
  return `https://wa.me/233531113454?text=${encodeURIComponent(message)}`;
}

function stripLegacyDependencyReferences(html: string): string {
  let out = html;
  out = out.replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (match, attrs: string) => {
    return /type=(['"])application\/ld\+json\1/i.test(attrs) ? match : '';
  });
  out = out.replace(/<link\b[^>]*(?:href|data-href)=(['"])[^'"]*\/wp-content\/(?:plugins|themes)\/[^'"]*\1[^>]*>/gi, '');
  out = out.replace(/<link\b[^>]*(?:href|data-href)=(['"])[^'"]*staging\.elevatecareerhub\.com\/wp-content\/uploads\/elementor\/google-fonts[^'"]*\1[^>]*>/gi, '');
  out = out.replace(/\/\*#\s*sourceURL=[^*]*(?:wp-content\/plugins|wp-content\/themes)[\s\S]*?\*\//gi, '');
  return out;
}

function sanitizeSnapshotCommerce(html: string): string {
  const quotaText = ['Maximum number', 'of entries', 'exceeded.'].join(' ');
  const quotaClass = ['ff_form', 'not_render'].join('_');
  let out = stripLegacyDependencyReferences(html).replaceAll(quotaText, '');
  out = out.replace(new RegExp(quotaClass, 'g'), 'ech-form-replaced');
  out = out.replace(/<a\b[^>]*\bclass=(['"])[^'"]*(?:add_to_cart_button|ajax_add_to_cart)[^'"]*\1[^>]*>[\s\S]*?<\/a>/gi, (anchor) => {
    const label = anchor.match(/aria-label=(['"])(.*?)\1/i)?.[2] || 'this DIY resource';
    const productName = label.replace(/^Add to cart:\s*/i, '').replace(/[“”]/g, '').trim() || 'this DIY resource';
    return `<a class="button ech-assisted-commerce-link" href="${whatsappUrl(`Hello Elevate Career Hub, I would like to purchase or ask about ${productName}.`)}" target="_blank" rel="noopener" aria-label="Message Elevate Career Hub on WhatsApp about ${productName}">Message us to purchase</a>`;
  });
  out = out.replace(/\b(href|action)=(['"])([^'"]*)\2/gi, (match, attr: string, quote: string, rawHref: string) => {
    try {
      const url = new URL(rawHref, window.location.origin);
      const route = normalizeRoute(url.pathname);
      if (blockedCommerceRoutes.has(route)) return `${attr}=${quote}${assistedCommerceTarget}${quote}`;
      if (url.searchParams.has('add-to-cart')) return `${attr}=${quote}${whatsappUrl('Hello Elevate Career Hub, I would like help purchasing a DIY resource.')}${quote}`;
    } catch {
      return match;
    }
    return match;
  });
  return out;
}

function normalizeSnapshotHtml(html: string): string {
  return sanitizeSnapshotCommerce(html);
}

function App(): React.ReactElement {
  const [page, setPage] = useState<PageSnapshot>(() => resolveSnapshot());
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    const route = normalizeRoute(window.location.pathname);
    if (blockedCommerceRoutes.has(route)) window.history.replaceState({}, '', assistedCommerceTarget);
  }, []);

  useEffect(() => {
    const onPop = (): void => setPage(resolveSnapshot());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    let active = true;
    fetch(page.htmlPath)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load page snapshot: ${page.htmlPath}`);
        return response.text();
      })
      .then((text) => { if (active) setHtml(normalizeSnapshotHtml(text)); })
      .catch(() => { if (active) setHtml('<section class="snapshot-error"><h1>Page unavailable</h1><p>This migrated page snapshot could not be loaded.</p></section>'); });
    return () => { active = false; };
  }, [page]);

  useEffect(() => {
    document.title = page.title || 'Elevate Career Hub';
    setMeta('description', page.description || 'Elevate Career Hub');
    setMeta('og:title', page.title, true);
    setMeta('og:description', page.description, true);
    setMeta('og:url', `${window.location.origin}${page.route}`, true);
    if (page.ogImage) setMeta('og:image', page.ogImage, true);
    setCanonical(`${window.location.origin}${page.route}`);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [page]);

  useEffect(() => {
    const counters = document.querySelectorAll<HTMLElement>('.elementor-counter-number[data-to-value]');
    counters.forEach((counter) => {
      const value = counter.dataset.toValue;
      if (!value) return;
      const numeric = Number(value.replace(/,/g, ''));
      counter.textContent = Number.isFinite(numeric) ? numeric.toLocaleString('en-US') : value;
      counter.setAttribute('aria-label', counter.textContent || value);
    });
  }, [html]);

  const routes = useMemo(() => snapshots.map((snapshot) => snapshot.route), []);

  function navigate(path: string): void {
    const route = normalizeRoute(path);
    const safeRoute = blockedCommerceRoutes.has(route) ? assistedCommerceTarget : route;
    const next = routeMap.get(safeRoute) || routeMap.get(path);
    if (!next) {
      window.location.href = path;
      return;
    }
    window.history.pushState({}, '', next.route);
    setPage(next);
  }

  function setMenuOpen(toggleEl: HTMLElement, open?: boolean): void {
    const scope = toggleEl.closest('.ekit-wid-con, .hfe-nav-menu, .elementor-widget-container, header, footer, nav') as HTMLElement | null;
    const menuRoot = scope ?? document;
    const menuContainers = Array.from(menuRoot.querySelectorAll<HTMLElement>('.elementskit-menu-container.elementskit-menu-offcanvas-elements, .hfe-nav-menu__layout-vertical'));
    const toggleButtons = Array.from(menuRoot.querySelectorAll<HTMLElement>('.elementskit-menu-hamburger, .elementskit-menu-toggler, .hfe-nav-menu__toggle'));
    if (!menuContainers.length) return;

    const nextOpen = open ?? !menuContainers.some((menu) => menu.classList.contains('snapshot-menu-open'));

    menuContainers.forEach((menu) => {
      menu.classList.toggle('snapshot-menu-open', nextOpen);
      menu.setAttribute('aria-hidden', nextOpen ? 'false' : 'true');
      if (nextOpen) {
        menu.style.visibility = 'visible';
        menu.style.opacity = '1';
        menu.style.pointerEvents = 'auto';
        if (menu.classList.contains('elementskit-menu-container')) {
          menu.style.left = 'auto';
          menu.style.right = '0px';
          menu.style.transform = 'translateX(0)';
        } else {
          menu.style.left = '0px';
          menu.style.transform = 'translateX(0)';
        }
      } else {
        menu.style.visibility = '';
        menu.style.opacity = '';
        menu.style.pointerEvents = '';
        menu.style.left = '';
        menu.style.right = '';
        menu.style.transform = '';
      }
    });

    toggleButtons.forEach((button) => {
      button.classList.toggle('snapshot-menu-open', nextOpen);
      button.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
    });
  }

  function setAccordionState(card: HTMLElement, open: boolean): void {
    const accordion = card.closest('.elementskit-accordion');
    if (!accordion) return;

    const cards = Array.from(accordion.querySelectorAll<HTMLElement>('.elementskit-card'));
    cards.forEach((item) => {
      const header = item.querySelector<HTMLElement>('.elementskit-card-header');
      const toggler = item.querySelector<HTMLElement>('.elementskit-btn-link');
      const panel = item.querySelector<HTMLElement>('.elementskit-card-body')?.closest<HTMLElement>('.collapse');
      const isTarget = item === card;
      const isOpen = isTarget ? open : false;

      item.classList.toggle('active', isOpen);
      header?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggler?.classList.toggle('collapsed', !isOpen);
      toggler?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      panel?.classList.toggle('show', isOpen);
      panel?.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    });
  }

  useEffect(() => {
    const handleToggleActivate = (event: Event): void => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>('.elementskit-menu-hamburger, .elementskit-menu-toggler, .hfe-nav-menu__toggle')
        : null;
      if (!target) return;
      if (event.type === 'pointerup' && event instanceof PointerEvent && event.button !== 0) return;
      if (event.type === 'keydown' && event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      setMenuOpen(target);
    };

    const accordionHeaders = Array.from(document.querySelectorAll<HTMLElement>('.elementskit-accordion .elementskit-card-header'));
    const handleAccordionActivate = (event: MouseEvent | KeyboardEvent): void => {
      if (event.type === 'keydown' && event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return;
      if (event.type === 'click' && event instanceof MouseEvent && event.button !== 0) return;
      const header = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
      if (!header) return;
      const card = header.closest<HTMLElement>('.elementskit-card');
      if (!card) return;
      const toggler = header.querySelector<HTMLElement>('.elementskit-btn-link');
      const isOpen = card.classList.contains('active') || toggler?.getAttribute('aria-expanded') === 'true';
      event.preventDefault();
      event.stopPropagation();
      setAccordionState(card, !isOpen);
    };

    accordionHeaders.forEach((header) => {
      header.setAttribute('role', 'button');
      if (!header.hasAttribute('tabindex')) header.setAttribute('tabindex', '0');
      header.addEventListener('click', handleAccordionActivate as EventListener);
      header.addEventListener('keydown', handleAccordionActivate as EventListener);
    });

    document.addEventListener('pointerup', handleToggleActivate);
    document.addEventListener('keydown', handleToggleActivate);
    return () => {
      document.removeEventListener('pointerup', handleToggleActivate);
      document.removeEventListener('keydown', handleToggleActivate);
      accordionHeaders.forEach((header) => {
        header.removeEventListener('click', handleAccordionActivate as EventListener);
        header.removeEventListener('keydown', handleAccordionActivate as EventListener);
      });
    };
  }, [html]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent): void => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.includes('wa.me') || href.startsWith('javascript:')) return;
      try {
        const url = new URL(href, window.location.origin);
        const isLocal = url.origin === window.location.origin || url.hostname === 'elevatecareerhub.com';
        if (!isLocal) return;
        const currentRoute = normalizeRoute(window.location.pathname);
        const routeOnly = normalizeRoute(url.pathname);
        if (url.hash && routeOnly === currentRoute) {
          event.preventDefault();
          return;
        }
        const routeWithHash = routeOnly + url.hash;
        const next = routeMap.get(routeWithHash) || routeMap.get(routeOnly);
        if (next) {
          event.preventDefault();
          navigate(next.route);
          return;
        }
      } catch {
        return;
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [routes]);

  const routeClass = `route-${page.slug.replace(/[^a-z0-9-]/gi, '-')}`;

  return (
    <div className={`snapshot-shell design-system-shell ${routeClass}`} data-route={page.route}>
      <a className="skip-link" href="#content">Skip to content</a>
      <main id="content" className="design-system-content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
