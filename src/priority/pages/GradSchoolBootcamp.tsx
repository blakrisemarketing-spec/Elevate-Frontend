import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { FAQAccordion } from '../components/FAQAccordion';
import { FACILITATORS } from '../data/facilitators';

const DROPIN_WA =
  'https://wa.me/233531113454?text=Hi%20Elevate%2C%20I%27d%20like%20to%20pick%20individual%20drop-in%20sessions%20for%20the%20Get%20Into%20Grad%20School%20Bootcamp.';

const QUICK_FACTS = [
  { label: '8 live sessions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: '26 Jul – 18 Aug 2026', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Live on Google Meet', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { label: '2 hours each + Q&A', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const SESSIONS = [
  { n: 1, date: 'Jul 26', title: 'Your Graduate School Game Plan', outcome: 'Make a confident, informed decision about which programme type, country, and schools fit your goals — instead of applying on guesswork or reputation alone.' },
  { n: 2, date: 'Jul 28', title: 'Becoming the Candidate Admissions Committees Cannot Overlook', outcome: 'The blueprint to format and position your profile so committees pause when they hit your name.' },
  { n: 3, date: 'Aug 2', title: 'The MBA Blueprint', outcome: 'A dedicated session for corporate professionals looking to pivot globally and maximise their grad school experience from day one.' },
  { n: 4, date: 'Aug 4', title: 'Personal Statements & Scholarship Essays', outcome: 'Our signature narrative strategy to break through writer’s block and draft an essay that stands out in a pool of thousands.' },
  { n: 5, date: 'Aug 9', title: 'Research Proposals, Pitching to Supervisors & Getting Funded', outcome: 'How to reach out to international academic supervisors and write proposals that make them want to say “yes.”' },
  { n: 6, date: 'Aug 11', title: 'Landing a Graduate Assistantship', outcome: 'A deep dive into graduate assistantships — one of the most underused funding routes for international students.' },
  { n: 7, date: 'Aug 16', title: 'Deep Dive on Scholarships', outcome: 'Real strategies from past winners of full-ride scholarships like Chevening, DAAD, and Forté — plus a curated, personalised funding list you can act on immediately.' },
  { n: 8, date: 'Aug 18', title: 'Visas & Getting Ready for School', outcome: 'From document compilation to visa interview prep, so you are 100% ready to confidently step onto a global campus.' },
];

const BONUSES = [
  { title: 'The Ultimate Funding Pack', body: 'A curated list of 50+ scholarships with open application windows.' },
  { title: 'The Smart School List', body: 'A guide to 30+ low-tuition universities with high funding rates for international applicants.' },
  { title: '90 Days of Replay Access', body: 'Every 2-hour session is recorded — including the live Q&As — and sent to your inbox to rewatch anytime.' },
  { title: 'Community & Support', body: 'Access to a dedicated WhatsApp group for extra support throughout your cycle.' },
  { title: 'No Experience Required', body: 'Nothing to prepare before Session 1 — just show up with an open mind and a rough idea of your goals.' },
];

const FAQ_GROUPS = [
  {
    heading: 'About the bootcamp',
    items: [
      { question: 'What is the bootcamp all about?', answer: 'An 8-session intensive programme that walks you through the entire graduate school application process — from choosing the right programme and building your school list, to writing your personal statement, securing funding, and preparing to arrive on campus. Each session is led by a speaker with direct, relevant experience.' },
      { question: 'Who is this for?', answer: 'Anyone seriously considering graduate school, whether you’re just starting to explore your options or already in the middle of applications. It’s particularly relevant if you’re targeting programmes in the US, UK, Canada, Australia, or Europe.' },
      { question: 'Do I need to already know which school or programme I want?', answer: 'No. Session 1 starts with a diagnostic exercise to help you figure that out. You’ll leave with a clear direction — not just a list of schools to Google later.' },
      { question: 'Does it cover all types of graduate programmes?', answer: 'Yes. The bootcamp covers taught Masters, research-based programmes (MPhil, Masters by Research, PhD), and MBAs.' },
      { question: 'Is this only relevant for people applying from Ghana?', answer: 'The bootcamp is designed with an African applicant lens, but the content applies to anyone applying to graduate programmes abroad. School selection, application strategy, funding, and visa guidance are covered for multiple destination countries.' },
    ],
  },
  {
    heading: 'Funding, sessions & logistics',
    items: [
      { question: 'Will funding and scholarships be covered?', answer: 'Yes, and in depth. We cover graduate assistantships (one of the most underused funding routes for international students), a dedicated scholarships session with people who have actually won funding, and a resource pack with 50+ scholarships and 30+ low-tuition universities. Alternative funding such as loans is also covered.' },
      { question: 'I’m only interested in one or two topics. Can I attend individual sessions?', answer: 'Yes. Drop-in tickets are available, so you can register for just the sessions most relevant to you.' },
      { question: 'What do I need to bring or prepare?', answer: 'Nothing is required before Session 1 — it opens with a diagnostic exercise, so come with an open mind and a rough sense of your goals. For later sessions, facilitators may share prep materials in advance.' },
      { question: 'Will sessions be recorded?', answer: 'Yes. Recordings are shared with registered participants after each session, with 90 days of replay access.' },
      { question: 'What platform will sessions run on, and how long are they?', answer: 'Sessions run on Google Meet. Each one is 2 hours, with a Q&A included.' },
      { question: 'I have a question that isn’t covered here.', answer: 'Reach out to us at hello@elevatecareerhub.com or on WhatsApp at +233 53 111 3454.' },
    ],
  },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 10l4 4 6-8" strokeLinecap="round" strokeLinejoin="round"/></svg>
  );
}

export function GradSchoolBootcampPage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="" />

      <main id="main">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-primary to-navy text-white" aria-labelledby="hero-heading">
          <div className="container-site py-16 lg:py-24">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy bg-electric px-3 py-1.5 rounded-full mb-6">
                Get Into Grad School Bootcamp · Early-bird open
              </p>
              <h1 id="hero-heading" className="text-display-lg text-white mb-5">
                Stop guessing your way through the 2026/2027 application cycle.
                <span className="text-electric"> Turn your “average” profile into an offer letter.</span>
              </h1>
              <p className="text-lg text-white/90 leading-relaxed mb-8">
                An 8-session intensive bootcamp that walks you through the entire process — from building your school list and writing killer essays, to securing funding and getting your visa approved. Every session is led by a facilitator with direct, relevant experience.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <button type="button" className="btn-primary bg-electric text-navy hover:bg-electric-600 buy-btn" data-service-id="bootcamp-grad-full">
                  Register for the bootcamp now
                </button>
                <a href="#tickets" className="text-white/90 underline underline-offset-4 hover:text-electric text-sm">
                  Can’t attend it all? See individual drop-in tickets &darr;
                </a>
              </div>

              <ul className="flex flex-wrap gap-x-8 gap-y-3 mt-10">
                {QUICK_FACTS.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-white/90 text-sm">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-electric" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={f.icon} strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── The Problem ──────────────────────────────────────── */}
        <section className="container-site py-16 lg:py-20" aria-labelledby="problem-heading">
          <div className="max-w-3xl">
            <h2 id="problem-heading" className="text-headline-lg mb-5">Does your late-night browser look like this?</h2>
            <div className="space-y-4 text-ink-muted leading-relaxed">
              <p>It’s 11 PM. You have 15 different university tabs open, your head is spinning, and you’re staring at a blank Google Doc — typing and deleting the same first sentence. You know you have a great story to tell, but everything you write feels boring, and you have no idea how to make it compelling enough to stand out.</p>
              <p>And to make it worse, you keep asking whether your grad school dream is still valid, with headlines about countries tightening immigration rules. The UK has cut the Graduate visa from 24 to 18 months; in the US, students face increasing scrutiny and reports of sudden visa cancellations. The old way of applying — without a clear plan — is no longer enough.</p>
              <p className="text-ink font-medium">But here’s the good news: top universities are still actively seeking global talent and issuing offers every day. The difference is that you can no longer guess your way through — you need a strategic narrative that highlights your value and resilience. That’s exactly what this bootcamp gives you.</p>
            </div>
          </div>
        </section>

        {/* ── Curriculum ───────────────────────────────────────── */}
        <section className="bg-surface" aria-labelledby="curriculum-heading">
          <div className="container-site py-16 lg:py-20">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary text-center mb-3">The 8-session blueprint</p>
            <h2 id="curriculum-heading" className="text-headline-lg text-center mb-12">The exact blueprint we’re handing you</h2>
            <ol className="grid gap-5 md:grid-cols-2 max-w-5xl mx-auto">
              {SESSIONS.map((s) => (
                <li key={s.n} className="card flex gap-4">
                  <div className="shrink-0 text-center">
                    <span className="block text-2xl font-bold text-electric leading-none">{String(s.n).padStart(2, '0')}</span>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-primary mt-1">{s.date}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy mb-1">{s.title}</h3>
                    <p className="text-ink-muted text-sm leading-relaxed">{s.outcome}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Bonuses ──────────────────────────────────────────── */}
        <section className="container-site py-16 lg:py-20" aria-labelledby="bonus-heading">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary text-center mb-3">What’s in it for you</p>
          <h2 id="bonus-heading" className="text-headline-lg text-center mb-4">You’re not just getting live classes — you’re getting the tools to win</h2>
          <p className="text-ink-muted text-center max-w-2xl mx-auto mb-12">Register for the full bootcamp and instantly unlock our premium resource bundle to fast-track your cycle.</p>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {BONUSES.map((b) => (
              <div key={b.title} className="card flex flex-col gap-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-tint text-primary mb-1" aria-hidden="true"><CheckIcon /></span>
                <h3 className="text-lg font-bold text-navy">{b.title}</h3>
                <p className="text-ink-muted text-sm leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Facilitators ─────────────────────────────────────── */}
        <section className="bg-surface" aria-labelledby="facilitators-heading">
          <div className="container-site py-16 lg:py-20">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary text-center mb-3">Meet your facilitators</p>
            <h2 id="facilitators-heading" className="text-headline-lg text-center mb-4">Learn from people who’ve actually done it</h2>
            <p className="text-ink-muted text-center max-w-2xl mx-auto mb-12">Chevening, DAAD, Mastercard Foundation and Forté scholars, MBAs from Columbia, Duke and Kellogg, and admissions and visa specialists — each session is led by someone with direct, relevant experience.</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {FACILITATORS.map((f) => (
                <article key={f.name} className="bg-white rounded-xl border border-black/5 overflow-hidden flex flex-col">
                  <div className="aspect-[4/5] bg-surface-tint overflow-hidden">
                    <img src={f.photo} alt={f.name} width={600} height={750} loading="lazy" className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="inline-flex self-start items-center text-[11px] font-semibold uppercase tracking-wide text-primary bg-surface-tint px-2.5 py-1 rounded-full mb-3">{f.session}</span>
                    <h3 className="text-lg font-bold text-navy leading-tight">{f.name}</h3>
                    <p className="text-primary text-sm font-medium mb-3">{f.credential}</p>
                    <p className="text-ink-muted text-sm leading-relaxed">{f.bio}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonial ──────────────────────────────────────── */}
        <section className="container-site py-16 lg:py-20" aria-labelledby="proof-heading">
          <h2 id="proof-heading" className="text-headline-lg text-center mb-10">Trusted by applicants who got in</h2>
          <figure className="max-w-3xl mx-auto card">
            <svg viewBox="0 0 24 24" className="w-9 h-9 text-electric mb-4" fill="currentColor" aria-hidden="true"><path d="M7.17 6A5.17 5.17 0 002 11.17V18h6.83v-6.83H5.5A1.67 1.67 0 017.17 9.5V6zm9 0A5.17 5.17 0 0011 11.17V18h6.83v-6.83H14.5A1.67 1.67 0 0116.17 9.5V6z"/></svg>
            <blockquote className="text-lg text-ink leading-relaxed">
              <p>I always wanted to work with Elevate because of the testimonials I saw from other people. What I liked most was how fully involved they kept me at every stage — from school selection to securing admission, visa application, and relocating to the UK. They prepared me very well for all my interviews and encouraged me even when some didn’t go as planned. I never had to worry, because I was constantly updated until I received my admission.</p>
            </blockquote>
            <figcaption className="mt-5 font-semibold text-navy">Fafali Bona-Lartey <span className="text-ink-muted font-normal">· admitted &amp; relocated to the UK</span></figcaption>
          </figure>
          <p className="text-center text-ink-muted text-sm mt-6">…and many more video testimonials from past clients including Isaac Okraku, Nana Adwoa Abban, Rachel Arthur, Clive Annan, and Adwoa Atuahene.</p>
        </section>

        {/* ── Tickets / Pricing ────────────────────────────────── */}
        <section id="tickets" className="bg-surface scroll-mt-20" aria-labelledby="tickets-heading">
          <div className="container-site py-16 lg:py-20">
            <h2 id="tickets-heading" className="text-headline-lg text-center mb-3">Your entire grad school journey, solved in 8 sessions</h2>
            <p className="text-ink-muted text-center max-w-2xl mx-auto mb-12">Choose the option that fits where you are right now.</p>
            <div className="grid gap-6 lg:grid-cols-2 max-w-4xl mx-auto items-stretch">
              {/* Full pass */}
              <article className="card flex flex-col border-2 border-primary relative">
                <span className="absolute -top-3 left-6 bg-primary text-white text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">Best value</span>
                <h3 className="text-headline-md text-navy mt-2">The Full Access Pass</h3>
                <p className="text-ink-muted text-sm mt-2 mb-5">All 8 live sessions, the 50+ Scholarships Pack, the 30+ Low-Tuition University list, and all session recordings.</p>
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-4xl font-bold text-primary">GHS 1,200</span>
                  <span className="text-ink-muted line-through">GHS 1,500</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-electric mb-6">Early-bird price — limited seats</p>
                <ul className="flex flex-col gap-2.5 mb-7 text-sm text-ink">
                  {['All 8 live sessions + Q&As', 'The Ultimate Funding Pack (50+ scholarships)', 'The Smart School List (30+ universities)', '90 days of replay access', 'Dedicated WhatsApp community'].map((x) => (
                    <li key={x} className="flex items-start gap-2.5"><CheckIcon />{x}</li>
                  ))}
                </ul>
                <button type="button" className="btn-primary w-full mt-auto buy-btn" data-service-id="bootcamp-grad-full">
                  Register for the full bootcamp
                </button>
              </article>

              {/* Drop-in */}
              <article className="card flex flex-col">
                <h3 className="text-headline-md text-navy">The Drop-In Pass</h3>
                <p className="text-ink-muted text-sm mt-2 mb-5">Only need help with your essays, or just want to master graduate assistantships? Pick the specific sessions you need right now.</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-bold text-primary">GHS 300</span>
                  <span className="text-ink-muted">/ session</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-6">Buy only what you need</p>
                <ul className="flex flex-col gap-2.5 mb-7 text-sm text-ink">
                  {['Attend any single session live', 'Includes that session’s Q&A', 'Replay access for the session you pick'].map((x) => (
                    <li key={x} className="flex items-start gap-2.5"><CheckIcon />{x}</li>
                  ))}
                </ul>
                <button type="button" className="btn-secondary w-full buy-btn" data-service-id="bootcamp-grad-dropin">
                  Buy a single session
                </button>
                <a href={DROPIN_WA} target="_blank" rel="noopener" className="text-center text-sm text-primary underline underline-offset-4 hover:text-navy mt-3">
                  Prefer to choose first? Message us
                </a>
              </article>
            </div>
            <p className="text-center text-xs text-ink-muted mt-8">Secured by Paystack · cards &amp; mobile money. After checkout we’ll confirm your session details by email and WhatsApp.</p>
          </div>
        </section>

        {/* ── About ────────────────────────────────────────────── */}
        <section className="container-site py-16 lg:py-20" aria-labelledby="about-heading">
          <div className="max-w-3xl mx-auto text-center">
            <h2 id="about-heading" className="text-headline-lg mb-4">What is the Get Into Grad School Bootcamp?</h2>
            <p className="text-ink-muted leading-relaxed">
              It’s an 8-session intensive programme that walks you through the entire graduate school application process — from choosing the right programme and building your school list, to writing your personal statement, securing funding, and preparing to arrive on campus. Whether you’re just starting to explore your options or already in the middle of messy applications, we walk with you through every single step.
            </p>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="bg-surface" aria-labelledby="faq-heading">
          <div className="container-site py-16 lg:py-20">
            <h2 id="faq-heading" className="text-headline-lg text-center mb-12">Questions we often get asked</h2>
            <div className="max-w-3xl mx-auto">
              <FAQAccordion groups={FAQ_GROUPS} />
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────── */}
        <section aria-labelledby="final-cta">
          <div className="container-site py-20">
            <div className="bg-gradient-to-br from-primary to-navy text-white rounded-xl p-10 sm:p-14 text-center shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-wider text-electric mb-3">Seats are limited — early-bird won’t last</p>
              <h2 id="final-cta" className="text-headline-lg text-white mb-5">Secure your future with confidence</h2>
              <p className="text-white/90 text-lg max-w-xl mx-auto mb-8">Stop guessing. Get the exact blueprint, the funding lists, and the people who’ve done it — all in one bootcamp.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <button type="button" className="btn-primary bg-electric text-navy hover:bg-electric-600 buy-btn" data-service-id="bootcamp-grad-full">
                  Register for the full bootcamp
                </button>
                <a href="#tickets" className="btn-secondary bg-transparent border-white text-white hover:bg-white/10">See ticket options</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
