/**
 * Regional pricing, browser side.
 *
 * Prices differ by region (see catalog.ts). The browser does NOT get to decide
 * which region it is in: it asks /api/price-quote.php, which resolves the
 * region from the request IP and returns both the price and an HMAC-signed
 * quote token. That token is what verify-payment.php trusts, so a tampered
 * client can neither pick a cheaper region nor under-pay.
 *
 * The static HTML already contains every region's price with only the Ghana
 * one revealed (see priority/components/Price.tsx). All this module does for
 * display is set `data-region` on <html> and let CSS uncover the right one.
 */
import { PRICE_REGIONS, formatPrice, toPriceRegion } from './catalog';
import type { PriceRegion } from './catalog';

const QUOTE_ENDPOINT = '/api/price-quote.php';
/** Remembered so a repeat visitor's correct price paints in the first frame. */
export const REGION_STORAGE_KEY = 'ech_region';

export interface QuotedPrice {
  chargePesewas: number;
  displayMinor: number;
  /** Signed token; verify-payment.php will not accept a payment without it. */
  quote: string;
}

let region: PriceRegion = 'GH';
let quotes: Record<string, QuotedPrice> = {};
let inflight: Promise<boolean> | null = null;

export function currentRegion(): PriceRegion {
  return region;
}

export function quoteFor(serviceId: string): QuotedPrice | undefined {
  return quotes[serviceId];
}

/** Format an amount the way the current region's buyer expects to see it. */
export function formatForRegion(displayMinor: number): string {
  return formatPrice(displayMinor, region);
}

function readCachedRegion(): PriceRegion | null {
  try {
    const stored = window.localStorage.getItem(REGION_STORAGE_KEY);
    return stored && (PRICE_REGIONS as readonly string[]).includes(stored)
      ? (stored as PriceRegion)
      : null;
  } catch {
    return null; // Private mode / storage disabled. Not worth failing over.
  }
}

function applyRegion(next: PriceRegion): void {
  region = next;
  document.documentElement.setAttribute('data-region', next);
  try {
    window.localStorage.setItem(REGION_STORAGE_KEY, next);
  } catch {
    /* Storage is a nicety here; the region still applies for this page view. */
  }
}

/** Every catalog id this page needs a price for. */
function idsOnPage(): string[] {
  const ids = new Set<string>();
  document.querySelectorAll<HTMLElement>('[data-price]').forEach((el) => {
    const id = el.dataset.price;
    if (id) ids.add(id);
  });
  document.querySelectorAll<HTMLElement>('[data-service-id]').forEach((el) => {
    const id = el.dataset.serviceId;
    if (id) ids.add(id);
  });
  return Array.from(ids);
}

/**
 * Fetch prices + quotes for this page. Memoised: one request per page load,
 * shared by the initial render and by any buy button clicked afterwards.
 * Resolves false when pricing could not be established, which callers must
 * treat as "cannot take a payment" rather than falling back to a price.
 */
export function loadPricing(): Promise<boolean> {
  if (inflight) return inflight;

  const ids = idsOnPage();
  if (ids.length === 0) return Promise.resolve(true);

  // Paint the last known region immediately; the response corrects it if the
  // visitor has moved. Without this a returning buyer sees Ghana prices flash.
  const cached = readCachedRegion();
  if (cached) applyRegion(cached);

  let tz = '';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    /* Timezone is only ever a tiebreak server-side; fine to omit. */
  }

  inflight = fetch(QUOTE_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids, tz }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data || data.ok !== true || typeof data.items !== 'object') return false;
      quotes = data.items as Record<string, QuotedPrice>;
      applyRegion(toPriceRegion(data.region));
      return true;
    })
    .catch(() => false);

  return inflight;
}
