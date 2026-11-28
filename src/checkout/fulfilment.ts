/**
 * Fulfilment templates: what tracked work a purchase creates.
 *
 * Every catalog item maps to one or more work components. A component becomes
 * one engagement (a card on the admin Work board and a row in the client
 * portal), with its step checklist taken from the component's family. Bundles
 * expand into several components so each piece is tracked on its own.
 *
 * Emitted at build time into dist/api/fulfilment.json and read by PHP
 * (api/ops-store.php). Categories mirror ech_service_category() in
 * supabase/migrations/005_platform_2027.sql.
 */
import { CATALOG } from './catalog';

export type WorkFamily =
  | 'cv'
  | 'cover_letter'
  | 'linkedin'
  | 'session'
  | 'school_selection'
  | 'essay'
  | 'references'
  | 'applications'
  | 'job_search'
  | 'digital'
  | 'event'
  | 'custom';

export type FamilyTemplate = { label: string; turnaroundDays: number; steps: string[] };

export const FAMILIES: Record<WorkFamily, FamilyTemplate> = {
  cv: { label: 'CV', turnaroundDays: 5, steps: ['Brief and current CV received', 'Discovery call', 'First draft', 'Client review', 'Revisions', 'Final CV delivered'] },
  cover_letter: { label: 'Cover letter', turnaroundDays: 4, steps: ['Target role and brief received', 'First draft', 'Client review', 'Final letter delivered'] },
  linkedin: { label: 'LinkedIn', turnaroundDays: 5, steps: ['Profile brief received', 'Profile audit', 'Headline, About and Experience rewritten', 'Client review', 'Changes live on profile'] },
  session: { label: '1-on-1 session', turnaroundDays: 14, steps: ['Session scheduled', 'Prep notes ready', 'Session held', 'Follow-up notes sent'] },
  school_selection: { label: 'School selection', turnaroundDays: 7, steps: ['Profile and funding goals intake', 'Programme research', 'Shortlist shared with client', 'Final school list agreed'] },
  essay: { label: 'Essay / SOP', turnaroundDays: 7, steps: ['Brief and questionnaire received', 'Outline agreed', 'First draft', 'Client review', 'Final essay delivered'] },
  references: { label: 'Reference letters', turnaroundDays: 10, steps: ['Referee details gathered', 'Drafts written', 'Client review', 'Final drafts delivered'] },
  applications: { label: 'Applications', turnaroundDays: 120, steps: ['Application tracker set up', 'Documents gathered', 'Applications reviewed', 'Applications submitted', 'Decisions tracked'] },
  job_search: { label: 'Job search', turnaroundDays: 60, steps: ['Target roles and markets agreed', 'Job tracker set up', 'Applications sent', 'Interviews in progress', 'Outcome'] },
  digital: { label: 'Digital product', turnaroundDays: 0, steps: ['Download sent'] },
  event: { label: 'Event', turnaroundDays: 30, steps: ['Ticket confirmed', 'Sessions attended', 'Recordings and resources sent'] },
  custom: { label: 'Custom work', turnaroundDays: 7, steps: ['Brief received', 'In progress', 'Delivered'] },
};

export type WorkComponent = { key: string; family: WorkFamily; title: string };

const one = (family: WorkFamily, title: string, key: string = family): WorkComponent => ({ key, family, title });

/** Explicit component lists for multi-part items. Single items are derived below. */
const COMPONENTS: Record<string, WorkComponent[]> = {
  'bundle-starter': [one('cv', 'CV'), one('cover_letter', 'Cover letter'), one('linkedin', 'LinkedIn makeover')],
  'bundle-accelerator': [
    one('cv', 'CV'), one('cover_letter', 'Cover letter'), one('linkedin', 'LinkedIn makeover'),
    one('session', 'Career consultation', 'consultation'), one('session', 'Interview prep session', 'interview_prep'),
  ],
  'bundle-premium': [
    one('cv', '3 tailored CVs'), one('cover_letter', '3 cover letters'), one('linkedin', 'LinkedIn makeover'),
    one('session', '3 career consultations', 'consultation'), one('session', '3 interview prep sessions', 'interview_prep'),
    one('job_search', 'Job search tracker'),
  ],
  'bundle-comprehensive': [
    one('cv', '5 tailored CVs'), one('cover_letter', '5 cover letters'), one('linkedin', 'LinkedIn makeover'),
    one('session', '5 career consultations', 'consultation'), one('session', '5 interview prep sessions', 'interview_prep'),
    one('job_search', 'Job search tracker'),
  ],
  'edu-bundle-strategic': [
    one('school_selection', 'Curated school list'), one('cv', 'Grad school CV'),
    one('essay', 'Personal statement'), one('session', 'Strategy session'),
  ],
  'edu-bundle-silver-general': [
    one('school_selection', 'Recommended schools list'), one('cv', 'Grad school CV(s)'),
    one('essay', '4 personal statements + scholarship essays'), one('references', '8 reference letter drafts'),
    one('session', '4 strategy sessions'), one('linkedin', 'LinkedIn optimisation'),
    one('applications', 'Application review and tracking'),
  ],
  'edu-bundle-silver-mba': [
    one('school_selection', 'Recommended schools list'), one('cv', 'Grad school CV(s)'),
    one('essay', '4 SOPs / research proposals + all essays'), one('references', '8 reference letter drafts'),
    one('session', '4 sessions incl. interview prep'), one('linkedin', 'LinkedIn optimisation'),
    one('applications', 'Application review and tracking'),
  ],
  'edu-bundle-gold': [
    one('school_selection', 'Recommended schools list'), one('cv', 'Grad school CV(s)'),
    one('essay', '4 personal statements + all essays'), one('references', '8 reference letter drafts'),
    one('linkedin', 'LinkedIn optimisation'), one('session', 'Interview preparation'),
    one('applications', 'Full applications done for you'),
  ],
};

function familyFor(id: string): WorkFamily {
  if (id.startsWith('diy-')) return 'digital';
  if (id.startsWith('bootcamp-')) return 'event';
  if (id.includes('-cv-')) return 'cv';
  if (id.includes('cover-letter')) return 'cover_letter';
  if (id.endsWith('linkedin')) return 'linkedin';
  if (id.includes('interview-prep') || id.includes('consultation')) return 'session';
  if (id.includes('school-selection')) return 'school_selection';
  if (id.includes('essay')) return 'essay';
  return 'custom';
}

export type ServiceCategory = 'career_services' | 'career_bundles' | 'grad_services' | 'grad_bundles' | 'diy_products' | 'events' | 'other';

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  career_services: 'Career services',
  career_bundles: 'Career bundles',
  grad_services: 'Grad school services',
  grad_bundles: 'Grad school bundles',
  diy_products: 'DIY products',
  events: 'Events and bootcamps',
  other: 'Other',
};

export function categoryFor(id: string): ServiceCategory {
  if (id.startsWith('career-')) return 'career_services';
  if (id.startsWith('bundle-')) return 'career_bundles';
  if (id.startsWith('edu-bundle-')) return 'grad_bundles';
  if (id.startsWith('edu-')) return 'grad_services';
  if (id.startsWith('diy-')) return 'diy_products';
  if (id.startsWith('bootcamp-')) return 'events';
  return 'other';
}

export function componentsFor(id: string): WorkComponent[] {
  if (COMPONENTS[id]) return COMPONENTS[id];
  const item = CATALOG[id];
  const family = familyFor(id);
  return [{ key: family, family, title: item ? item.name : id }];
}

/** The JSON shape PHP reads (dist/api/fulfilment.json). */
export function fulfilmentConfig() {
  const services: Record<string, { name: string; category: ServiceCategory; amountPesewas: number; components: WorkComponent[] }> = {};
  for (const [id, item] of Object.entries(CATALOG)) {
    services[id] = { name: item.name, category: categoryFor(id), amountPesewas: item.amountPesewas, components: componentsFor(id) };
  }
  return { families: FAMILIES, categories: CATEGORY_LABELS, services };
}
