/**
 * Grad School Match, data + scoring engine.
 *
 * Pure, framework-free module shared by:
 *   - the client island (src/match/MatchTool.tsx) for the instant, in-browser match
 *   - the build (scripts/build-priority-routes.mjs) which emits id -> {name, blurb}
 *     into dist/api/match-config.json so api/quiz-lead.php can build the email
 *     report from matched ids (the client cannot spoof the email content).
 *
 * Matching is a transparent, attribute-based fit score (0..100), not a boolean
 * filter: every program/scholarship is described by structured attributes
 * (regions, fields, degrees, class bar, experience, funding, tags) and scored
 * against the visitor's answers. Results are ranked by fit, split into "strong"
 * vs "stretch" tiers, and carry plain-language "why this fits you" reasons.
 *
 * It is a marketing tool, not an admissions oracle: it always returns an
 * encouraging, plausible shortlist and routes the visitor to the bootcamp.
 * Every scholarship named here is real; blurbs stay general (no invented
 * amounts or deadlines) per the brand rule against fabrication.
 *
 * Brand voice: the Insider Friend, warm and a little funny. No em dashes.
 */

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue>;
export type Tier = 'strong' | 'stretch';

export interface MatchOption {
  value: string;
  label: string;
}

export interface MatchQuestion {
  id: string;
  section: string;
  prompt: string;
  help?: string;
  type: 'single' | 'multi';
  options: MatchOption[];
  /**
   * When the selected single-choice value === specify.value, the tool reveals a
   * free-text box (stored under `${id}_other`) instead of auto-advancing, so the
   * visitor can tell us what they actually mean.
   */
  specify?: { value: string; placeholder: string };
}

/** Structured attributes every scorable item carries. */
export interface Scorable {
  /** Destination codes it serves (uk/us/canada/europe/australia/africa), or ['any']. */
  regions: string[];
  /** Fields it suits (business/stem/health/social/law/arts), or ['any']. */
  fields: string[];
  /** Degree levels (taught/research/mba/phd), or ['any']. */
  degrees: string[];
  /** Class needed for a comfortable fit. Lower user class => "stretch" tier. */
  minClass: 'first' | '2:1' | '2:2' | 'third' | 'any';
  /** Work experience it rewards. */
  idealExp: 'none' | 'some' | 'experienced' | 'any';
  /** Funding needs it serves (full/partial/self-partly/flexible). */
  funding: string[];
  /** Bonus signals: africa, research, assistantship, development, affordable, leadership, women. */
  tags: string[];
  /** Small prior, used only as a tie-breaker between equal scores. */
  weight: number;
}

export interface ProgramPathway extends Scorable {
  id: string;
  name: string;
  category: string;
  blurb: string;
  /** Bootcamp session that most directly de-risks this pathway. */
  bootcampSession?: string;
}

export interface Scholarship extends Scorable {
  id: string;
  name: string;
  region: string; // display label
  fundingType: string; // display label
  blurb: string;
}

export interface ScoredPathway extends ProgramPathway {
  score: number;
  tier: Tier;
  reasons: string[];
}
export interface ScoredScholarship extends Scholarship {
  score: number;
  tier: Tier;
  reasons: string[];
}

export interface MatchResult {
  pathways: ScoredPathway[];
  scholarships: ScoredScholarship[];
}

// ── Answer accessors ────────────────────────────────────────────────────────
function pick(a: Answers, id: string): string | undefined {
  const v = a[id];
  return Array.isArray(v) ? v[0] : v;
}
function destinations(a: Answers): string[] {
  const v = a.destinations;
  return Array.isArray(v) ? v : v ? [v] : [];
}

// ── Questions (one-tap; warm, low-friction; the values feed the matcher) ─────
export const QUESTIONS: MatchQuestion[] = [
  {
    id: 'degree',
    section: 'Your goal',
    prompt: 'What are you actually going for?',
    type: 'single',
    options: [
      { value: 'taught', label: 'A taught master’s' },
      { value: 'research', label: 'A research master’s (the thesis kind)' },
      { value: 'mba', label: 'An MBA' },
      { value: 'phd', label: 'A full PhD' },
      { value: 'unsure', label: 'Honestly, I’m still deciding' },
    ],
  },
  {
    id: 'field',
    section: 'Your goal',
    prompt: 'Which world is your thing?',
    type: 'single',
    specify: { value: 'other', placeholder: 'Tell us your field' },
    options: [
      { value: 'business', label: 'Business or management' },
      { value: 'stem', label: 'STEM or engineering' },
      { value: 'health', label: 'Health or medicine' },
      { value: 'social', label: 'Social sciences or humanities' },
      { value: 'law', label: 'Law' },
      { value: 'arts', label: 'Arts or design' },
      { value: 'other', label: 'Something else (tell us)' },
    ],
  },
  {
    id: 'reason',
    section: 'Your goal',
    prompt: 'Be honest, what is this really about?',
    help: 'No wrong answer here. This is what we build your whole report around.',
    type: 'single',
    options: [
      { value: 'career-switch', label: 'Switching into a whole new career' },
      { value: 'promotion', label: 'Leveling up where I already am' },
      { value: 'research-career', label: 'Building a research or academic career' },
      { value: 'immigration', label: 'Moving and building a life abroad' },
      { value: 'prestige', label: 'A world-class school on my CV' },
    ],
  },
  {
    id: 'country',
    section: 'Your background',
    prompt: 'Where are you plotting all this from?',
    type: 'single',
    options: [
      { value: 'ghana', label: 'Ghana' },
      { value: 'nigeria', label: 'Nigeria' },
      { value: 'kenya', label: 'Kenya' },
      { value: 'other-africa', label: 'Somewhere else in Africa' },
      { value: 'other', label: 'Outside Africa' },
    ],
  },
  {
    id: 'qualification',
    section: 'Your background',
    prompt: 'How did your last degree end?',
    help: 'No judgment, promise. A lower grade just changes the game plan, it does not end it.',
    type: 'single',
    options: [
      { value: 'first', label: 'First class or distinction' },
      { value: '2:1', label: 'Second upper (2:1)' },
      { value: '2:2', label: 'Second lower (2:2)' },
      { value: 'third', label: 'Third or pass' },
      { value: 'studying', label: 'Still in school' },
    ],
  },
  {
    id: 'experience',
    section: 'Your background',
    prompt: 'How much full-time work experience do you have?',
    type: 'single',
    options: [
      { value: '0', label: 'None yet, and that’s fine' },
      { value: '1-2', label: '1 to 2 years' },
      { value: '3-5', label: '3 to 5 years' },
      { value: '5+', label: 'More than 5 years' },
    ],
  },
  {
    id: 'english',
    section: 'Tests and readiness',
    prompt: 'IELTS or TOEFL, where are you?',
    type: 'single',
    options: [
      { value: 'have', label: 'Done, I’ve got a score' },
      { value: 'booked', label: 'Booked, not sat it yet' },
      { value: 'not-yet', label: 'Haven’t started' },
      { value: 'exempt', label: 'Native or exempt' },
    ],
  },
  {
    id: 'gre',
    section: 'Tests and readiness',
    prompt: 'And the GRE or GMAT?',
    type: 'single',
    options: [
      { value: 'have', label: 'Done, I’ve got a score' },
      { value: 'booked', label: 'Booked, not sat it yet' },
      { value: 'not-yet', label: 'Haven’t started' },
      { value: 'not-required', label: 'Not needed for my plan' },
    ],
  },
  {
    id: 'destinations',
    section: 'Destination and funding',
    prompt: 'Where do you want to wake up?',
    help: 'Tick all that tempt you. The more open you are, the more money tends to be on the table.',
    type: 'multi',
    options: [
      { value: 'uk', label: 'United Kingdom' },
      { value: 'us', label: 'United States' },
      { value: 'canada', label: 'Canada' },
      { value: 'europe', label: 'Europe (not the UK)' },
      { value: 'australia', label: 'Australia' },
      { value: 'africa', label: 'Within Africa' },
      { value: 'open', label: 'Surprise me, I’m open' },
    ],
  },
  {
    id: 'funding',
    section: 'Destination and funding',
    prompt: 'Real talk, how is this getting paid for?',
    type: 'single',
    options: [
      { value: 'full', label: 'I need full funding' },
      { value: 'partial', label: 'I need partial funding' },
      { value: 'self-partly', label: 'I can cover part of it myself' },
      { value: 'flexible', label: 'Flexible, depends on the offer' },
    ],
  },
  {
    id: 'budget',
    section: 'Destination and funding',
    prompt: 'What can you put toward tuition yourself each year?',
    type: 'single',
    options: [
      { value: 'under-5k', label: '$0 and a lot of prayers' },
      { value: '5-15k', label: '$5,000 to $15,000' },
      { value: '15-30k', label: '$15,000 to $30,000' },
      { value: '30k+', label: 'More than $30,000' },
    ],
  },
  {
    id: 'timeline',
    section: 'Timeline and blocker',
    prompt: 'When do you want to start?',
    type: 'single',
    options: [
      { value: 'lt6', label: 'Next intake, I’m ready (within 6 months)' },
      { value: 'this-year', label: 'Later this year' },
      { value: 'next-year', label: 'Next year' },
      { value: 'exploring', label: 'Just window shopping for now' },
    ],
  },
  {
    id: 'blocker',
    section: 'Timeline and blocker',
    prompt: 'What is the one thing stressing you out most?',
    help: 'Tell us where it hurts. That is exactly where we point you next.',
    type: 'single',
    options: [
      { value: 'funding', label: 'Finding the money and scholarships' },
      { value: 'essays', label: 'Writing essays and statements' },
      { value: 'school-selection', label: 'Picking the right schools' },
      { value: 'low-gpa', label: 'My grades feel too low' },
      { value: 'visa', label: 'Visas and the whole moving process' },
      { value: 'start', label: 'Honestly, I don’t know where to start' },
    ],
  },
];

// ── Scoring ─────────────────────────────────────────────────────────────────
const CLASS_RANK: Record<string, number> = { first: 4, '2:1': 3, '2:2': 2, third: 1, studying: 3 };
const MIN_CLASS_RANK: Record<string, number> = { first: 4, '2:1': 3, '2:2': 2, third: 1, any: 0 };
const REGION_LABEL: Record<string, string> = {
  uk: 'the UK', us: 'the US', canada: 'Canada', europe: 'Europe', australia: 'Australia', africa: 'Africa',
};
const FIELD_LABEL: Record<string, string> = {
  business: 'business', stem: 'STEM', health: 'health', social: 'social science', law: 'law', arts: 'arts', other: 'field',
};
const MIN_SCORE = 45;

function expMatches(ideal: string, exp: string): boolean {
  if (ideal === 'any') return true;
  if (ideal === 'none') return exp === '0' || exp === '1-2';
  if (ideal === 'some') return exp === '1-2' || exp === '3-5';
  if (ideal === 'experienced') return exp === '3-5' || exp === '5+';
  return false;
}

function fundingReason(uf: string): string {
  if (uf === 'full') return 'Built for people who need full funding';
  if (uf === 'partial') return 'Covers a real chunk of the cost';
  if (uf === 'self-partly') return 'Tops up what you can put in yourself';
  return '';
}

function matchedRegionLabel(item: Scorable, a: Answers): string | null {
  const dests = destinations(a);
  for (const r of ['uk', 'us', 'canada', 'europe', 'australia', 'africa']) {
    if (item.regions.includes(r) && dests.includes(r)) return REGION_LABEL[r];
  }
  return null;
}

/** Score one item against the answers. Returns null when it is simply not relevant (wrong region). */
function scoreItem(item: Scorable, a: Answers): { score: number; tier: Tier; reasons: string[] } | null {
  const dests = destinations(a);
  const open = dests.includes('open') || dests.length === 0;
  const regionAny = item.regions.includes('any');
  const regionHit = regionAny || open || item.regions.some((r) => dests.includes(r));
  if (!regionHit) return null;

  const reasons: string[] = [];
  let score = 30; // region baseline (it cleared the location gate)
  let mismatch = false; // a hard field/degree mismatch caps the item at "stretch"
  const rl = matchedRegionLabel(item, a);
  if (rl) reasons.push(`Lines up with your plan to study in ${rl}`);

  // Funding fit (max 20)
  const uf = pick(a, 'funding');
  if (uf && item.funding.includes(uf)) {
    score += 20;
    const fr = fundingReason(uf);
    if (fr) reasons.push(fr);
  } else if (uf === 'flexible') {
    score += 12;
  } else {
    score += 4;
  }

  // Field fit (+15 match, -12 hard mismatch; neutral when 'any' on either side)
  const field = pick(a, 'field');
  if (item.fields.includes('any') || !field || field === 'other') {
    score += item.fields.includes('any') ? 8 : 0;
  } else if (item.fields.includes(field)) {
    score += 15;
    reasons.push(`Right in your ${FIELD_LABEL[field] || 'field'} lane`);
  } else {
    score -= 12;
    mismatch = true;
  }

  // Degree fit (+10 match, -16 hard mismatch; 'unsure' never penalized)
  const deg = pick(a, 'degree');
  if (item.degrees.includes('any') || !deg || deg === 'unsure' || item.degrees.includes(deg)) {
    score += 10;
  } else {
    score -= 16;
    mismatch = true;
  }

  // Class fit (max 15) and tier signal
  const ucr = CLASS_RANK[pick(a, 'qualification') || 'studying'] ?? 3;
  const need = MIN_CLASS_RANK[item.minClass] ?? 0;
  if (ucr >= need) {
    score += 15;
    if (need >= 3) reasons.push('Your academic record clears the bar');
  } else if (need - ucr === 1) {
    score += 7;
    reasons.push('A reach worth taking, the bootcamp shows you how to position your profile');
  } else {
    score += 3;
  }

  // Experience fit (max 5)
  const exp = pick(a, 'experience');
  if (item.idealExp === 'any') {
    score += 3;
  } else if (exp && expMatches(item.idealExp, exp)) {
    score += 5;
    if (item.idealExp === 'experienced') reasons.push('Your work experience is exactly what they look for');
  }

  // Tag bonuses (max 8)
  const country = pick(a, 'country');
  const reason = pick(a, 'reason');
  const budget = pick(a, 'budget');
  const inAfrica = country === 'ghana' || country === 'nigeria' || country === 'kenya' || country === 'other-africa';
  let tagBonus = 0;
  if (item.tags.includes('africa') && inAfrica) { tagBonus += 4; reasons.push('Created with applicants from Africa in mind'); }
  if (item.tags.includes('research') && (deg === 'research' || deg === 'phd' || reason === 'research-career')) { tagBonus += 4; reasons.push('Strong for a research focused path'); }
  if (item.tags.includes('assistantship')) { tagBonus += 3; reasons.push('Taps one of the most underused funding routes'); }
  if (item.tags.includes('affordable') && (uf === 'self-partly' || uf === 'flexible' || budget === 'under-5k' || budget === '5-15k')) { tagBonus += 4; reasons.push('Kind to your budget'); }
  if (item.tags.includes('leadership') && (reason === 'promotion' || reason === 'prestige')) { tagBonus += 2; }
  score += Math.min(tagBonus, 8);

  score = Math.max(0, Math.min(100, Math.round(score)));
  const tier: Tier = mismatch || ucr < need ? 'stretch' : score >= 62 ? 'strong' : 'stretch';
  return { score, tier, reasons: reasons.slice(0, 3) };
}

// ── Program pathways (archetypes, not specific universities) ────────────────
export const PATHWAYS: ProgramPathway[] = [
  {
    id: 'funded-research-masters', name: 'Fully funded research master’s', category: 'Research',
    blurb: 'Thesis-based master’s where supervisors and departments fund strong applicants. Your proposal does the heavy lifting.',
    bootcampSession: 'Research Proposals, Pitching to Supervisors and Getting Funded',
    regions: ['uk', 'us', 'canada', 'europe', 'australia'], fields: ['stem', 'health', 'social', 'business'], degrees: ['research', 'taught'],
    minClass: '2:1', idealExp: 'any', funding: ['full', 'partial'], tags: ['research'], weight: 90,
  },
  {
    id: 'funded-phd-stipend', name: 'Funded PhD with a stipend', category: 'Research',
    blurb: 'Fully funded doctoral places that pay tuition plus a living stipend. Competitive, but very winnable with the right pitch.',
    bootcampSession: 'Research Proposals, Pitching to Supervisors and Getting Funded',
    regions: ['uk', 'us', 'canada', 'europe', 'australia'], fields: ['any'], degrees: ['phd', 'research'],
    minClass: 'first', idealExp: 'any', funding: ['full'], tags: ['research'], weight: 88,
  },
  {
    id: 'direct-phd-funded', name: 'Direct-entry funded PhD', category: 'Research',
    blurb: 'Some systems let you go straight into a funded PhD without a separate master’s. Faster, fully funded, and built around your research idea.',
    bootcampSession: 'Research Proposals, Pitching to Supervisors and Getting Funded',
    regions: ['us', 'canada', 'australia'], fields: ['stem', 'health', 'social'], degrees: ['phd'],
    minClass: 'first', idealExp: 'any', funding: ['full'], tags: ['research'], weight: 76,
  },
  {
    id: 'global-mba', name: 'Global MBA with scholarship support', category: 'Business',
    blurb: 'Top MBA programmes for professionals ready to pivot, with fellowships and need-based aid that bring the cost down.',
    bootcampSession: 'The MBA Blueprint',
    regions: ['uk', 'us', 'canada', 'europe', 'australia'], fields: ['business'], degrees: ['mba'],
    minClass: '2:1', idealExp: 'experienced', funding: ['partial', 'self-partly', 'flexible'], tags: ['leadership'], weight: 85,
  },
  {
    id: 'assistantship-route', name: 'Graduate assistantship route', category: 'Funded study',
    blurb: 'One of the most underused funding routes: teaching or research assistantships that waive tuition and pay you a stipend.',
    bootcampSession: 'Landing a Graduate Assistantship',
    regions: ['us', 'canada'], fields: ['stem', 'social', 'business', 'health'], degrees: ['research', 'taught', 'phd'],
    minClass: '2:1', idealExp: 'any', funding: ['full', 'partial'], tags: ['assistantship', 'research'], weight: 84,
  },
  {
    id: 'fully-funded-uk-masters', name: 'Fully funded UK master’s', category: 'Funded study',
    blurb: 'A one-year UK master’s backed by a full scholarship. Fast, respected, and very fundable with a sharp narrative.',
    bootcampSession: 'Deep Dive on Scholarships',
    regions: ['uk'], fields: ['any'], degrees: ['taught'],
    minClass: '2:1', idealExp: 'some', funding: ['full', 'partial'], tags: ['leadership'], weight: 82,
  },
  {
    id: 'mastercard-scholars-pathway', name: 'Africa-focused scholars programme', category: 'Funded study',
    blurb: 'Fully funded programmes built for African talent, covering tuition, travel, and living costs end to end.',
    bootcampSession: 'Deep Dive on Scholarships',
    regions: ['any'], fields: ['any'], degrees: ['taught', 'research'],
    minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['africa', 'development', 'leadership'], weight: 81,
  },
  {
    id: 'low-tuition-europe', name: 'Low-tuition Europe master’s', category: 'Affordable study',
    blurb: 'Public universities across Europe with low or no tuition for international students. Strong quality, gentle price.',
    bootcampSession: 'Your Graduate School Game Plan',
    regions: ['europe'], fields: ['any'], degrees: ['taught'],
    minClass: '2:2', idealExp: 'any', funding: ['self-partly', 'flexible', 'partial'], tags: ['affordable'], weight: 80,
  },
  {
    id: 'germany-nordics-funded', name: 'Germany and Nordics, low-cost master’s', category: 'Affordable study',
    blurb: 'Germany and the Nordics offer world-class master’s with little or no tuition, plus scholarships on top. Underrated and very doable.',
    bootcampSession: 'Your Graduate School Game Plan',
    regions: ['europe'], fields: ['stem', 'social', 'health', 'business'], degrees: ['taught', 'research'],
    minClass: '2:1', idealExp: 'any', funding: ['self-partly', 'partial', 'full'], tags: ['affordable', 'research'], weight: 79,
  },
  {
    id: 'canada-funded-masters', name: 'Funded master’s in Canada', category: 'Funded study',
    blurb: 'Research master’s in Canada where funding packages and assistantships are part of the offer for strong applicants.',
    bootcampSession: 'Landing a Graduate Assistantship',
    regions: ['canada'], fields: ['stem', 'health', 'social'], degrees: ['research', 'taught'],
    minClass: '2:1', idealExp: 'any', funding: ['full', 'partial'], tags: ['research', 'assistantship'], weight: 79,
  },
  {
    id: 'erasmus-mundus', name: 'Erasmus Mundus joint master’s', category: 'Funded study',
    blurb: 'Study in two or more European countries on a fully funded joint degree, travel and stipend included.',
    bootcampSession: 'Deep Dive on Scholarships',
    regions: ['europe'], fields: ['any'], degrees: ['taught'],
    minClass: '2:1', idealExp: 'any', funding: ['full', 'partial'], tags: ['leadership'], weight: 78,
  },
  {
    id: 'australia-funded', name: 'Funded study in Australia', category: 'Funded study',
    blurb: 'Australian master’s and PhD places with government and university scholarships for international applicants.',
    bootcampSession: 'Deep Dive on Scholarships',
    regions: ['australia'], fields: ['any'], degrees: ['taught', 'research'],
    minClass: '2:1', idealExp: 'any', funding: ['full', 'partial'], tags: ['development'], weight: 70,
  },
  {
    id: 'conversion-switcher', name: 'Conversion master’s for career switchers', category: 'Profile building',
    blurb: 'Built for people moving into a new field: conversion and professional master’s that welcome a different background.',
    bootcampSession: 'Becoming the Candidate Admissions Committees Cannot Overlook',
    regions: ['any'], fields: ['business', 'stem', 'social'], degrees: ['taught'],
    minClass: '2:2', idealExp: 'any', funding: ['self-partly', 'partial', 'flexible'], tags: ['accessible'], weight: 64,
  },
  {
    id: 'pre-masters-pathway', name: 'Pathway and pre-master’s route', category: 'Profile building',
    blurb: 'A bridge for a lower class or a career change: pathway programmes that get you into a strong master’s on merit.',
    bootcampSession: 'Becoming the Candidate Admissions Committees Cannot Overlook',
    regions: ['any'], fields: ['any'], degrees: ['taught'],
    minClass: 'third', idealExp: 'any', funding: ['self-partly', 'partial', 'flexible'], tags: ['accessible'], weight: 60,
  },
  {
    id: 'online-distance', name: 'Online or distance master’s', category: 'Flexible study',
    blurb: 'Earn a respected master’s from a top university without relocating, often part-time and easier on the wallet.',
    bootcampSession: 'Your Graduate School Game Plan',
    regions: ['any'], fields: ['business', 'stem', 'social'], degrees: ['taught'],
    minClass: '2:2', idealExp: 'any', funding: ['self-partly', 'flexible', 'partial'], tags: ['affordable', 'accessible'], weight: 58,
  },
  {
    id: 'self-funded-affordable', name: 'Affordable self-funded master’s', category: 'Affordable study',
    blurb: 'A curated route to respected, low-tuition universities you can fund yourself, often with partial scholarships on top.',
    bootcampSession: 'Your Graduate School Game Plan',
    regions: ['any'], fields: ['any'], degrees: ['taught'],
    minClass: 'any', idealExp: 'any', funding: ['self-partly', 'flexible', 'partial'], tags: ['affordable'], weight: 55,
  },
];

// ── Scholarships (named, real programmes) ────────────────────────────────────
export const SCHOLARSHIPS: Scholarship[] = [
  {
    id: 'chevening', name: 'Chevening Scholarship', region: 'United Kingdom', fundingType: 'Fully funded',
    blurb: 'The UK government’s flagship award for future leaders. One-year master’s, fully funded, built for people with work experience and a clear vision.',
    regions: ['uk'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'some', funding: ['full', 'partial'], tags: ['leadership'], weight: 95,
  },
  {
    id: 'commonwealth', name: 'Commonwealth Scholarship', region: 'United Kingdom', fundingType: 'Fully funded',
    blurb: 'Full funding for master’s and PhD study in the UK for citizens of Commonwealth countries, with a focus on development impact.',
    regions: ['uk'], fields: ['any'], degrees: ['taught', 'research', 'phd'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['development', 'africa'], weight: 90,
  },
  {
    id: 'commonwealth-shared', name: 'Commonwealth Shared Scholarship', region: 'United Kingdom', fundingType: 'Fully funded',
    blurb: 'Full funding for a UK master’s aimed at talented students who could not otherwise afford to study abroad.',
    regions: ['uk'], fields: ['stem', 'health', 'social'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['development', 'africa', 'affordable'], weight: 84,
  },
  {
    id: 'great-scholarships', name: 'GREAT Scholarships', region: 'United Kingdom', fundingType: 'Partial',
    blurb: 'University-matched awards toward a one-year UK master’s, including dedicated awards for several African countries.',
    regions: ['uk'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly'], tags: ['africa'], weight: 66,
  },
  {
    id: 'gates-cambridge', name: 'Gates Cambridge Scholarship', region: 'United Kingdom', fundingType: 'Fully funded',
    blurb: 'Full funding to study at Cambridge for outstanding applicants with a record of leadership and a desire to improve lives.',
    regions: ['uk'], fields: ['any'], degrees: ['research', 'phd', 'taught'], minClass: 'first', idealExp: 'any', funding: ['full'], tags: ['research', 'leadership'], weight: 75,
  },
  {
    id: 'rhodes', name: 'Rhodes Scholarship', region: 'United Kingdom', fundingType: 'Fully funded',
    blurb: 'The University of Oxford’s landmark award. Highly competitive, for exceptional academics with leadership and service.',
    regions: ['uk'], fields: ['any'], degrees: ['taught', 'research'], minClass: 'first', idealExp: 'some', funding: ['full'], tags: ['leadership', 'africa'], weight: 72,
  },
  {
    id: 'clarendon', name: 'Clarendon Scholarship', region: 'United Kingdom', fundingType: 'Fully funded',
    blurb: 'Oxford’s flagship graduate award, given on academic excellence across almost every subject. No separate application for most courses.',
    regions: ['uk'], fields: ['any'], degrees: ['taught', 'research', 'phd'], minClass: 'first', idealExp: 'any', funding: ['full'], tags: ['research'], weight: 71,
  },
  {
    id: 'fulbright', name: 'Fulbright Foreign Student Program', region: 'United States', fundingType: 'Fully funded',
    blurb: 'Prestigious US government funding for graduate study. Strong academics and a compelling story are what win it.',
    regions: ['us'], fields: ['any'], degrees: ['taught', 'research'], minClass: '2:1', idealExp: 'some', funding: ['full'], tags: ['leadership'], weight: 92,
  },
  {
    id: 'knight-hennessy', name: 'Knight-Hennessy Scholars', region: 'United States', fundingType: 'Fully funded',
    blurb: 'Full funding for any graduate degree at Stanford, including MBA, law, and PhD, for emerging leaders.',
    regions: ['us'], fields: ['any'], degrees: ['taught', 'mba', 'phd', 'research'], minClass: 'first', idealExp: 'any', funding: ['full'], tags: ['leadership'], weight: 74,
  },
  {
    id: 'university-assistantships', name: 'University assistantships and TA-ships', region: 'US and Canada', fundingType: 'Tuition waiver plus stipend',
    blurb: 'Department-funded teaching and research assistantships that cover tuition and pay a stipend. Often overlooked, very winnable.',
    regions: ['us', 'canada'], fields: ['stem', 'social', 'business', 'health'], degrees: ['research', 'taught', 'phd'], minClass: '2:1', idealExp: 'any', funding: ['full', 'partial'], tags: ['assistantship', 'research'], weight: 80,
  },
  {
    id: 'vanier', name: 'Vanier Canada Graduate Scholarships', region: 'Canada', fundingType: 'Fully funded',
    blurb: 'Generous funding for world-class doctoral students in Canada, focused on research excellence and leadership.',
    regions: ['canada'], fields: ['any'], degrees: ['phd', 'research'], minClass: 'first', idealExp: 'any', funding: ['full'], tags: ['research', 'leadership'], weight: 76,
  },
  {
    id: 'canada-cgs', name: 'Canada Graduate Scholarships', region: 'Canada', fundingType: 'Fully funded',
    blurb: 'Federal funding for high-achieving master’s and doctoral students at Canadian universities.',
    regions: ['canada'], fields: ['stem', 'health', 'social'], degrees: ['research', 'phd', 'taught'], minClass: '2:1', idealExp: 'any', funding: ['full', 'partial'], tags: ['research'], weight: 69,
  },
  {
    id: 'daad', name: 'DAAD Scholarships', region: 'Germany', fundingType: 'Fully funded',
    blurb: 'Germany’s major funding body for international students. Especially strong for STEM, social sciences, and development fields.',
    regions: ['europe'], fields: ['stem', 'social', 'health', 'business'], degrees: ['taught', 'research', 'phd'], minClass: '2:1', idealExp: 'some', funding: ['full'], tags: ['development', 'research'], weight: 88,
  },
  {
    id: 'erasmus-mundus-jms', name: 'Erasmus Mundus Joint Masters', region: 'Europe', fundingType: 'Fully funded',
    blurb: 'Full scholarships for joint master’s degrees taught across several European universities. Open to almost every field.',
    regions: ['europe'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['full', 'partial'], tags: ['leadership'], weight: 86,
  },
  {
    id: 'eiffel', name: 'Eiffel Excellence Scholarship', region: 'France', fundingType: 'Fully funded',
    blurb: 'France’s government award for top international students in master’s and PhD study, strong for STEM, business, law, and social sciences.',
    regions: ['europe'], fields: ['stem', 'business', 'law', 'social'], degrees: ['taught', 'research'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['research'], weight: 70,
  },
  {
    id: 'swedish-institute', name: 'Swedish Institute Scholarships', region: 'Sweden', fundingType: 'Fully funded',
    blurb: 'Full funding for a master’s in Sweden for future leaders, with a focus on sustainability and global change.',
    regions: ['europe'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'some', funding: ['full'], tags: ['leadership', 'development'], weight: 68,
  },
  {
    id: 'holland', name: 'Holland Scholarship', region: 'Netherlands', fundingType: 'Partial',
    blurb: 'An award toward study at a Dutch university, a strong top-up for the Netherlands’ already affordable, high-quality programmes.',
    regions: ['europe'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly'], tags: ['affordable'], weight: 60,
  },
  {
    id: 'orange-knowledge', name: 'Orange Knowledge Programme', region: 'Netherlands', fundingType: 'Fully funded',
    blurb: 'Dutch government funding for mid-career professionals driving change at home, across development-focused fields.',
    regions: ['europe'], fields: ['social', 'health', 'business'], degrees: ['taught'], minClass: '2:1', idealExp: 'experienced', funding: ['full'], tags: ['development'], weight: 67,
  },
  {
    id: 'australia-awards', name: 'Australia Awards', region: 'Australia', fundingType: 'Fully funded',
    blurb: 'Long-term development scholarships funding full study in Australia for applicants from eligible countries.',
    regions: ['australia'], fields: ['any'], degrees: ['taught', 'research'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['development', 'africa'], weight: 70,
  },
  {
    id: 'australia-rtp', name: 'Research Training Program (Australia)', region: 'Australia', fundingType: 'Fully funded',
    blurb: 'Australian government funding for international research master’s and PhD students, tuition plus a living stipend.',
    regions: ['australia'], fields: ['any'], degrees: ['research', 'phd'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['research'], weight: 64,
  },
  {
    id: 'mastercard-foundation', name: 'Mastercard Foundation Scholars', region: 'Multiple', fundingType: 'Fully funded',
    blurb: 'Comprehensive funding for academically talented young Africans, covering tuition, living costs, and more.',
    regions: ['any'], fields: ['any'], degrees: ['taught', 'research'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['africa', 'development', 'leadership'], weight: 89,
  },
  {
    id: 'forte-fellowship', name: 'Forté Fellowship', region: 'Multiple', fundingType: 'Partial to full',
    blurb: 'MBA fellowships that advance women in business leadership, awarded by top schools in the Forté network.',
    regions: ['us', 'uk', 'canada', 'europe'], fields: ['business'], degrees: ['mba'], minClass: '2:1', idealExp: 'experienced', funding: ['partial', 'full', 'self-partly'], tags: ['women', 'leadership'], weight: 73,
  },
  {
    id: 'jj-wbgsp', name: 'Joint Japan World Bank Scholarship', region: 'Multiple', fundingType: 'Fully funded',
    blurb: 'Full funding for master’s study in development-related fields, for professionals from developing countries.',
    regions: ['any'], fields: ['social', 'business', 'health'], degrees: ['taught'], minClass: '2:1', idealExp: 'experienced', funding: ['full'], tags: ['development', 'africa'], weight: 71,
  },
  {
    id: 'ofid', name: 'OPEC Fund (OFID) Scholarship', region: 'Multiple', fundingType: 'Fully funded',
    blurb: 'Full funding for a master’s for students from developing countries, with a development focus across many fields.',
    regions: ['any'], fields: ['stem', 'social', 'health'], degrees: ['taught'], minClass: '2:1', idealExp: 'some', funding: ['full'], tags: ['development', 'africa'], weight: 62,
  },
  {
    id: 'aga-khan', name: 'Aga Khan Foundation ISP', region: 'Multiple', fundingType: 'Grant plus loan',
    blurb: 'Need-based support, part grant and part loan, for outstanding students from selected developing countries.',
    regions: ['any'], fields: ['any'], degrees: ['taught', 'research'], minClass: '2:1', idealExp: 'some', funding: ['partial', 'full'], tags: ['development', 'africa'], weight: 61,
  },
  {
    id: 'owsd', name: 'OWSD PhD Fellowship', region: 'Multiple', fundingType: 'Fully funded',
    blurb: 'Full funding for women from the global South pursuing a PhD in science and technology fields.',
    regions: ['any'], fields: ['stem', 'health'], degrees: ['phd', 'research'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['women', 'research', 'africa'], weight: 63,
  },
  {
    id: 'school-specific-merit', name: 'University merit scholarships', region: 'Multiple', fundingType: 'Partial to full',
    blurb: 'Automatic and competitive merit awards offered directly by universities. The easiest funding most applicants forget to chase.',
    regions: ['any'], fields: ['any'], degrees: ['any'], minClass: 'any', idealExp: 'any', funding: ['full', 'partial', 'self-partly', 'flexible'], tags: ['accessible'], weight: 50,
  },
];

function rankPathways(a: Answers): ScoredPathway[] {
  const scored = PATHWAYS.map((item) => {
    const s = scoreItem(item, a);
    return s ? ({ ...item, ...s }) : null;
  }).filter((x): x is ScoredPathway => x !== null);
  scored.sort((x, y) => y.score - x.score || y.weight - x.weight);
  let kept = scored.filter((s) => s.score >= MIN_SCORE);
  if (kept.length < 2) kept = scored.slice(0, 2);
  return kept.slice(0, 6);
}

function rankScholarships(a: Answers): ScoredScholarship[] {
  const scored = SCHOLARSHIPS.map((item) => {
    const s = scoreItem(item, a);
    return s ? ({ ...item, ...s }) : null;
  }).filter((x): x is ScoredScholarship => x !== null);
  scored.sort((x, y) => y.score - x.score || y.weight - x.weight);
  let kept = scored.filter((s) => s.score >= MIN_SCORE);
  if (kept.length < 2) kept = scored.slice(0, 2);
  return kept.slice(0, 8);
}

/**
 * Match a completed profile to scored, ranked, tiered pathways + scholarships.
 * Always returns a non-empty, encouraging shortlist (the ['any']-region items
 * guarantee at least a couple of matches for every profile).
 */
export function matchProfile(a: Answers): MatchResult {
  return { pathways: rankPathways(a), scholarships: rankScholarships(a) };
}

// ── Goal-driven motivation (mirrored in api/email.php) ───────────────────────
export function destinationPhrase(a: Answers): string {
  const order: [string, string][] = [
    ['us', 'in the United States'],
    ['uk', 'in the UK'],
    ['canada', 'in Canada'],
    ['europe', 'in Europe'],
    ['australia', 'in Australia'],
    ['africa', 'across Africa'],
  ];
  for (const [v, phrase] of order) if (destinations(a).includes(v)) return phrase;
  return 'abroad';
}

export function motivationFor(a: Answers): { headline: string; body: string } {
  const reason = pick(a, 'reason') || 'prestige';
  const where = destinationPhrase(a);
  const map: Record<string, { headline: string; body: string }> = {
    immigration: {
      headline: `That new life ${where} is closer than it feels`,
      body: `Building a life ${where} is not a long shot or a daydream. People with your exact background do it every single year, and grad school is one of the most reliable ways in. Here is your route.`,
    },
    'career-switch': {
      headline: 'Your career switch starts right here',
      body: `Reinventing yourself takes guts, and grad school is one of the cleanest ways to do it. Studying ${where} is genuinely on the table for you. Let’s make the pivot real.`,
    },
    promotion: {
      headline: 'Time to level all the way up',
      body: `The right master’s or MBA is rocket fuel for a career, and studying ${where} is well within your reach. Let’s turn the ambition into an offer.`,
    },
    'research-career': {
      headline: 'The research world needs you in it',
      body: `Funded research places and PhDs ${where} are real, and you can absolutely win one. Your ideas deserve a seat at the table, and we will help you claim it.`,
    },
    prestige: {
      headline: 'Aim high, you have earned the right',
      body: `A world-class school on your CV is not reserved for insiders, and studying ${where} is not out of your league. Let’s go get it.`,
    },
  };
  return map[reason] || map.prestige;
}

/** Slim, serializable map for the build to emit into dist/api/match-config.json. */
export function matchConfig() {
  return {
    pathways: PATHWAYS.map((p) => ({ id: p.id, name: p.name, blurb: p.blurb, category: p.category })),
    scholarships: SCHOLARSHIPS.map((s) => ({ id: s.id, name: s.name, blurb: s.blurb, region: s.region, fundingType: s.fundingType })),
  };
}
