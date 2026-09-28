/**
 * Service & product catalog, the SINGLE SOURCE OF TRUTH for prices.
 *
 * Prices are REGIONAL: the same item costs a different amount depending on
 * where the buyer is. Two numbers are authored per region:
 *
 *   chargePesewas  what Paystack actually bills, always in GHS pesewas
 *   displayMinor   what the buyer is shown, in the region's display currency
 *
 * They are separate because Paystack's collection currency is fixed by the
 * merchant's country, and this is a GHANA-registered account, so Paystack can
 * only ever collect GHS. (Paystack supports GHS / NGN / KES / ZAR / XOF / USD
 * by country; GBP and EUR are not supported at all, and a Ghana account cannot
 * collect USD or NGN.) So a US buyer sees "$50" and is charged the cedi
 * equivalent we set; their bank does the conversion. The UI always discloses
 * the cedi amount alongside a converted price, see components/Price.tsx.
 *
 * The `GH` entry is required and is the fallback for any region left unset.
 * Falling back to GH is deliberate: an unresolved visitor is UNDER-charged,
 * never over-charged.
 *
 * SECURITY: the client never decides which region it is in. api/price-quote.php
 * resolves the region from the request IP and returns an HMAC-signed quote;
 * api/verify-payment.php recomputes the expected amount from that signature
 * alone. This table is the price source both sides agree on, but a tampered
 * client can neither pick its own region nor under-pay.
 */

export type CatalogItemType = 'service' | 'product';

/** Pricing regions, in display order. `GH` is the base region. */
export const PRICE_REGIONS = ['GH', 'NG', 'AF', 'UK', 'EU', 'INTL'] as const;
export type PriceRegion = (typeof PRICE_REGIONS)[number];

export interface RegionMeta {
  /** ISO code of the currency the buyer is SHOWN. */
  currency: string;
  symbol: string;
  locale: string;
  /** Decimals to show. Naira amounts are large, so we show none. */
  decimals: number;
  /** Human label, used in the region switcher and the disclosure line. */
  label: string;
}

export const REGIONS: Record<PriceRegion, RegionMeta> = {
  GH: { currency: 'GHS', symbol: '₵', locale: 'en-GH', decimals: 2, label: 'Ghana' },
  NG: { currency: 'NGN', symbol: '₦', locale: 'en-NG', decimals: 0, label: 'Nigeria' },
  AF: { currency: 'USD', symbol: '$', locale: 'en-US', decimals: 2, label: 'Africa' },
  UK: { currency: 'GBP', symbol: '£', locale: 'en-GB', decimals: 2, label: 'United Kingdom' },
  EU: { currency: 'EUR', symbol: '€', locale: 'en-IE', decimals: 2, label: 'Europe' },
  INTL: { currency: 'USD', symbol: '$', locale: 'en-US', decimals: 2, label: 'International' },
};

/** The currency Paystack actually charges in. Not the display currency. */
export const CHARGE_CURRENCY = 'GHS' as const;
/** @deprecated Use CHARGE_CURRENCY. Kept so existing imports keep compiling. */
export const CURRENCY = CHARGE_CURRENCY;

export interface RegionPrice {
  /** What Paystack bills, in GHS pesewas (₵350 -> 35000). */
  chargePesewas: number;
  /** What the buyer sees, in the display currency's minor unit ($50 -> 5000). */
  displayMinor: number;
}

/** GH is required; every other region falls back to it when omitted. */
export type PriceTable = { GH: RegionPrice } & Partial<Record<PriceRegion, RegionPrice>>;

export interface CatalogItem {
  /** Stable id used in data-service-id, metadata, and verification. */
  id: string;
  /** Display name shown to the buyer and in emails. */
  name: string;
  /** Authoritative regional price table. */
  prices: PriceTable;
  type: CatalogItemType;
  /** Short line shown under the price / in the confirmation. */
  blurb?: string;
  /**
   * For digital products only: path (under /public) to the deliverable file.
   * The buyer receives a link to this after a verified payment. Omit for
   * services (which are fulfilled manually by the team).
   */
  deliverablePath?: string;
  /**
   * Per-unit ("pick how many") items: the selectable options. When present,
   * checkout shows a checklist, the buyer ticks one or more, and the charged
   * amount is `chargePesewas * (number ticked)` for the buyer's region. The
   * server re-validates that each submitted option is in this list and
   * recomputes the expected amount from the SIGNED per-unit price, so a
   * tampered client can never under-pay. Used by the bootcamp drop-in.
   */
  sessions?: string[];
}

/**
 * ── How the non-GH prices below were seeded ──────────────────────────
 * GH is each item's real, unchanged cedi price. The other regions were
 * generated once from this ladder and are now plain literals: edit any
 * number directly, nothing recomputes it.
 *
 *   NG   x1.00 charge (same cedi price, shown in naira)
 *   AF   x1.30    UK / EU / INTL   x1.75
 *
 * Seeding reference rates were ₵12/$1, ₵16/£1, ₵14/€1, ₦103/₵1. The DISPLAY
 * number was rounded to a clean price point first, then the cedi charge was
 * back-solved from it, so the two never look inconsistent to a buyer.
 *
 * These rates are NOT live. When the cedi moves materially, revisit the
 * converted regions: the cedi charge is what actually gets billed, so a stale
 * table over- or under-charges foreign buyers rather than breaking anything.
 */
export const CATALOG: Record<string, CatalogItem> = {
  // ── Career Flex Services (à la carte) ─────────────────────────
  // CV is tiered by career stage (feedback: Career Services tab).
  'career-cv-early': {
    id: 'career-cv-early', name: 'CV, Early Career (0–3 yrs)', type: 'service',
    prices: { GH: { chargePesewas: 35000, displayMinor: 35000 }, NG: { chargePesewas: 35000, displayMinor: 3600000 }, AF: { chargePesewas: 48000, displayMinor: 4000 }, UK: { chargePesewas: 64000, displayMinor: 4000 }, EU: { chargePesewas: 63000, displayMinor: 4500 }, INTL: { chargePesewas: 60000, displayMinor: 5000 } },
  },
  'career-cv-experienced': {
    id: 'career-cv-experienced', name: 'CV, Experienced Professional (3–10 yrs)', type: 'service',
    prices: { GH: { chargePesewas: 40000, displayMinor: 40000 }, NG: { chargePesewas: 40000, displayMinor: 4100000 }, AF: { chargePesewas: 54000, displayMinor: 4500 }, UK: { chargePesewas: 72000, displayMinor: 4500 }, EU: { chargePesewas: 70000, displayMinor: 5000 }, INTL: { chargePesewas: 72000, displayMinor: 6000 } },
  },
  'career-cv-senior': {
    id: 'career-cv-senior', name: 'CV, Senior Executive (10+ yrs)', type: 'service',
    prices: { GH: { chargePesewas: 45000, displayMinor: 45000 }, NG: { chargePesewas: 45000, displayMinor: 4600000 }, AF: { chargePesewas: 60000, displayMinor: 5000 }, UK: { chargePesewas: 80000, displayMinor: 5000 }, EU: { chargePesewas: 77000, displayMinor: 5500 }, INTL: { chargePesewas: 78000, displayMinor: 6500 } },
  },
  'career-cover-letter-local': {
    id: 'career-cover-letter-local', name: 'Cover Letter, Local Applications', type: 'service',
    prices: { GH: { chargePesewas: 35000, displayMinor: 35000 }, NG: { chargePesewas: 35000, displayMinor: 3600000 }, AF: { chargePesewas: 48000, displayMinor: 4000 }, UK: { chargePesewas: 64000, displayMinor: 4000 }, EU: { chargePesewas: 63000, displayMinor: 4500 }, INTL: { chargePesewas: 60000, displayMinor: 5000 } },
  },
  'career-cover-letter-intl': {
    id: 'career-cover-letter-intl', name: 'Cover Letter, International Applications', type: 'service',
    prices: { GH: { chargePesewas: 40000, displayMinor: 40000 }, NG: { chargePesewas: 40000, displayMinor: 4100000 }, AF: { chargePesewas: 54000, displayMinor: 4500 }, UK: { chargePesewas: 72000, displayMinor: 4500 }, EU: { chargePesewas: 70000, displayMinor: 5000 }, INTL: { chargePesewas: 72000, displayMinor: 6000 } },
  },
  'career-linkedin': {
    id: 'career-linkedin', name: 'LinkedIn Optimisation', type: 'service',
    prices: { GH: { chargePesewas: 40000, displayMinor: 40000 }, NG: { chargePesewas: 40000, displayMinor: 4100000 }, AF: { chargePesewas: 54000, displayMinor: 4500 }, UK: { chargePesewas: 72000, displayMinor: 4500 }, EU: { chargePesewas: 70000, displayMinor: 5000 }, INTL: { chargePesewas: 72000, displayMinor: 6000 } },
  },
  'career-interview-prep': {
    id: 'career-interview-prep', name: '1-on-1 Interview Preparation', type: 'service',
    prices: { GH: { chargePesewas: 50000, displayMinor: 50000 }, NG: { chargePesewas: 50000, displayMinor: 5200000 }, AF: { chargePesewas: 66000, displayMinor: 5500 }, UK: { chargePesewas: 88000, displayMinor: 5500 }, EU: { chargePesewas: 91000, displayMinor: 6500 }, INTL: { chargePesewas: 90000, displayMinor: 7500 } },
  },

  // ── Career Bundles ────────────────────────────────────────────
  'bundle-starter': {
    id: 'bundle-starter', name: 'Starter Bundle', type: 'service',
    prices: { GH: { chargePesewas: 110000, displayMinor: 110000 }, NG: { chargePesewas: 110000, displayMinor: 11500000 }, AF: { chargePesewas: 144000, displayMinor: 12000 }, UK: { chargePesewas: 192000, displayMinor: 12000 }, EU: { chargePesewas: 196000, displayMinor: 14000 }, INTL: { chargePesewas: 192000, displayMinor: 16000 } },
  },
  'bundle-accelerator': {
    id: 'bundle-accelerator', name: 'Job Market Accelerator Bundle', type: 'service',
    prices: { GH: { chargePesewas: 200000, displayMinor: 200000 }, NG: { chargePesewas: 200000, displayMinor: 20500000 }, AF: { chargePesewas: 264000, displayMinor: 22000 }, UK: { chargePesewas: 352000, displayMinor: 22000 }, EU: { chargePesewas: 350000, displayMinor: 25000 }, INTL: { chargePesewas: 348000, displayMinor: 29000 } },
  },
  'bundle-premium': {
    id: 'bundle-premium', name: 'Premium Job Search Bundle', type: 'service',
    prices: { GH: { chargePesewas: 500000, displayMinor: 500000 }, NG: { chargePesewas: 500000, displayMinor: 51500000 }, AF: { chargePesewas: 660000, displayMinor: 55000 }, UK: { chargePesewas: 880000, displayMinor: 55000 }, EU: { chargePesewas: 875000, displayMinor: 62500 }, INTL: { chargePesewas: 870000, displayMinor: 72500 } },
  },
  'bundle-comprehensive': {
    id: 'bundle-comprehensive', name: 'Comprehensive Job Search Bundle', type: 'service',
    prices: { GH: { chargePesewas: 825000, displayMinor: 825000 }, NG: { chargePesewas: 825000, displayMinor: 85000000 }, AF: { chargePesewas: 1080000, displayMinor: 90000 }, UK: { chargePesewas: 1440000, displayMinor: 90000 }, EU: { chargePesewas: 1435000, displayMinor: 102500 }, INTL: { chargePesewas: 1440000, displayMinor: 120000 } },
  },

  // ── Grad School Flex Services (à la carte) ────────────────────
  'edu-grad-cv-early': {
    id: 'edu-grad-cv-early', name: 'Grad School CV, Early Career (0–3 yrs)', type: 'service',
    prices: { GH: { chargePesewas: 35000, displayMinor: 35000 }, NG: { chargePesewas: 35000, displayMinor: 3600000 }, AF: { chargePesewas: 48000, displayMinor: 4000 }, UK: { chargePesewas: 64000, displayMinor: 4000 }, EU: { chargePesewas: 63000, displayMinor: 4500 }, INTL: { chargePesewas: 60000, displayMinor: 5000 } },
  },
  'edu-grad-cv-experienced': {
    id: 'edu-grad-cv-experienced', name: 'Grad School CV, Experienced (3–10 yrs)', type: 'service',
    prices: { GH: { chargePesewas: 40000, displayMinor: 40000 }, NG: { chargePesewas: 40000, displayMinor: 4100000 }, AF: { chargePesewas: 54000, displayMinor: 4500 }, UK: { chargePesewas: 72000, displayMinor: 4500 }, EU: { chargePesewas: 70000, displayMinor: 5000 }, INTL: { chargePesewas: 72000, displayMinor: 6000 } },
  },
  'edu-grad-cv-senior': {
    id: 'edu-grad-cv-senior', name: 'Grad School CV, Senior Executive (10+ yrs)', type: 'service',
    prices: { GH: { chargePesewas: 45000, displayMinor: 45000 }, NG: { chargePesewas: 45000, displayMinor: 4600000 }, AF: { chargePesewas: 60000, displayMinor: 5000 }, UK: { chargePesewas: 80000, displayMinor: 5000 }, EU: { chargePesewas: 77000, displayMinor: 5500 }, INTL: { chargePesewas: 78000, displayMinor: 6500 } },
  },
  'edu-linkedin': {
    id: 'edu-linkedin', name: 'LinkedIn Optimisation', type: 'service',
    prices: { GH: { chargePesewas: 40000, displayMinor: 40000 }, NG: { chargePesewas: 40000, displayMinor: 4100000 }, AF: { chargePesewas: 54000, displayMinor: 4500 }, UK: { chargePesewas: 72000, displayMinor: 4500 }, EU: { chargePesewas: 70000, displayMinor: 5000 }, INTL: { chargePesewas: 72000, displayMinor: 6000 } },
  },
  'edu-school-selection': {
    id: 'edu-school-selection', name: 'School Selection & Programme Research', type: 'service',
    prices: { GH: { chargePesewas: 50000, displayMinor: 50000 }, NG: { chargePesewas: 50000, displayMinor: 5200000 }, AF: { chargePesewas: 66000, displayMinor: 5500 }, UK: { chargePesewas: 88000, displayMinor: 5500 }, EU: { chargePesewas: 91000, displayMinor: 6500 }, INTL: { chargePesewas: 90000, displayMinor: 7500 } },
  },
  'edu-essay-500': {
    id: 'edu-essay-500', name: 'Personal Statement / SOP / Scholarship Essay (up to 500 words)', type: 'service',
    prices: { GH: { chargePesewas: 52000, displayMinor: 52000 }, NG: { chargePesewas: 52000, displayMinor: 5400000 }, AF: { chargePesewas: 66000, displayMinor: 5500 }, UK: { chargePesewas: 88000, displayMinor: 5500 }, EU: { chargePesewas: 91000, displayMinor: 6500 }, INTL: { chargePesewas: 90000, displayMinor: 7500 } },
  },
  'edu-essay-1000': {
    id: 'edu-essay-1000', name: 'Personal Statement / SOP / Scholarship Essay (up to 1,000 words)', type: 'service',
    prices: { GH: { chargePesewas: 85000, displayMinor: 85000 }, NG: { chargePesewas: 85000, displayMinor: 8800000 }, AF: { chargePesewas: 108000, displayMinor: 9000 }, UK: { chargePesewas: 152000, displayMinor: 9500 }, EU: { chargePesewas: 154000, displayMinor: 11000 }, INTL: { chargePesewas: 144000, displayMinor: 12000 } },
  },
  'edu-consultation': {
    id: 'edu-consultation', name: '1-on-1 Consultation & Interview Prep (per session)', type: 'service',
    prices: { GH: { chargePesewas: 50000, displayMinor: 50000 }, NG: { chargePesewas: 50000, displayMinor: 5200000 }, AF: { chargePesewas: 66000, displayMinor: 5500 }, UK: { chargePesewas: 88000, displayMinor: 5500 }, EU: { chargePesewas: 91000, displayMinor: 6500 }, INTL: { chargePesewas: 90000, displayMinor: 7500 } },
  },

  // ── Grad School Bundles ───────────────────────────────────────
  'edu-bundle-strategic': {
    id: 'edu-bundle-strategic', name: 'Strategic Bundle', type: 'service',
    prices: { GH: { chargePesewas: 180000, displayMinor: 180000 }, NG: { chargePesewas: 180000, displayMinor: 18500000 }, AF: { chargePesewas: 240000, displayMinor: 20000 }, UK: { chargePesewas: 320000, displayMinor: 20000 }, EU: { chargePesewas: 322000, displayMinor: 23000 }, INTL: { chargePesewas: 312000, displayMinor: 26000 } },
  },
  'edu-bundle-silver-general': {
    id: 'edu-bundle-silver-general', name: 'Silver Bundle, Masters / Taught Programmes', type: 'service',
    prices: { GH: { chargePesewas: 900000, displayMinor: 900000 }, NG: { chargePesewas: 900000, displayMinor: 92500000 }, AF: { chargePesewas: 1170000, displayMinor: 97500 }, UK: { chargePesewas: 1560000, displayMinor: 97500 }, EU: { chargePesewas: 1575000, displayMinor: 112500 }, INTL: { chargePesewas: 1590000, displayMinor: 132500 } },
  },
  'edu-bundle-silver-mba': {
    id: 'edu-bundle-silver-mba', name: 'Silver Bundle, MBA / MFA / MRes', type: 'service',
    prices: { GH: { chargePesewas: 1200000, displayMinor: 1200000 }, NG: { chargePesewas: 1200000, displayMinor: 123500000 }, AF: { chargePesewas: 1560000, displayMinor: 130000 }, UK: { chargePesewas: 2120000, displayMinor: 132500 }, EU: { chargePesewas: 2100000, displayMinor: 150000 }, INTL: { chargePesewas: 2100000, displayMinor: 175000 } },
  },
  'edu-bundle-gold': {
    id: 'edu-bundle-gold', name: 'Gold Bundle', type: 'service',
    prices: { GH: { chargePesewas: 1400000, displayMinor: 1400000 }, NG: { chargePesewas: 1400000, displayMinor: 144000000 }, AF: { chargePesewas: 1830000, displayMinor: 152500 }, UK: { chargePesewas: 2440000, displayMinor: 152500 }, EU: { chargePesewas: 2450000, displayMinor: 175000 }, INTL: { chargePesewas: 2460000, displayMinor: 205000 } },
  },

  // ── DIY digital products (auto-delivered) ─────────────────────
  'diy-job-magnet-linkedin': {
    id: 'diy-job-magnet-linkedin', name: 'Becoming a Job Magnet on LinkedIn', type: 'product',
    prices: { GH: { chargePesewas: 19900, displayMinor: 19900 }, NG: { chargePesewas: 19900, displayMinor: 2000000 }, AF: { chargePesewas: 24000, displayMinor: 2000 }, UK: { chargePesewas: 32000, displayMinor: 2000 }, EU: { chargePesewas: 35000, displayMinor: 2500 }, INTL: { chargePesewas: 36000, displayMinor: 3000 } },
  },
  'diy-grad-school-bundle': {
    id: 'diy-grad-school-bundle', name: 'Complete Grad School Bundle', type: 'product',
    prices: { GH: { chargePesewas: 25000, displayMinor: 25000 }, NG: { chargePesewas: 25000, displayMinor: 2600000 }, AF: { chargePesewas: 30000, displayMinor: 2500 }, UK: { chargePesewas: 40000, displayMinor: 2500 }, EU: { chargePesewas: 42000, displayMinor: 3000 }, INTL: { chargePesewas: 42000, displayMinor: 3500 } },
  },
  'diy-resume-that-lands': {
    id: 'diy-resume-that-lands', name: 'How to Write the Resume that Lands the Interview', type: 'product',
    prices: { GH: { chargePesewas: 19900, displayMinor: 19900 }, NG: { chargePesewas: 19900, displayMinor: 2000000 }, AF: { chargePesewas: 24000, displayMinor: 2000 }, UK: { chargePesewas: 32000, displayMinor: 2000 }, EU: { chargePesewas: 35000, displayMinor: 2500 }, INTL: { chargePesewas: 36000, displayMinor: 3000 } },
  },
  'diy-uk-job-hunting': {
    id: 'diy-uk-job-hunting', name: 'Mastering the Art of Job Hunting in the UK', type: 'product',
    prices: { GH: { chargePesewas: 19900, displayMinor: 19900 }, NG: { chargePesewas: 19900, displayMinor: 2000000 }, AF: { chargePesewas: 24000, displayMinor: 2000 }, UK: { chargePesewas: 32000, displayMinor: 2000 }, EU: { chargePesewas: 35000, displayMinor: 2500 }, INTL: { chargePesewas: 36000, displayMinor: 3000 } },
  },
  'diy-nailing-interviews': {
    id: 'diy-nailing-interviews', name: 'Nailing Your Job Interviews', type: 'product',
    prices: { GH: { chargePesewas: 19900, displayMinor: 19900 }, NG: { chargePesewas: 19900, displayMinor: 2000000 }, AF: { chargePesewas: 24000, displayMinor: 2000 }, UK: { chargePesewas: 32000, displayMinor: 2000 }, EU: { chargePesewas: 35000, displayMinor: 2500 }, INTL: { chargePesewas: 36000, displayMinor: 3000 } },
  },
  'diy-remote-job-playbook': {
    id: 'diy-remote-job-playbook', name: 'Remote Job Playbook', type: 'product',
    deliverablePath: '/downloads/the-remote-job-playbook.pdf',
    prices: { GH: { chargePesewas: 7500, displayMinor: 7500 }, NG: { chargePesewas: 7500, displayMinor: 800000 }, AF: { chargePesewas: 12000, displayMinor: 1000 }, UK: { chargePesewas: 16000, displayMinor: 1000 }, EU: { chargePesewas: 14000, displayMinor: 1000 }, INTL: { chargePesewas: 12000, displayMinor: 1000 } },
  },
  'diy-complete-job-search': {
    id: 'diy-complete-job-search', name: 'The Complete Job Search Bundle', type: 'product',
    prices: { GH: { chargePesewas: 25000, displayMinor: 25000 }, NG: { chargePesewas: 25000, displayMinor: 2600000 }, AF: { chargePesewas: 30000, displayMinor: 2500 }, UK: { chargePesewas: 40000, displayMinor: 2500 }, EU: { chargePesewas: 42000, displayMinor: 3000 }, INTL: { chargePesewas: 42000, displayMinor: 3500 } },
  },

  // ── Events ────────────────────────────────────────────────────
  // Get Into Grad School Bootcamp (Jul–Aug 2026). Full pass standard price.
  'bootcamp-grad-full': {
    id: 'bootcamp-grad-full', name: 'Get Into Grad School Bootcamp, Full Access Pass', type: 'service',
    blurb: 'All 8 live sessions + bonuses + recordings',
    prices: { GH: { chargePesewas: 150000, displayMinor: 150000 }, NG: { chargePesewas: 150000, displayMinor: 15500000 }, AF: { chargePesewas: 192000, displayMinor: 16000 }, UK: { chargePesewas: 256000, displayMinor: 16000 }, EU: { chargePesewas: 266000, displayMinor: 19000 }, INTL: { chargePesewas: 264000, displayMinor: 22000 } },
  },
  'bootcamp-grad-dropin': {
    id: 'bootcamp-grad-dropin',
    name: 'Get Into Grad School Bootcamp, Drop-In Sessions',
    type: 'service',
    blurb: 'The sessions of your choice',
    // Per session ticked, in every region.
    prices: { GH: { chargePesewas: 30000, displayMinor: 30000 }, NG: { chargePesewas: 30000, displayMinor: 3100000 }, AF: { chargePesewas: 42000, displayMinor: 3500 }, UK: { chargePesewas: 56000, displayMinor: 3500 }, EU: { chargePesewas: 56000, displayMinor: 4000 }, INTL: { chargePesewas: 54000, displayMinor: 4500 } },
    sessions: [
      'Your Graduate School Game Plan - July 26',
      'Becoming the Candidate Admissions Committees Cannot Overlook - 28 July',
      'The MBA Blueprint - 2 August',
      'Personal Statements & Scholarship Essays - 4 August',
      'Research Proposals, Pitching to Supervisors & Getting Funded - 9 August',
      'Landing a Graduate Assistantship - 11 August',
      'Deep Dive on Scholarships - 16 August',
      'Visas & Getting Ready for School - 18 August',
    ],
  },
};

/** Look up an item; returns undefined for unknown ids (caller must reject). */
export function getCatalogItem(id: string): CatalogItem | undefined {
  return Object.prototype.hasOwnProperty.call(CATALOG, id) ? CATALOG[id] : undefined;
}

/** Narrow an arbitrary string to a known region, defaulting to the GH base. */
export function toPriceRegion(value: string | null | undefined): PriceRegion {
  return (PRICE_REGIONS as readonly string[]).includes(value ?? '')
    ? (value as PriceRegion)
    : 'GH';
}

/**
 * The price for an item in a region, falling back to GH when that region has
 * no entry. Mirrored by ech_price_for() in api/pricing.php, so keep the
 * fallback rule identical on both sides.
 */
export function resolvePrice(item: CatalogItem, region: PriceRegion): RegionPrice {
  return item.prices[region] ?? item.prices.GH;
}

/** Format a minor-unit amount in a region's display currency, e.g. "$50". */
export function formatPrice(displayMinor: number, region: PriceRegion): string {
  const meta = REGIONS[region];
  const major = displayMinor / 100;
  return `${meta.symbol}${major.toLocaleString(meta.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: meta.decimals,
  })}`;
}

/** Format pesewas as a Ghana cedi string, e.g. 35000 -> "₵350". */
export function formatCedis(amountPesewas: number): string {
  return formatPrice(amountPesewas, 'GH');
}
