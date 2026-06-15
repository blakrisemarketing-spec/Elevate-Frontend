/**
 * Blog content. The `BlogIndex` page lists these; the `BlogPost` template
 * renders one per `slug`. Bodies are stored as structured blocks (paragraph /
 * heading / list) so they render as zero-JS static HTML — no markdown runtime
 * is pulled into the priority bundle.
 *
 * SEO note: each post's <title> and meta description are generated from
 * `title` / `excerpt` at build time (scripts/build-priority-routes.mjs).
 * Routes/slugs are kept stable from the WordPress migration to preserve
 * inbound links and indexing — titles are free to change.
 */

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'ul'; items: string[] };

/** Decorative cover motif (see BlogCover). Also drives the category accent. */
export type BlogCoverKey = 'network' | 'cv' | 'scholarship' | 'toolkit';

export interface BlogPostContent {
  route: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  readMinutes: number;
  cover: BlogCoverKey;
  excerpt: string;
  body: BlogBlock[];
}

export const BLOG_POSTS: BlogPostContent[] = [
  {
    route: '/how-our-career-development-company-can-help-you-stand-out/',
    slug: 'how-our-career-development-company-can-help-you-stand-out',
    title: 'Most jobs are filled before they’re advertised. Here’s how to get in.',
    category: 'Career',
    date: '18 May 2026',
    readMinutes: 5,
    cover: 'network',
    excerpt:
      'The “who you know” advantage is real — but it isn’t luck, and it isn’t reserved for people born into it. Here’s how to build it on purpose.',
    body: [
      { type: 'p', text: 'If you’ve ever watched a less-qualified person land the role you wanted, you already know the quiet truth of the job market: a lot of opportunity moves through relationships, not job boards. By the time a role is posted publicly, it has often already been half-promised to someone the hiring manager has heard of.' },
      { type: 'p', text: 'For a long time that felt like bad news — like the game was rigged before you sat down. We see it differently. A referral isn’t a birthright. It’s something you can build on purpose, even if you’re starting with no insider network at all. That’s the whole reason Elevate exists: to be the connection our clients didn’t have.' },
      { type: 'h', text: 'You don’t need to know a CEO. You need to know the person one step ahead.' },
      { type: 'p', text: 'The most useful person in your search usually isn’t a director — it’s someone who landed the job you want about eighteen months ago. They remember exactly how they got in, who they spoke to, and what the interview actually tested. Find a few of those people, in the companies and roles you’re aiming at, and you’ve found your map.' },
      { type: 'p', text: 'Reach out with something specific and small: you admire the work they’re doing, you’re trying to move into the same space, and you’d value fifteen minutes to hear how they made the jump. Most people say yes — because someone once did the same for them.' },
      { type: 'h', text: 'This works. We’ve done it ourselves.' },
      { type: 'p', text: 'Naa, one of our co-founders, landed her first professional role at a leading fintech in Ghana by reaching out directly to the company’s CEO — for a job that was never advertised. Years later, a relationship she had built deliberately turned into a role that sponsored her relocation from Ghana to the United States. Neither of those came from a job board. Both came from being willing to start the conversation.' },
      { type: 'h', text: 'How to reach out (without feeling like a pest)' },
      { type: 'ul', items: [
        'Lead with a genuine, specific reason you’re contacting them — not a copy-paste message you’ve clearly sent to forty people.',
        'Make a small, clear ask: a short call, one question, a pointer. Easy to say yes to.',
        'Give before you take where you can — share something useful, or simply be easy and respectful to deal with.',
        'Follow up once, politely, if you don’t hear back. Then leave it. Timing isn’t personal.',
      ] },
      { type: 'h', text: 'Make yourself easy to refer' },
      { type: 'p', text: 'Even a willing contact needs something they can forward. That means a CV that reads clearly in seconds, a one-line answer to “what are you looking for?”, and a LinkedIn profile that backs up the story. When someone vouches for you, they’re spending a little of their own credibility — make it effortless for them to do it.' },
      { type: 'p', text: 'This is the part of the job search nobody hands you a manual for. We’ve been inside it — as candidates, and on the side of the table that makes the calls. If you want help mapping who to talk to, what to say, and how to show up referable, book a free chat and tell us the goal. We’ll map the path with you.' },
    ],
  },
  {
    route: '/how-to-boost-your-career-with-professional-resume-writing/',
    slug: 'how-to-boost-your-career-with-professional-resume-writing',
    title: 'The CV that actually lands the interview',
    category: 'Career',
    date: '22 April 2026',
    readMinutes: 6,
    cover: 'cv',
    excerpt:
      'Before a human ever reads it, your CV is screened by software and then skimmed in seconds. Here’s what decides whether it survives both.',
    body: [
      { type: 'p', text: 'Here’s the uncomfortable thing about your CV: most of the time, the first thing to “read” it isn’t a person. It’s software. And when a person does pick it up, they give it about the length of a held breath before deciding whether to keep reading. You’re not writing a life story. You’re writing to survive two fast filters.' },
      { type: 'p', text: 'We’ve sat on the side of the table where those decisions get made, and we’ve rewritten a lot of CVs that were full of good work but buried it. The fix is rarely “do more” — it’s usually “show the right things, faster.”' },
      { type: 'h', text: 'Write for the skim, not the read' },
      { type: 'p', text: 'A hiring manager’s first pass is a scan: your most recent role, the company, and three or four lines underneath. If your strongest, most relevant achievement isn’t visible in that window, it may as well not be there. Lead each role with impact, not duties — what changed because you were there.' },
      { type: 'h', text: 'Replace responsibilities with results' },
      { type: 'p', text: '“Responsible for managing reports” tells a reader nothing. “Cut the monthly close from ten days to four” tells them everything. Wherever you can, attach a number — money saved, time cut, volume handled, growth driven. Numbers are the fastest way to make a stranger believe you.' },
      { type: 'ul', items: [
        'Start each bullet with a strong verb: led, built, cut, won, launched, recovered.',
        'Quantify whenever it’s honest to — percentages, amounts, headcount, timeframes.',
        'Keep one idea per bullet. If it needs an “and”, it’s probably two bullets.',
      ] },
      { type: 'h', text: 'Get past the software — without gaming it' },
      { type: 'p', text: 'Many employers run CVs through an applicant tracking system that scans for the language in the job description. So mirror the real words a posting uses — if it says “stakeholder management”, use that exact phrase where it’s true of you. This isn’t about stuffing keywords or tricking a robot; it’s about not getting filtered out for using a synonym. Be honest, just be findable.' },
      { type: 'h', text: 'Cut everything that isn’t working for you' },
      { type: 'ul', items: [
        'The decade-old role that no longer supports your direction — summarise it or drop it.',
        'Soft-skill clichés (“hard-working team player”) with nothing behind them.',
        'Dense paragraphs. White space is what makes the scan possible.',
        'Anything you can’t speak to confidently in an interview.',
      ] },
      { type: 'p', text: 'A strong CV won’t do the whole job — but a weak one quietly ends the conversation before it starts. If you’d like a second set of eyes from people who’ve reviewed thousands of them, that’s exactly what our CV and career support is for. Book a free chat and we’ll tell you, honestly, what’s holding yours back.' },
    ],
  },
  {
    route: '/the-importance-of-professional-documents-in-career-development/',
    slug: 'the-importance-of-professional-documents-in-career-development',
    title: 'What actually wins a scholarship to a top university',
    category: 'Study Abroad',
    date: '10 March 2026',
    readMinutes: 6,
    cover: 'scholarship',
    excerpt:
      'A fully funded place at a world-class university can feel like it’s meant for someone else. It isn’t. Here’s what the winning applications have in common.',
    body: [
      { type: 'p', text: 'For a lot of brilliant people, a scholarship to a world-class university sits in the same mental drawer as winning the lottery — a nice idea, but surely meant for someone else. We want to be direct with you: the pathway is real, it isn’t a fantasy, and it isn’t reserved for a privileged few. We know, because we’ve walked it.' },
      { type: 'p', text: 'Rosemary, one of our co-founders, earned her master’s at the University of Manchester on a full-ride scholarship — tuition, accommodation, flights, and visa costs covered in full, with a monthly stipend on top. None of that happened by accident. It happened because the application did a specific set of things well. Here’s what those things are.' },
      { type: 'h', text: 'Apply for the funding as deliberately as the place' },
      { type: 'p', text: 'Many strong candidates pour everything into getting admitted and treat the scholarship as an afterthought — a box ticked late, if at all. Flip that. Identify the specific scholarships you’re eligible for early, read exactly what each one is trying to reward, and build your application to speak to it. Funding rarely finds you; you go after it on purpose.' },
      { type: 'h', text: 'Win on fit, not just grades' },
      { type: 'p', text: 'Selection panels are rarely choosing the single highest grade in the pile — they’re choosing the person whose goals genuinely fit what the scholarship exists to support. Show that you understand what they’re funding and why you’re a natural extension of it. A clear sense of direction beats a vague list of achievements every time.' },
      { type: 'h', text: 'Make your personal statement a story, not a résumé in prose' },
      { type: 'ul', items: [
        'Open with something true and specific to you — not a quotation or a grand statement about “making a difference”.',
        'Show the through-line: how your past, your present, and this exact programme connect.',
        'Be concrete. One vivid, real example outweighs three paragraphs of adjectives.',
        'Name why this school and this scholarship — not just “a top university”.',
      ] },
      { type: 'h', text: 'A word of honesty' },
      { type: 'p', text: 'We won’t promise you a scholarship — final funding decisions sit with the universities and providers, and no one can guarantee them. What we can do is make sure your application is as strong, as targeted, and as true to you as it can possibly be, so that when the decision is made, nothing was left on the table.' },
      { type: 'p', text: 'If a funded place at a top university has been sitting in your “maybe one day” drawer, take it out. Tell us the goal and we’ll map the path — including which scholarships to chase and how to win them.' },
    ],
  },
  {
    route: '/tips-for-crafting-an-effective-resume-cover-letter-personal-statement-and-school-application/',
    slug: 'tips-for-crafting-an-effective-resume-cover-letter-personal-statement-and-school-application',
    title: 'Your application toolkit: CV, cover letter, personal statement, school app',
    category: 'Toolkit',
    date: '4 February 2026',
    readMinutes: 5,
    cover: 'toolkit',
    excerpt:
      'Four documents do most of the heavy lifting in any application. Here’s a no-fluff checklist for getting each one right.',
    body: [
      { type: 'p', text: 'Almost every job or school application comes down to four documents. Get them right and you give yourself a real shot; get them wrong and even strong candidates get passed over. Here’s the practical, no-fluff version of what each one needs — the same checklist we walk our clients through.' },
      { type: 'h', text: 'The CV' },
      { type: 'ul', items: [
        'Tailor it to the specific role — the version that works for everything works for nothing.',
        'Lead each role with results and numbers, not a list of duties.',
        'Keep it clean and scannable; a reader should grasp your story in seconds.',
      ] },
      { type: 'h', text: 'The cover letter' },
      { type: 'ul', items: [
        'Address a real person where you can — it signals you did the work.',
        'Open with why this role, at this company, now — not “I am writing to apply”.',
        'Connect your experience to what they actually need, then stop. One page, tops.',
      ] },
      { type: 'h', text: 'The personal statement' },
      { type: 'ul', items: [
        'Start with something specific and true to you — skip the famous quote.',
        'Show the thread connecting where you’ve been to where this programme takes you.',
        'Demonstrate commitment with real examples, not adjectives about yourself.',
      ] },
      { type: 'h', text: 'The school application' },
      { type: 'ul', items: [
        'Research the school properly and answer what they’re actually asking.',
        'Let your achievements and involvement show your character, not just your grades.',
        'Give referees enough notice — and a reminder of your highlights to draw on.',
      ] },
      { type: 'p', text: 'One rule sits above all of these: be specific, be honest, and ask someone you trust to read it before you send it. If you’d like that someone to be people who’ve been inside the rooms where these decisions get made, book a free chat — we’ll tell you what’s working and what to sharpen.' },
    ],
  },
];
