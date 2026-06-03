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
  // ── Career services (à la carte) ──────────────────────────────
  'career-cv': { id: 'career-cv', name: 'Curriculum Vitae (CV)', amountPesewas: 35000, type: 'service' },
  'career-cover-letter': { id: 'career-cover-letter', name: 'Cover Letter', amountPesewas: 30000, type: 'service' },
  'career-linkedin': { id: 'career-linkedin', name: 'LinkedIn Optimization', amountPesewas: 38000, type: 'service' },
  'career-interview-prep': { id: 'career-interview-prep', name: '1-on-1 Interview Preparation Session', amountPesewas: 45000, type: 'service' },

  // ── Career bundles ────────────────────────────────────────────
  'bundle-bronze': { id: 'bundle-bronze', name: 'Bronze Career Bundle', amountPesewas: 180000, type: 'service' },
  'bundle-silver': { id: 'bundle-silver', name: 'Silver Career Bundle', amountPesewas: 300000, type: 'service' },
  'bundle-gold': { id: 'bundle-gold', name: 'Gold Career Bundle', amountPesewas: 420000, type: 'service' },

  // ── Educational services (à la carte) ─────────────────────────
  'edu-grad-cv': { id: 'edu-grad-cv', name: 'Grad School CV', amountPesewas: 35000, type: 'service' },
  'edu-reference-letter': { id: 'edu-reference-letter', name: 'Reference Letter Draft', amountPesewas: 30000, type: 'service' },
  'edu-linkedin': { id: 'edu-linkedin', name: 'LinkedIn Optimization', amountPesewas: 38000, type: 'service' },
  'edu-school-suggestion': { id: 'edu-school-suggestion', name: 'Suggestion of Schools', amountPesewas: 40000, type: 'service' },
  'edu-interview-prep': { id: 'edu-interview-prep', name: '1-on-1 Interview Preparation Session', amountPesewas: 45000, type: 'service' },
  'edu-sop-500': { id: 'edu-sop-500', name: 'Statement of Purpose / Scholarship Essay (500 words)', amountPesewas: 47000, type: 'service' },
  'edu-sop-1000': { id: 'edu-sop-1000', name: 'Statement of Purpose / Scholarship Essay (1000 words)', amountPesewas: 75000, type: 'service' },

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
