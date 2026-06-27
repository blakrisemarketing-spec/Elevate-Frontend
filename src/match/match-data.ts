/**
 * Grad School Match, data + matching engine.
 *
 * Pure, framework-free module shared by:
 *   - the client island (src/match/MatchTool.tsx) for the instant, in-browser match
 *   - the build (scripts/build-priority-routes.mjs) which emits id -> {name, blurb}
 *     into dist/api/match-config.json so api/quiz-lead.php can build the email
 *     report from matched ids (the client cannot spoof the email content).
 *
 * The matcher is a marketing tool, not an admissions oracle: it always returns
 * an encouraging, plausible shortlist and routes the visitor to the bootcamp.
 * Every profile matches at least a couple of pathways + scholarships.
 *
 * Brand voice: Insider Friend. No em dashes anywhere (founder directive).
 */

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue>;

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

export interface ProgramPathway {
  id: string;
  name: string;
  category: string;
  blurb: string;
  /** Bootcamp session that most directly de-risks this pathway. */
  bootcampSession?: string;
  /** Higher weight sorts first among matches. */
  weight: number;
  eligible: (a: Answers) => boolean;
}

export interface Scholarship {
  id: string;
  name: string;
  region: string;
  fundingType: string;
  blurb: string;
  weight: number;
  eligible: (a: Answers) => boolean;
}

export interface MatchResult {
  pathways: ProgramPathway[];
  scholarships: Scholarship[];
}

// ── Answer accessors ────────────────────────────────────────────────────────
function pick(a: Answers, id: string): string | undefined {
  const v = a[id];
  return Array.isArray(v) ? v[0] : v;
}
function has(a: Answers, id: string, value: string): boolean {
  const v = a[id];
  return Array.isArray(v) ? v.includes(value) : v === value;
}
/** A destination matches if explicitly chosen or the visitor is open to anywhere. */
function dest(a: Answers, ...values: string[]): boolean {
  if (has(a, 'destinations', 'open')) return true;
  return values.some((v) => has(a, 'destinations', v));
}
/** Strong academic profile, used by competitive scholarships. */
function strongClass(a: Answers): boolean {
  return has(a, 'qualification', 'first') || has(a, 'qualification', '2:1');
}
function hasExperience(a: Answers): boolean {
  return has(a, 'experience', '1-2') || has(a, 'experience', '3-5') || has(a, 'experience', '5+');
}
function needsFunding(a: Answers): boolean {
  return has(a, 'funding', 'full') || has(a, 'funding', 'partial');
}
function isResearchy(a: Answers): boolean {
  return has(a, 'degree', 'research') || has(a, 'degree', 'phd');
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

// ── Program pathways (archetypes, not specific universities) ────────────────
export const PATHWAYS: ProgramPathway[] = [
  {
    id: 'funded-research-masters',
    name: 'Fully funded research master’s',
    category: 'Research',
    blurb: 'Thesis-based master’s where supervisors and departments fund strong applicants. Your proposal does the heavy lifting.',
    bootcampSession: 'Research Proposals, Pitching to Supervisors and Getting Funded',
    weight: 90,
    eligible: (a) => isResearchy(a) || (has(a, 'degree', 'taught') && needsFunding(a)),
  },
  {
    id: 'funded-phd-stipend',
    name: 'Funded PhD with a stipend',
    category: 'Research',
    blurb: 'Fully funded doctoral places that pay tuition plus a living stipend. Competitive, but very winnable with the right pitch.',
    bootcampSession: 'Research Proposals, Pitching to Supervisors and Getting Funded',
    weight: 88,
    eligible: (a) => has(a, 'degree', 'phd') || (isResearchy(a) && strongClass(a)),
  },
  {
    id: 'global-mba',
    name: 'Global MBA with scholarship support',
    category: 'Business',
    blurb: 'Top MBA programmes for professionals ready to pivot, with fellowships and need-based aid that bring the cost down.',
    bootcampSession: 'The MBA Blueprint',
    weight: 85,
    eligible: (a) => has(a, 'degree', 'mba') || (has(a, 'field', 'business') && hasExperience(a)),
  },
  {
    id: 'assistantship-route',
    name: 'Graduate assistantship route',
    category: 'Funded study',
    blurb: 'One of the most underused funding routes: teaching or research assistantships that waive tuition and pay you a stipend.',
    bootcampSession: 'Landing a Graduate Assistantship',
    weight: 84,
    eligible: (a) => dest(a, 'us', 'canada') && needsFunding(a),
  },
  {
    id: 'low-tuition-europe',
    name: 'Low-tuition Europe master’s',
    category: 'Affordable study',
    blurb: 'Public universities across Europe with low or no tuition for international students. Strong quality, gentle price.',
    bootcampSession: 'Your Graduate School Game Plan',
    weight: 80,
    eligible: (a) => dest(a, 'europe') && (has(a, 'budget', 'under-5k') || has(a, 'budget', '5-15k') || needsFunding(a)),
  },
  {
    id: 'fully-funded-uk-masters',
    name: 'Fully funded UK master’s',
    category: 'Funded study',
    blurb: 'A one-year UK master’s backed by a full scholarship. Fast, respected, and very fundable with a sharp narrative.',
    bootcampSession: 'Deep Dive on Scholarships',
    weight: 82,
    eligible: (a) => dest(a, 'uk') && needsFunding(a),
  },
  {
    id: 'erasmus-mundus',
    name: 'Erasmus Mundus joint master’s',
    category: 'Funded study',
    blurb: 'Study in two or more European countries on a fully funded joint degree, travel and stipend included.',
    bootcampSession: 'Deep Dive on Scholarships',
    weight: 78,
    eligible: (a) => dest(a, 'europe') && needsFunding(a),
  },
  {
    id: 'canada-funded-masters',
    name: 'Funded master’s in Canada',
    category: 'Funded study',
    blurb: 'Research master’s in Canada where funding packages and assistantships are part of the offer for strong applicants.',
    bootcampSession: 'Landing a Graduate Assistantship',
    weight: 79,
    eligible: (a) => dest(a, 'canada') && (has(a, 'field', 'stem') || has(a, 'field', 'health') || has(a, 'field', 'social') || isResearchy(a)),
  },
  {
    id: 'mastercard-scholars-pathway',
    name: 'Africa-focused scholars programme',
    category: 'Funded study',
    blurb: 'Fully funded programmes built for African talent, covering tuition, travel, and living costs end to end.',
    bootcampSession: 'Deep Dive on Scholarships',
    weight: 81,
    eligible: (a) => has(a, 'funding', 'full') && (dest(a, 'africa') || has(a, 'country', 'ghana') || has(a, 'country', 'nigeria') || has(a, 'country', 'kenya') || has(a, 'country', 'other-africa')),
  },
  {
    id: 'australia-funded',
    name: 'Funded study in Australia',
    category: 'Funded study',
    blurb: 'Australian master’s and PhD places with government and university scholarships for international applicants.',
    bootcampSession: 'Deep Dive on Scholarships',
    weight: 70,
    eligible: (a) => dest(a, 'australia') && needsFunding(a),
  },
  {
    id: 'pre-masters-pathway',
    name: 'Pathway and pre-master’s route',
    category: 'Profile building',
    blurb: 'A bridge for a lower class or a career change: pathway programmes that get you into a strong master’s on merit.',
    bootcampSession: 'Becoming the Candidate Admissions Committees Cannot Overlook',
    weight: 60,
    eligible: (a) => has(a, 'qualification', '2:2') || has(a, 'qualification', 'third') || has(a, 'reason', 'career-switch'),
  },
  {
    id: 'self-funded-affordable',
    name: 'Affordable self-funded master’s',
    category: 'Affordable study',
    blurb: 'A curated route to respected, low-tuition universities you can fund yourself, often with partial scholarships on top.',
    bootcampSession: 'Your Graduate School Game Plan',
    weight: 55,
    eligible: (a) => has(a, 'funding', 'self-partly') || has(a, 'funding', 'flexible') || has(a, 'budget', '15-30k') || has(a, 'budget', '30k+'),
  },
];

// ── Scholarships (named programmes, real eligibility shapes) ────────────────
export const SCHOLARSHIPS: Scholarship[] = [
  {
    id: 'chevening',
    name: 'Chevening Scholarship',
    region: 'United Kingdom',
    fundingType: 'Fully funded',
    blurb: 'The UK government’s flagship award for future leaders. One-year master’s, fully funded, built for people with work experience and a clear vision.',
    weight: 95,
    eligible: (a) => dest(a, 'uk') && hasExperience(a),
  },
  {
    id: 'commonwealth',
    name: 'Commonwealth Scholarship',
    region: 'United Kingdom',
    fundingType: 'Fully funded',
    blurb: 'Full funding for master’s and PhD study in the UK for citizens of Commonwealth countries, with a focus on development impact.',
    weight: 90,
    eligible: (a) => dest(a, 'uk') && needsFunding(a),
  },
  {
    id: 'fulbright',
    name: 'Fulbright Foreign Student Program',
    region: 'United States',
    fundingType: 'Fully funded',
    blurb: 'Prestigious US government funding for graduate study. Strong academics and a compelling story are what win it.',
    weight: 92,
    eligible: (a) => dest(a, 'us') && strongClass(a),
  },
  {
    id: 'daad',
    name: 'DAAD Scholarships',
    region: 'Germany',
    fundingType: 'Fully funded',
    blurb: 'Germany’s major funding body for international students. Especially strong for STEM, social sciences, and development fields.',
    weight: 88,
    eligible: (a) => dest(a, 'europe') && (has(a, 'field', 'stem') || has(a, 'field', 'social') || has(a, 'field', 'health')),
  },
  {
    id: 'erasmus-mundus-jms',
    name: 'Erasmus Mundus Joint Masters',
    region: 'Europe',
    fundingType: 'Fully funded',
    blurb: 'Full scholarships for joint master’s degrees taught across several European universities. Open to almost every field.',
    weight: 86,
    eligible: (a) => dest(a, 'europe'),
  },
  {
    id: 'mastercard-foundation',
    name: 'Mastercard Foundation Scholars',
    region: 'Multiple',
    fundingType: 'Fully funded',
    blurb: 'Comprehensive funding for academically talented young Africans, covering tuition, living costs, and more.',
    weight: 89,
    eligible: (a) => has(a, 'funding', 'full') && (has(a, 'country', 'ghana') || has(a, 'country', 'nigeria') || has(a, 'country', 'kenya') || has(a, 'country', 'other-africa') || dest(a, 'africa')),
  },
  {
    id: 'gates-cambridge',
    name: 'Gates Cambridge Scholarship',
    region: 'United Kingdom',
    fundingType: 'Fully funded',
    blurb: 'Full funding to study at Cambridge for outstanding applicants with a record of leadership and a desire to improve lives.',
    weight: 75,
    eligible: (a) => dest(a, 'uk') && has(a, 'qualification', 'first'),
  },
  {
    id: 'rhodes',
    name: 'Rhodes Scholarship',
    region: 'United Kingdom',
    fundingType: 'Fully funded',
    blurb: 'The University of Oxford’s landmark award. Highly competitive, for exceptional academics with leadership and service.',
    weight: 72,
    eligible: (a) => dest(a, 'uk') && has(a, 'qualification', 'first') && hasExperience(a),
  },
  {
    id: 'knight-hennessy',
    name: 'Knight-Hennessy Scholars',
    region: 'United States',
    fundingType: 'Fully funded',
    blurb: 'Full funding for any graduate degree at Stanford, including MBA, law, and PhD, for emerging leaders.',
    weight: 74,
    eligible: (a) => dest(a, 'us') && has(a, 'qualification', 'first'),
  },
  {
    id: 'vanier',
    name: 'Vanier Canada Graduate Scholarships',
    region: 'Canada',
    fundingType: 'Fully funded',
    blurb: 'Generous funding for world-class doctoral students in Canada, focused on research excellence and leadership.',
    weight: 76,
    eligible: (a) => dest(a, 'canada') && isResearchy(a),
  },
  {
    id: 'australia-awards',
    name: 'Australia Awards',
    region: 'Australia',
    fundingType: 'Fully funded',
    blurb: 'Long-term development scholarships funding full study in Australia for applicants from eligible countries.',
    weight: 70,
    eligible: (a) => dest(a, 'australia') && needsFunding(a),
  },
  {
    id: 'forte-fellowship',
    name: 'Forté Fellowship',
    region: 'Multiple',
    fundingType: 'Partial to full',
    blurb: 'MBA fellowships that advance women in business leadership, awarded by top schools in the Forté network.',
    weight: 73,
    eligible: (a) => has(a, 'degree', 'mba') || (has(a, 'field', 'business') && (has(a, 'reason', 'promotion') || has(a, 'reason', 'career-switch'))),
  },
  {
    id: 'jj-wbgsp',
    name: 'Joint Japan World Bank Scholarship',
    region: 'Multiple',
    fundingType: 'Fully funded',
    blurb: 'Full funding for master’s study in development-related fields, for professionals from developing countries.',
    weight: 71,
    eligible: (a) => has(a, 'funding', 'full') && (has(a, 'field', 'social') || has(a, 'field', 'business')) && hasExperience(a),
  },
  {
    id: 'orange-knowledge',
    name: 'Netherlands and Orange Knowledge',
    region: 'Netherlands',
    fundingType: 'Fully funded',
    blurb: 'Dutch government funding for master’s study and short courses, with a focus on professionals driving change at home.',
    weight: 68,
    eligible: (a) => dest(a, 'europe') && needsFunding(a),
  },
  {
    id: 'university-assistantships',
    name: 'University assistantships and TA-ships',
    region: 'US and Canada',
    fundingType: 'Tuition waiver plus stipend',
    blurb: 'Department-funded teaching and research assistantships that cover tuition and pay a stipend. Often overlooked, very winnable.',
    weight: 80,
    eligible: (a) => dest(a, 'us', 'canada') && needsFunding(a),
  },
  {
    id: 'school-specific-merit',
    name: 'University merit scholarships',
    region: 'Multiple',
    fundingType: 'Partial to full',
    blurb: 'Automatic and competitive merit awards offered directly by universities. The easiest funding most applicants forget to chase.',
    weight: 50,
    eligible: () => true,
  },
];

/**
 * Match a completed profile to pathways + scholarships. Always returns a
 * non-empty, encouraging shortlist (falls back to the broad options so the
 * teaser never reads "0 matches").
 */
export function matchProfile(a: Answers): MatchResult {
  const pathways = PATHWAYS.filter((p) => p.eligible(a)).sort((x, y) => y.weight - x.weight);
  const scholarships = SCHOLARSHIPS.filter((s) => s.eligible(a)).sort((x, y) => y.weight - x.weight);

  // Safety nets so every profile sees a result.
  if (pathways.length < 2) {
    const fallback = PATHWAYS.find((p) => p.id === 'self-funded-affordable');
    if (fallback && !pathways.includes(fallback)) pathways.push(fallback);
  }
  if (scholarships.length < 2) {
    const fallback = SCHOLARSHIPS.find((s) => s.id === 'school-specific-merit');
    if (fallback && !scholarships.includes(fallback)) scholarships.push(fallback);
  }

  return {
    pathways: pathways.slice(0, 6),
    scholarships: scholarships.slice(0, 6),
  };
}

/**
 * A short, optimistic, goal-driven motivation built from the visitor's "reason"
 * (their real why) and top destination. Drives the hopeful tone of the report.
 * Mirrored in api/email.php (ech_match_motivation) so the email matches.
 */
export function destinationPhrase(a: Answers): string {
  const order: [string, string][] = [
    ['us', 'in the United States'],
    ['uk', 'in the UK'],
    ['canada', 'in Canada'],
    ['europe', 'in Europe'],
    ['australia', 'in Australia'],
    ['africa', 'across Africa'],
  ];
  for (const [v, phrase] of order) if (has(a, 'destinations', v)) return phrase;
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
