/**
 * Service & product catalog — the SINGLE SOURCE OF TRUTH for prices.
 *
 * `amountPesewas` is the authoritative price. The serverless verify function
 * checks the amount Paystack reports against THIS table, so a tampered
 * client-side amount can never under-pay for an item. The client only uses
 * this for display; it must never be trusted for the charged amount.
 *
 * Amounts are in pesewas (GHS * 100), matching Paystack's smallest-unit
 * convention. Currency is GHS throughout.
 */

export type CatalogItemType = 'service' | 'product';

export interface CatalogItem {
  /** Stable id used in data-service-id, metadata, and verification. */
  id: string;
  /** Display name shown to the buyer and in emails. */
  name: string;
  /** Authoritative price in pesewas (e.g. ₵350 -> 35000). */
  amountPesewas: number;
  type: CatalogItemType;
  /** Short line shown under the price / in the confirmation. */
  blurb?: string;
  /**
   * For digital products only: path (under /public) to the deliverable file.
   * The buyer receives a link to this after a verified payment. Omit for
   * services (which are fulfilled manually by the team).
   */
  deliverablePath?: string;
}

export const CURRENCY = 'GHS' as const;

export const CATALOG: Record<string, CatalogItem> = {
  // ── Career Flex Services (à la carte) ─────────────────────────
  // CV is tiered by career stage (feedback: Career Services tab).
  'career-cv-early': { id: 'career-cv-early', name: 'CV — Early Career (0–3 yrs)', amountPesewas: 35000, type: 'service' },
  'career-cv-experienced': { id: 'career-cv-experienced', name: 'CV — Experienced Professional (3–10 yrs)', amountPesewas: 40000, type: 'service' },
  'career-cv-senior': { id: 'career-cv-senior', name: 'CV — Senior Executive (10+ yrs)', amountPesewas: 45000, type: 'service' },
  'career-cover-letter-local': { id: 'career-cover-letter-local', name: 'Cover Letter — Local Applications', amountPesewas: 35000, type: 'service' },
  'career-cover-letter-intl': { id: 'career-cover-letter-intl', name: 'Cover Letter — International Applications', amountPesewas: 40000, type: 'service' },
  'career-linkedin': { id: 'career-linkedin', name: 'LinkedIn Optimisation', amountPesewas: 40000, type: 'service' },
  'career-interview-prep': { id: 'career-interview-prep', name: '1-on-1 Interview Preparation', amountPesewas: 50000, type: 'service' },

  // ── Career Bundles ────────────────────────────────────────────
  'bundle-starter': { id: 'bundle-starter', name: 'Starter Bundle', amountPesewas: 110000, type: 'service' },
  'bundle-accelerator': { id: 'bundle-accelerator', name: 'Job Market Accelerator Bundle', amountPesewas: 200000, type: 'service' },
  'bundle-premium': { id: 'bundle-premium', name: 'Premium Job Search Bundle', amountPesewas: 500000, type: 'service' },
  'bundle-comprehensive': { id: 'bundle-comprehensive', name: 'Comprehensive Job Search Bundle', amountPesewas: 825000, type: 'service' },

  // ── Grad School Flex Services (à la carte) ────────────────────
  'edu-grad-cv-early': { id: 'edu-grad-cv-early', name: 'Grad School CV — Early Career (0–3 yrs)', amountPesewas: 35000, type: 'service' },
  'edu-grad-cv-experienced': { id: 'edu-grad-cv-experienced', name: 'Grad School CV — Experienced (3–10 yrs)', amountPesewas: 40000, type: 'service' },
  'edu-grad-cv-senior': { id: 'edu-grad-cv-senior', name: 'Grad School CV — Senior Executive (10+ yrs)', amountPesewas: 45000, type: 'service' },
  'edu-linkedin': { id: 'edu-linkedin', name: 'LinkedIn Optimisation', amountPesewas: 40000, type: 'service' },
  'edu-school-selection': { id: 'edu-school-selection', name: 'School Selection & Programme Research', amountPesewas: 50000, type: 'service' },
  'edu-essay-500': { id: 'edu-essay-500', name: 'Personal Statement / SOP / Scholarship Essay (up to 500 words)', amountPesewas: 52000, type: 'service' },
  'edu-essay-1000': { id: 'edu-essay-1000', name: 'Personal Statement / SOP / Scholarship Essay (up to 1,000 words)', amountPesewas: 85000, type: 'service' },
  'edu-consultation': { id: 'edu-consultation', name: '1-on-1 Consultation & Interview Prep (per session)', amountPesewas: 50000, type: 'service' },

  // ── Grad School Bundles ───────────────────────────────────────
  'edu-bundle-strategic': { id: 'edu-bundle-strategic', name: 'Strategic Bundle', amountPesewas: 180000, type: 'service' },
  'edu-bundle-silver-general': { id: 'edu-bundle-silver-general', name: 'Silver Bundle — Masters / Taught Programmes', amountPesewas: 900000, type: 'service' },
  'edu-bundle-silver-mba': { id: 'edu-bundle-silver-mba', name: 'Silver Bundle — MBA / MFA / MRes', amountPesewas: 1200000, type: 'service' },
  'edu-bundle-gold': { id: 'edu-bundle-gold', name: 'Gold Bundle', amountPesewas: 1400000, type: 'service' },

  // ── DIY digital products (auto-delivered) ─────────────────────
  'diy-job-magnet-linkedin': { id: 'diy-job-magnet-linkedin', name: 'Becoming a Job Magnet on LinkedIn', amountPesewas: 19900, type: 'product' },
  'diy-grad-school-bundle': { id: 'diy-grad-school-bundle', name: 'Complete Grad School Bundle', amountPesewas: 25000, type: 'product' },
  'diy-resume-that-lands': { id: 'diy-resume-that-lands', name: 'How to Write the Resume that Lands the Interview', amountPesewas: 19900, type: 'product' },
  'diy-uk-job-hunting': { id: 'diy-uk-job-hunting', name: 'Mastering the Art of Job Hunting in the UK', amountPesewas: 19900, type: 'product' },
  'diy-nailing-interviews': { id: 'diy-nailing-interviews', name: 'Nailing Your Job Interviews', amountPesewas: 19900, type: 'product' },
  'diy-remote-job-playbook': {
    id: 'diy-remote-job-playbook',
    name: 'Remote Job Playbook',
    amountPesewas: 7500,
    type: 'product',
    deliverablePath: '/downloads/the-remote-job-playbook.pdf',
  },
  'diy-complete-job-search': { id: 'diy-complete-job-search', name: 'The Complete Job Search Bundle', amountPesewas: 25000, type: 'product' },

  // ── Events ────────────────────────────────────────────────────
  // Get Into Grad School Bootcamp (Jul–Aug 2026). Full pass is the early-bird
  // price (regular GHS 1,500 shown struck through on the landing page).
  'bootcamp-grad-full': { id: 'bootcamp-grad-full', name: 'Get Into Grad School Bootcamp — Full Access Pass (Early Bird)', amountPesewas: 120000, type: 'service', blurb: 'All 8 live sessions + bonuses + recordings' },
  'bootcamp-grad-dropin': { id: 'bootcamp-grad-dropin', name: 'Get Into Grad School Bootcamp — Single Drop-In Session', amountPesewas: 30000, type: 'service', blurb: 'One session of your choice' },
};

/** Look up an item; returns undefined for unknown ids (caller must reject). */
export function getCatalogItem(id: string): CatalogItem | undefined {
  return Object.prototype.hasOwnProperty.call(CATALOG, id) ? CATALOG[id] : undefined;
}

/** Format pesewas as a Ghana cedi display string, e.g. 35000 -> "₵350". */
export function formatCedis(amountPesewas: number): string {
  const cedis = amountPesewas / 100;
  return `₵${cedis.toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
