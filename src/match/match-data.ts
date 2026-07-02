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
  /** Destination codes it serves (uk/us/canada/europe/australia/new-zealand/asia/africa), or ['any']. */
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
  genderEligibility?: 'any' | 'female' | 'male';
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
    id: 'gender',
    section: 'Your background',
    prompt: 'Which scholarships should we screen for you?',
    help: 'Some funding is gender-specific, so this keeps your report relevant.',
    type: 'single',
    options: [
      { value: 'female', label: 'Female' },
      { value: 'male', label: 'Male' },
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
      { value: 'new-zealand', label: 'New Zealand' },
      { value: 'asia', label: 'Asia' },
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
  uk: 'the UK', us: 'the US', canada: 'Canada', europe: 'Europe', australia: 'Australia', 'new-zealand': 'New Zealand', asia: 'Asia', africa: 'Africa',
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
  for (const r of ['uk', 'us', 'canada', 'europe', 'australia', 'new-zealand', 'asia', 'africa']) {
    if (item.regions.includes(r) && dests.includes(r)) return REGION_LABEL[r];
  }
  return null;
}

/** Score one item against the answers. Returns null when it is simply not relevant (wrong region). */
function scoreItem(item: Scorable, a: Answers): { score: number; tier: Tier; reasons: string[] } | null {
  const genderEligibility = (item as Scholarship).genderEligibility || 'any';
  const userGender = pick(a, 'gender');
  if (genderEligibility !== 'any' && userGender !== genderEligibility) return null;

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
    regions: ['us', 'uk', 'canada', 'europe'], fields: ['business'], degrees: ['mba'], minClass: '2:1', idealExp: 'experienced', funding: ['partial', 'full', 'self-partly'], tags: ['women', 'leadership'], weight: 73, genderEligibility: 'female',
  },
  {
    id: 'jj-wbgsp', name: 'Joint Japan World Bank Scholarship', region: 'Multiple', fundingType: 'Fully funded',
    blurb: 'Full funding for master’s study in development-related fields, for professionals from developing countries.',
    regions: ['any'], fields: ['social', 'business', 'health'], degrees: ['taught'], minClass: '2:1', idealExp: 'experienced', funding: ['full'], tags: ['development', 'africa'], weight: 71,
  },
  {
    id: 'ofid', name: 'OPEC Fund (OFID) Scholarship', region: 'Multiple', fundingType: 'Fully funded',
    blurb: 'Full funding for a master’s student from a developing country, with a development focus across many fields.',
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
    regions: ['any'], fields: ['stem', 'health'], degrees: ['phd', 'research'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['women', 'research', 'africa'], weight: 63, genderEligibility: 'female',
  },
  {
    id: 'cambridge-trust', name: 'Cambridge Trust Scholarships', region: 'United Kingdom', fundingType: 'Partial to full',
    blurb: 'Cambridge awards for international students on graduate courses, including master’s and PhD routes across many fields.',
    regions: ['uk'], fields: ['any'], degrees: ['taught', 'research', 'phd'], minClass: '2:1', idealExp: 'any', funding: ['full', 'partial'], tags: ['leadership'], weight: 76,
  },
  {
    id: 'weidenfeld-hoffmann', name: 'Weidenfeld-Hoffmann Scholarships', region: 'United Kingdom', fundingType: 'Fully funded',
    blurb: 'Oxford graduate scholarships for applicants from developing and emerging economies, paired with a leadership programme.',
    regions: ['uk'], fields: ['business', 'stem', 'health', 'social', 'law'], degrees: ['taught', 'mba'], minClass: '2:1', idealExp: 'some', funding: ['full'], tags: ['development', 'leadership'], weight: 77,
  },
  {
    id: 'imperial-presidents-phd', name: 'Imperial President’s PhD Scholarships', region: 'United Kingdom', fundingType: 'Fully funded',
    blurb: 'Highly competitive Imperial College London PhD awards covering fees, stipend support, and research costs for outstanding candidates.',
    regions: ['uk'], fields: ['stem', 'health', 'business'], degrees: ['phd', 'research'], minClass: 'first', idealExp: 'any', funding: ['full'], tags: ['research'], weight: 72,
  },
  {
    id: 'edinburgh-doctoral-college', name: 'Edinburgh Doctoral College Scholarships', region: 'United Kingdom', fundingType: 'Funded',
    blurb: 'University of Edinburgh doctoral awards for strong PhD applicants, normally combining tuition support with a stipend.',
    regions: ['uk'], fields: ['any'], degrees: ['phd', 'research'], minClass: '2:1', idealExp: 'any', funding: ['full', 'partial'], tags: ['research'], weight: 62,
  },
  {
    id: 'manchester-global-futures', name: 'Manchester Global Futures Scholarship', region: 'United Kingdom', fundingType: 'Partial',
    blurb: 'University of Manchester awards for international applicants from selected countries, including several African markets.',
    regions: ['uk'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly'], tags: ['africa'], weight: 58,
  },
  {
    id: 'bristol-think-big', name: 'Bristol Think Big Scholarships', region: 'United Kingdom', fundingType: 'Partial',
    blurb: 'University of Bristol tuition scholarships for international students on eligible postgraduate programmes.',
    regions: ['uk'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly'], tags: ['accessible'], weight: 57,
  },
  {
    id: 'warwick-chancellors-international', name: 'Warwick Chancellor’s International Scholarships', region: 'United Kingdom', fundingType: 'Fully funded',
    blurb: 'University of Warwick doctoral scholarships for top international PhD applicants across the university.',
    regions: ['uk'], fields: ['any'], degrees: ['phd', 'research'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['research'], weight: 66,
  },
  {
    id: 'nottingham-developing-solutions', name: 'Nottingham Developing Solutions Scholarship', region: 'United Kingdom', fundingType: 'Full or half tuition',
    blurb: 'University of Nottingham master’s awards for students from Africa, India, and selected Commonwealth countries focused on development impact.',
    regions: ['uk'], fields: ['stem', 'health', 'social', 'business'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'full'], tags: ['development', 'africa'], weight: 67,
  },
  {
    id: 'queen-elizabeth-commonwealth', name: 'Queen Elizabeth Commonwealth Scholarships', region: 'Commonwealth', fundingType: 'Fully funded',
    blurb: 'Fully funded two-year master’s scholarships at ACU member universities in low and middle income Commonwealth countries.',
    regions: ['africa', 'asia', 'any'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['development', 'africa'], weight: 76,
  },
  {
    id: 'glasgow-african-excellence', name: 'Glasgow African Excellence Award', region: 'United Kingdom', fundingType: 'Partial',
    blurb: 'University of Glasgow tuition discount for high-achieving African applicants to eligible postgraduate taught programmes.',
    regions: ['uk'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly'], tags: ['africa'], weight: 56,
  },
  {
    id: 'sheffield-postgraduate-merit', name: 'Sheffield International Postgraduate Merit Scholarship', region: 'United Kingdom', fundingType: 'Partial',
    blurb: 'University of Sheffield merit award reducing tuition for selected international postgraduate taught students.',
    regions: ['uk'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly'], tags: ['accessible'], weight: 54,
  },
  {
    id: 'exeter-global-excellence', name: 'Exeter Global Excellence Scholarships', region: 'United Kingdom', fundingType: 'Partial',
    blurb: 'University of Exeter awards that reduce tuition for high-achieving international postgraduate applicants.',
    regions: ['uk'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly'], tags: ['accessible'], weight: 53,
  },
  {
    id: 'uea-international-excellence', name: 'UEA International Excellence Scholarship', region: 'United Kingdom', fundingType: 'Partial',
    blurb: 'University of East Anglia scholarship support for international postgraduate taught applicants with strong academic profiles.',
    regions: ['uk'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly'], tags: ['accessible'], weight: 52,
  },
  {
    id: 'msca-doctoral-networks', name: 'Marie Skłodowska-Curie Doctoral Networks', region: 'Europe', fundingType: 'Funded doctoral salary',
    blurb: 'EU-funded doctoral positions across European research networks, with international recruitment and mobility built in.',
    regions: ['europe'], fields: ['any'], degrees: ['phd', 'research'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['research'], weight: 74,
  },
  {
    id: 'daad-epos', name: 'DAAD EPOS Scholarships', region: 'Germany', fundingType: 'Fully funded',
    blurb: 'DAAD funding for development-related postgraduate courses in Germany, aimed at professionals from developing countries.',
    regions: ['europe'], fields: ['business', 'stem', 'health', 'social'], degrees: ['taught', 'research'], minClass: '2:1', idealExp: 'some', funding: ['full'], tags: ['development', 'research'], weight: 82,
  },
  {
    id: 'heinrich-boll', name: 'Heinrich Böll Foundation Scholarships', region: 'Germany', fundingType: 'Stipend',
    blurb: 'Foundation support for international master’s and doctoral students in Germany with strong academic and civic profiles.',
    regions: ['europe'], fields: ['any'], degrees: ['taught', 'research', 'phd'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'full'], tags: ['leadership'], weight: 62,
  },
  {
    id: 'konrad-adenauer', name: 'Konrad Adenauer Foundation Scholarships', region: 'Germany', fundingType: 'Stipend',
    blurb: 'Scholarships for international graduates in Germany who show academic strength, social engagement, and leadership potential.',
    regions: ['europe'], fields: ['any'], degrees: ['taught', 'research', 'phd'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'full'], tags: ['leadership'], weight: 61,
  },
  {
    id: 'friedrich-ebert', name: 'Friedrich Ebert Foundation Scholarships', region: 'Germany', fundingType: 'Stipend',
    blurb: 'German foundation funding for international students and doctoral candidates with academic promise and social commitment.',
    regions: ['europe'], fields: ['any'], degrees: ['taught', 'research', 'phd'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'full'], tags: ['leadership'], weight: 60,
  },
  {
    id: 'rosa-luxemburg', name: 'Rosa Luxemburg Foundation Scholarships', region: 'Germany', fundingType: 'Stipend',
    blurb: 'Scholarship support for international master’s and doctoral students in Germany with strong social or political engagement.',
    regions: ['europe'], fields: ['social', 'law', 'arts', 'business'], degrees: ['taught', 'research', 'phd'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'full'], tags: ['leadership'], weight: 57,
  },
  {
    id: 'kaad', name: 'KAAD Scholarships', region: 'Germany', fundingType: 'Stipend plus tuition support',
    blurb: 'Catholic Academic Exchange Service awards for postgraduate study or research in Germany, focused on applicants from developing countries.',
    regions: ['europe'], fields: ['any'], degrees: ['taught', 'research', 'phd'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'full'], tags: ['development', 'africa'], weight: 58,
  },
  {
    id: 'eric-bleumink', name: 'Eric Bleumink Fund', region: 'Netherlands', fundingType: 'Fully funded',
    blurb: 'University of Groningen master’s funding for talented students from selected developing countries.',
    regions: ['europe'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['development'], weight: 63,
  },
  {
    id: 'leiden-excellence', name: 'Leiden University Excellence Scholarship', region: 'Netherlands', fundingType: 'Partial',
    blurb: 'Tuition scholarships for excellent non-EEA students applying to eligible Leiden University master’s programmes.',
    regions: ['europe'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly'], tags: ['accessible'], weight: 56,
  },
  {
    id: 'radboud', name: 'Radboud Scholarship Programme', region: 'Netherlands', fundingType: 'Partial tuition',
    blurb: 'Radboud University support that substantially reduces tuition for selected non-EEA master’s applicants.',
    regions: ['europe'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly'], tags: ['accessible'], weight: 57,
  },
  {
    id: 'maastricht-high-potential', name: 'Maastricht High Potential Scholarship', region: 'Netherlands', fundingType: 'Fully funded',
    blurb: 'Maastricht University scholarship for talented non-EU master’s applicants, combining tuition support and living-cost funding.',
    regions: ['europe'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['leadership'], weight: 64,
  },
  {
    id: 'amsterdam-merit', name: 'Amsterdam Merit Scholarship', region: 'Netherlands', fundingType: 'Partial',
    blurb: 'University of Amsterdam merit awards for outstanding international master’s applicants in selected faculties.',
    regions: ['europe'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly'], tags: ['accessible'], weight: 54,
  },
  {
    id: 'university-twente', name: 'University of Twente Scholarship', region: 'Netherlands', fundingType: 'Partial',
    blurb: 'Scholarships for excellent students from EU and non-EU countries applying to University of Twente master’s programmes.',
    regions: ['europe'], fields: ['stem', 'business', 'social'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly'], tags: ['accessible'], weight: 56,
  },
  {
    id: 'tu-delft-excellence', name: 'TU Delft Excellence Scholarships', region: 'Netherlands', fundingType: 'Partial to full',
    blurb: 'Competitive Delft master’s scholarships for excellent international applicants, especially strong for engineering and design fields.',
    regions: ['europe'], fields: ['stem', 'arts'], degrees: ['taught'], minClass: 'first', idealExp: 'any', funding: ['partial', 'full'], tags: ['research'], weight: 60,
  },
  {
    id: 'vlir-uos', name: 'VLIR-UOS ICP Connect Scholarships', region: 'Belgium', fundingType: 'Fully funded',
    blurb: 'Fully funded master’s scholarships in Belgium for applicants from eligible countries in Africa, Asia, and Latin America.',
    regions: ['europe'], fields: ['stem', 'health', 'social'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['development', 'africa'], weight: 72,
  },
  {
    id: 'ares-belgium', name: 'ARES Scholarships', region: 'Belgium', fundingType: 'Fully funded',
    blurb: 'Belgian development cooperation scholarships for specialised bachelor’s, master’s, and continuing education programmes.',
    regions: ['europe'], fields: ['stem', 'health', 'social', 'business'], degrees: ['taught'], minClass: '2:1', idealExp: 'some', funding: ['full'], tags: ['development', 'africa'], weight: 68,
  },
  {
    id: 'emile-boutmy', name: 'Émile Boutmy Scholarship', region: 'France', fundingType: 'Partial to full',
    blurb: 'Sciences Po tuition awards for first-time non-EU applicants on eligible undergraduate and master’s programmes.',
    regions: ['europe'], fields: ['social', 'law', 'business'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly', 'full'], tags: ['leadership'], weight: 58,
  },
  {
    id: 'paris-saclay', name: 'Université Paris-Saclay International Master’s Scholarships', region: 'France', fundingType: 'Partial',
    blurb: 'Paris-Saclay scholarships designed to attract international students into eligible master’s programmes.',
    regions: ['europe'], fields: ['stem', 'health', 'social', 'business'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly'], tags: ['research'], weight: 57,
  },
  {
    id: 'ens-international-selection', name: 'ENS International Selection', region: 'France', fundingType: 'Stipend',
    blurb: 'École Normale Supérieure selection route with monthly grant support for high-potential international students.',
    regions: ['europe'], fields: ['stem', 'social', 'arts'], degrees: ['taught', 'research'], minClass: 'first', idealExp: 'any', funding: ['partial', 'full'], tags: ['research'], weight: 55,
  },
  {
    id: 'uppsala-global', name: 'Uppsala University Global Scholarship', region: 'Sweden', fundingType: 'Tuition scholarship',
    blurb: 'Tuition scholarships for fee-paying international students applying to eligible Uppsala master’s programmes.',
    regions: ['europe'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly'], tags: ['accessible'], weight: 53,
  },
  {
    id: 'lund-global', name: 'Lund University Global Scholarship', region: 'Sweden', fundingType: 'Partial tuition',
    blurb: 'Merit-based tuition scholarships for high-achieving international students applying to Lund master’s programmes.',
    regions: ['europe'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly'], tags: ['accessible'], weight: 53,
  },
  {
    id: 'swiss-government-excellence', name: 'Swiss Government Excellence Scholarships', region: 'Switzerland', fundingType: 'Fully funded',
    blurb: 'Swiss federal scholarships for international postgraduate researchers, doctoral candidates, and postdoctoral researchers.',
    regions: ['europe'], fields: ['any'], degrees: ['research', 'phd'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['research'], weight: 64,
  },
  {
    id: 'university-helsinki', name: 'University of Helsinki Scholarships', region: 'Finland', fundingType: 'Full or partial tuition',
    blurb: 'Scholarship support for excellent non-EU and non-EEA students applying to international master’s programmes at Helsinki.',
    regions: ['europe'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly', 'full'], tags: ['accessible'], weight: 52,
  },
  {
    id: 'danish-government', name: 'Danish Government Scholarships', region: 'Denmark', fundingType: 'Partial',
    blurb: 'Government-supported tuition waivers and grants offered by Danish universities to selected non-EU master’s students.',
    regions: ['europe'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly'], tags: ['accessible'], weight: 52,
  },
  {
    id: 'bi-presidential', name: 'BI Presidential Scholarship', region: 'Norway', fundingType: 'Partial to full tuition',
    blurb: 'BI Norwegian Business School award for strong master’s applicants, including international candidates.',
    regions: ['europe'], fields: ['business'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly', 'full'], tags: ['leadership'], weight: 54,
  },
  {
    id: 'maeci', name: 'Italian Government MAECI Scholarships', region: 'Italy', fundingType: 'Tuition plus stipend',
    blurb: 'Italian government grants for foreign students and Italian citizens abroad pursuing study, training, or research in Italy.',
    regions: ['europe'], fields: ['any'], degrees: ['taught', 'research', 'phd'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'full'], tags: ['development'], weight: 58,
  },
  {
    id: 'orange-tulip', name: 'Orange Tulip Scholarship', region: 'Netherlands', fundingType: 'Partial to full',
    blurb: 'Netherlands scholarship offers for students from selected countries, delivered through participating Dutch institutions.',
    regions: ['europe'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'self-partly', 'full'], tags: ['accessible'], weight: 51,
  },
  {
    id: 'stipendium-hungaricum', name: 'Stipendium Hungaricum', region: 'Hungary', fundingType: 'Fully funded',
    blurb: 'Hungarian government scholarships for students from partner countries on full-degree programmes, including master’s and doctoral study.',
    regions: ['europe'], fields: ['any'], degrees: ['taught', 'phd', 'research'], minClass: '2:2', idealExp: 'any', funding: ['full'], tags: ['development', 'affordable'], weight: 66,
  },
  {
    id: 'romanian-government', name: 'Romanian Government Scholarships', region: 'Romania', fundingType: 'Fully funded',
    blurb: 'Romanian state scholarships for non-EU students on bachelor’s, master’s, and doctoral routes, with Romanian-language preparation where required.',
    regions: ['europe'], fields: ['any'], degrees: ['taught', 'phd', 'research'], minClass: '2:2', idealExp: 'any', funding: ['full'], tags: ['affordable'], weight: 54,
  },
  {
    id: 'czech-government', name: 'Czech Government Scholarships', region: 'Czech Republic', fundingType: 'Fully funded',
    blurb: 'Czech government scholarships for students from selected developing countries to study in Czechia.',
    regions: ['europe'], fields: ['stem', 'health', 'social', 'business'], degrees: ['taught', 'phd', 'research'], minClass: '2:2', idealExp: 'any', funding: ['full'], tags: ['development', 'affordable'], weight: 55,
  },
  {
    id: 'open-doors', name: 'Open Doors Russian Scholarship Project', region: 'Russia', fundingType: 'Tuition scholarship',
    blurb: 'Olympiad-based route to tuition-funded master’s and doctoral study at participating Russian universities.',
    regions: ['europe', 'asia'], fields: ['stem', 'business', 'social'], degrees: ['taught', 'phd', 'research'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'full'], tags: ['affordable'], weight: 50,
  },
  {
    id: 'rotary-global-grant', name: 'Rotary Global Grant Scholarships', region: 'Multiple', fundingType: 'Funded',
    blurb: 'Rotary funding for graduate-level study aligned with Rotary’s areas of focus, often delivered through district sponsorship.',
    regions: ['any'], fields: ['stem', 'health', 'social', 'business'], degrees: ['taught', 'research'], minClass: '2:1', idealExp: 'some', funding: ['partial', 'full'], tags: ['development', 'leadership'], weight: 61,
  },
  {
    id: 'aauw-international', name: 'AAUW International Fellowships', region: 'United States', fundingType: 'Funded',
    blurb: 'Funding for women who are not US citizens or permanent residents pursuing full-time graduate or postdoctoral study in the US.',
    regions: ['us'], fields: ['any'], degrees: ['taught', 'research', 'phd'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'full'], tags: ['women', 'leadership'], weight: 63, genderEligibility: 'female',
  },
  {
    id: 'yale-graduate-fellowship', name: 'Yale Graduate School Funding', region: 'United States', fundingType: 'Fully funded PhD support',
    blurb: 'Yale doctoral funding packages typically combine tuition fellowship, stipend support, and health coverage for admitted PhD students.',
    regions: ['us'], fields: ['any'], degrees: ['phd', 'research'], minClass: 'first', idealExp: 'any', funding: ['full'], tags: ['research'], weight: 62,
  },
  {
    id: 'harvard-gsas-funding', name: 'Harvard Griffin GSAS Financial Aid', region: 'United States', fundingType: 'Fully funded PhD support',
    blurb: 'Harvard Griffin GSAS funding for admitted doctoral students, usually combining tuition, stipend, and research or teaching support.',
    regions: ['us'], fields: ['any'], degrees: ['phd', 'research'], minClass: 'first', idealExp: 'any', funding: ['full'], tags: ['research'], weight: 62,
  },
  {
    id: 'mit-graduate-fellowships', name: 'MIT Graduate Fellowships', region: 'United States', fundingType: 'Funded',
    blurb: 'MIT graduate funding through fellowships, assistantships, and department support, strongest for research-led STEM paths.',
    regions: ['us'], fields: ['stem', 'business'], degrees: ['research', 'phd', 'taught'], minClass: 'first', idealExp: 'any', funding: ['full', 'partial'], tags: ['research', 'assistantship'], weight: 61,
  },
  {
    id: 'cornell-graduate-fellowship', name: 'Cornell Graduate Fellowships', region: 'United States', fundingType: 'Funded',
    blurb: 'Cornell graduate fellowships and assistantships that support admitted research students, especially doctoral candidates.',
    regions: ['us'], fields: ['any'], degrees: ['phd', 'research'], minClass: '2:1', idealExp: 'any', funding: ['full', 'partial'], tags: ['research', 'assistantship'], weight: 57,
  },
  {
    id: 'princeton-graduate-fellowship', name: 'Princeton Graduate Fellowships', region: 'United States', fundingType: 'Fully funded PhD support',
    blurb: 'Princeton graduate funding for admitted doctoral students, typically covering tuition and stipend support.',
    regions: ['us'], fields: ['any'], degrees: ['phd', 'research'], minClass: 'first', idealExp: 'any', funding: ['full'], tags: ['research'], weight: 60,
  },
  {
    id: 'rackham-fellowships', name: 'Michigan Rackham Fellowships', region: 'United States', fundingType: 'Funded',
    blurb: 'University of Michigan Rackham fellowship funding for graduate students, including competitive support for doctoral study.',
    regions: ['us'], fields: ['any'], degrees: ['phd', 'research', 'taught'], minClass: '2:1', idealExp: 'any', funding: ['partial', 'full'], tags: ['research'], weight: 55,
  },
  {
    id: 'rotary-peace', name: 'Rotary Peace Fellowships', region: 'Multiple', fundingType: 'Fully funded',
    blurb: 'Fully funded fellowships for peace and development professionals pursuing selected master’s programmes or professional certificates.',
    regions: ['us', 'uk', 'australia', 'asia'], fields: ['social', 'law', 'business'], degrees: ['taught'], minClass: '2:1', idealExp: 'experienced', funding: ['full'], tags: ['development', 'leadership'], weight: 70,
  },
  {
    id: 'trudeau-foundation', name: 'Pierre Elliott Trudeau Foundation Scholarship', region: 'Canada', fundingType: 'Funded',
    blurb: 'Canadian doctoral scholarship for researchers working on major social questions, with funding, mentorship, and leadership programming.',
    regions: ['canada'], fields: ['social', 'law', 'arts'], degrees: ['phd', 'research'], minClass: '2:1', idealExp: 'any', funding: ['full', 'partial'], tags: ['research', 'leadership'], weight: 62,
  },
  {
    id: 'uoft-mastercard', name: 'University of Toronto Mastercard Foundation Scholars', region: 'Canada', fundingType: 'Fully funded',
    blurb: 'Mastercard Foundation scholarship route for African students at the University of Toronto, focused on transformative leadership.',
    regions: ['canada'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['africa', 'development', 'leadership'], weight: 72,
  },
  {
    id: 'ubc-mastercard', name: 'UBC Mastercard Foundation Scholars', region: 'Canada', fundingType: 'Fully funded',
    blurb: 'University of British Columbia Mastercard Foundation scholarships for academically strong young people from Sub-Saharan Africa.',
    regions: ['canada'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['africa', 'development', 'leadership'], weight: 72,
  },
  {
    id: 'ubc-four-year-doctoral', name: 'UBC Four Year Doctoral Fellowship', region: 'Canada', fundingType: 'Funded',
    blurb: 'University of British Columbia doctoral funding that supports excellent PhD, DMA, and MDPhD students with stipend and tuition support.',
    regions: ['canada'], fields: ['any'], degrees: ['phd', 'research'], minClass: '2:1', idealExp: 'any', funding: ['full', 'partial'], tags: ['research'], weight: 59,
  },
  {
    id: 'mandela-rhodes', name: 'Mandela Rhodes Scholarship', region: 'Africa', fundingType: 'Fully funded',
    blurb: 'Fully funded postgraduate study in South Africa for young African leaders, paired with a leadership development programme.',
    regions: ['africa'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['africa', 'leadership', 'development'], weight: 76,
  },
  {
    id: 'au-nyerere', name: 'AU Mwalimu Nyerere Scholarship', region: 'Africa', fundingType: 'Fully funded',
    blurb: 'African Union scholarship support for African students pursuing priority master’s or doctoral study.',
    regions: ['africa'], fields: ['stem', 'health', 'social'], degrees: ['taught', 'phd', 'research'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['africa', 'development'], weight: 62,
  },
  {
    id: 'aims-masters', name: 'AIMS Master’s Program', region: 'Africa', fundingType: 'Fully funded',
    blurb: 'African Institute for Mathematical Sciences master’s training for talented African students in mathematical sciences and related fields.',
    regions: ['africa'], fields: ['stem'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['africa', 'research'], weight: 66,
  },
  {
    id: 'auc-african-graduate-fellowship', name: 'AUC African Graduate Fellowship', region: 'Africa', fundingType: 'Tuition, stipend, and housing',
    blurb: 'American University in Cairo fellowship support for African nationals pursuing eligible graduate study.',
    regions: ['africa'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['full', 'partial'], tags: ['africa', 'development'], weight: 57,
  },
  {
    id: 'twas-phd', name: 'TWAS PhD Fellowships', region: 'Multiple', fundingType: 'Stipend and fees',
    blurb: 'Doctoral fellowships for scientists from developing countries, usually hosted through TWAS partner institutions.',
    regions: ['any'], fields: ['stem', 'health'], degrees: ['phd', 'research'], minClass: '2:1', idealExp: 'any', funding: ['full', 'partial'], tags: ['research', 'development'], weight: 60,
  },
  {
    id: 'chinese-government', name: 'Chinese Government Scholarship', region: 'China', fundingType: 'Fully funded',
    blurb: 'China Scholarship Council funding for international students pursuing master’s and doctoral study at Chinese universities.',
    regions: ['asia'], fields: ['any'], degrees: ['taught', 'phd', 'research'], minClass: '2:2', idealExp: 'any', funding: ['full'], tags: ['affordable'], weight: 67,
  },
  {
    id: 'schwarzman', name: 'Schwarzman Scholars', region: 'China', fundingType: 'Fully funded',
    blurb: 'Fully funded one-year master’s programme at Tsinghua University for high-potential global leaders.',
    regions: ['asia'], fields: ['business', 'social', 'law'], degrees: ['taught'], minClass: '2:1', idealExp: 'some', funding: ['full'], tags: ['leadership'], weight: 72,
  },
  {
    id: 'yenching', name: 'Yenching Academy Fellowship', region: 'China', fundingType: 'Fully funded',
    blurb: 'Peking University fellowship covering tuition, accommodation, stipend, travel, and field study costs for selected master’s students.',
    regions: ['asia'], fields: ['social', 'law', 'arts', 'business'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['leadership'], weight: 70,
  },
  {
    id: 'mext', name: 'MEXT Japanese Government Scholarship', region: 'Japan', fundingType: 'Fully funded',
    blurb: 'Japanese government scholarship route for international graduate study and research in Japan.',
    regions: ['asia'], fields: ['any'], degrees: ['taught', 'research', 'phd'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['research', 'affordable'], weight: 68,
  },
  {
    id: 'adb-jsp', name: 'ADB-Japan Scholarship Program', region: 'Asia-Pacific', fundingType: 'Fully funded',
    blurb: 'Asian Development Bank programme funding postgraduate study for applicants from eligible developing member countries.',
    regions: ['asia'], fields: ['business', 'stem', 'health', 'social'], degrees: ['taught'], minClass: '2:1', idealExp: 'some', funding: ['full'], tags: ['development'], weight: 64,
  },
  {
    id: 'gks', name: 'Global Korea Scholarship', region: 'South Korea', fundingType: 'Fully funded',
    blurb: 'Korean government scholarship for international students pursuing graduate degrees in South Korea.',
    regions: ['asia'], fields: ['any'], degrees: ['taught', 'research', 'phd'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['affordable'], weight: 64,
  },
  {
    id: 'taiwan-icdf', name: 'TaiwanICDF Scholarship', region: 'Taiwan', fundingType: 'Fully funded',
    blurb: 'TaiwanICDF support for students from partner countries pursuing selected international higher education programmes in Taiwan.',
    regions: ['asia'], fields: ['business', 'stem', 'health', 'social'], degrees: ['taught', 'phd', 'research'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['development'], weight: 58,
  },
  {
    id: 'turkiye-burslari', name: 'Türkiye Scholarships', region: 'Turkey', fundingType: 'Fully funded',
    blurb: 'Government-funded scholarship programme for international students at Turkish universities, including graduate study.',
    regions: ['asia', 'europe'], fields: ['any'], degrees: ['taught', 'phd', 'research'], minClass: '2:2', idealExp: 'any', funding: ['full'], tags: ['affordable'], weight: 65,
  },
  {
    id: 'brunei-government', name: 'Brunei Darussalam Government Scholarship', region: 'Brunei', fundingType: 'Fully funded',
    blurb: 'Government scholarship for international students to study at selected higher education institutions in Brunei.',
    regions: ['asia'], fields: ['any'], degrees: ['taught'], minClass: '2:1', idealExp: 'any', funding: ['full'], tags: ['affordable'], weight: 50,
  },
  {
    id: 'manaaki-new-zealand', name: 'Manaaki New Zealand Scholarships', region: 'New Zealand', fundingType: 'Fully funded',
    blurb: 'New Zealand government scholarships for eligible developing-country applicants pursuing study that supports development impact.',
    regions: ['new-zealand'], fields: ['stem', 'health', 'social', 'business'], degrees: ['taught', 'phd', 'research'], minClass: '2:1', idealExp: 'some', funding: ['full'], tags: ['development'], weight: 68,
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

function diversifyScholarships(items: ScoredScholarship[], limit = 12): ScoredScholarship[] {
  const chosen: ScoredScholarship[] = [];
  const byRegion = new Map<string, number>();
  const byFunding = new Map<string, number>();
  for (const item of items) {
    const r = item.region || 'Multiple';
    const f = item.fundingType || 'Other';
    if ((byRegion.get(r) || 0) >= 3 || (byFunding.get(f) || 0) >= 5) continue;
    chosen.push(item);
    byRegion.set(r, (byRegion.get(r) || 0) + 1);
    byFunding.set(f, (byFunding.get(f) || 0) + 1);
    if (chosen.length >= limit) return chosen;
  }
  for (const item of items) {
    if (!chosen.some((x) => x.id === item.id)) chosen.push(item);
    if (chosen.length >= limit) return chosen;
  }
  return chosen;
}

function rankScholarships(a: Answers, source: Scholarship[] = SCHOLARSHIPS): ScoredScholarship[] {
  const scored = source.map((item) => {
    const s = scoreItem(item, a);
    return s ? ({ ...item, ...s }) : null;
  }).filter((x): x is ScoredScholarship => x !== null);
  scored.sort((x, y) => y.score - x.score || y.weight - x.weight);
  let kept = scored.filter((s) => s.score >= MIN_SCORE);
  if (kept.length < 2) kept = scored.slice(0, 2);
  return diversifyScholarships(kept, 12);
}

/**
 * Match a completed profile to scored, ranked, tiered pathways + scholarships.
 * Always returns a non-empty, encouraging shortlist (the ['any']-region items
 * guarantee at least a couple of matches for every profile).
 */
export function matchProfile(a: Answers, scholarshipsOverride?: Scholarship[]): MatchResult {
  return { pathways: rankPathways(a), scholarships: rankScholarships(a, scholarshipsOverride && scholarshipsOverride.length > 0 ? scholarshipsOverride : SCHOLARSHIPS) };
}

// ── Goal-driven motivation (mirrored in api/email.php) ───────────────────────
export function destinationPhrase(a: Answers): string {
  const order: [string, string][] = [
    ['us', 'in the United States'],
    ['uk', 'in the UK'],
    ['canada', 'in Canada'],
    ['europe', 'in Europe'],
    ['australia', 'in Australia'],
    ['new-zealand', 'in New Zealand'],
    ['asia', 'in Asia'],
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
    scholarships: SCHOLARSHIPS.map((s) => ({ id: s.id, name: s.name, blurb: s.blurb, region: s.region, fundingType: s.fundingType, genderEligibility: s.genderEligibility || 'any' })),
  };
}
