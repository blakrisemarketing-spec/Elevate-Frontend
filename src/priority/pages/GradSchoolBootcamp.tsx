import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { FAQAccordion } from '../components/FAQAccordion';
import { VideoTestimonials } from '../components/VideoTestimonials';
import { FACILITATORS } from '../data/facilitators';
import { BOOTCAMP_VIDEO_TESTIMONIALS } from '../data/testimonials';
import { BOOTCAMP_FAQ_GROUPS as FAQ_GROUPS } from '../data/faqs';

const DROPIN_WA =
  'https://wa.me/233531113454?text=Hi%20Elevate%2C%20I%27d%20like%20to%20pick%20individual%20drop-in%20sessions%20for%20the%20Get%20Into%20Grad%20School%20Bootcamp.';

const QUICK_FACTS = [
  { label: '8 live sessions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: '26 Jul – 18 Aug 2026', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Live on Google Meet', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { label: '2 hours each + Q&A', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const SESSIONS = [
  { n: 1, date: 'Jul 26', title: 'Your Graduate School Game Plan', outcome: 'Make a confident, informed decision about which programme type, country, and schools fit your goals, instead of applying on guesswork or reputation alone.' },
  { n: 2, date: 'Jul 28', title: 'Becoming the Candidate Admissions Committees Cannot Overlook', outcome: 'The blueprint to format and position your profile so committees pause when they hit your name.' },
  { n: 3, date: 'Aug 2', title: 'The MBA Blueprint', outcome: 'A dedicated session for corporate professionals looking to pivot globally and maximise their grad school experience from day one.' },
  { n: 4, date: 'Aug 4', title: 'Personal Statements & Scholarship Essays', outcome: 'Our signature narrative strategy to break through writer’s block and draft an essay that stands out in a pool of thousands.' },
  { n: 5, date: 'Aug 9', title: 'Research Proposals, Pitching to Supervisors & Getting Funded', outcome: 'How to reach out to international academic supervisors and write proposals that make them want to say “yes.”' },
  { n: 6, date: 'Aug 11', title: 'Landing a Graduate Assistantship', outcome: 'A deep dive into graduate assistantships, one of the most underused funding routes for international students.' },
  { n: 7, date: 'Aug 16', title: 'Deep Dive on Scholarships', outcome: 'Real strategies from past winners of full-ride scholarships like Chevening, DAAD, and Forté, plus a curated, personalised funding list you can act on immediately.' },
  { n: 8, date: 'Aug 18', title: 'Visas & Getting Ready for School', outcome: 'From document compilation to visa interview prep, so you are 100% ready to confidently step onto a global campus.' },
];

const BONUSES = [
  { title: 'The Ultimate Funding Pack', body: 'A curated list of 50+ scholarships with open application windows.' },
  { title: 'The Smart School List', body: 'A guide to 30+ low-tuition universities with high funding rates for international applicants.' },
  { title: '90 Days of Replay Access', body: 'Every 2-hour session is recorded, including the live Q&As, and sent to your inbox to rewatch anytime.' },
  { title: 'Community & Support', body: 'Access to a dedicated WhatsApp group for extra support throughout your cycle.' },
  { title: 'No Experience Required', body: 'Nothing to prepare before Session 1, just show up with an open mind and a rough idea of your goals.' },
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
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy bg-electric px-3 py-1.5 rounded-full mb-6">
                  Get Into Grad School Bootcamp · Registration open
                </p>
                <h1 id="hero-heading" className="text-display-lg text-white mb-8">
                  Turn your “average” profile into an offer
                </h1>
                <div className="flex flex-wrap gap-4 items-center">
                  <button type="button" className="btn-primary bg-electric text-navy hover:bg-electric-600 buy-btn" data-service-id="bootcamp-grad-full">
                    Register for the bootcamp now
                  </button>
                  <a href="#tickets" className="text-white underline underline-offset-4 hover:text-electric-400 text-sm">
                    Can’t attend it all? See individual drop-in tickets &darr;
                  </a>
                </div>

                <ul className="flex flex-wrap gap-x-8 gap-y-3 mt-10">
                  {QUICK_FACTS.map((f) => (
                    <li key={f.label} className="flex items-center gap-2 text-white text-sm">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-electric-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={f.icon} strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Co-founders */}
              <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div aria-hidden="true" className="absolute -inset-3 sm:-inset-4 rounded-[2rem] bg-electric/15 rotate-2" />
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-card ring-1 ring-white/15">
                  <img src="/assets/founders/cofounders-together.webp" alt="Naa Lamle Lamptey and Rosemary Agyeiwah Great-Damzi, Elevate Career Hub co-founders" width={720} height={900} loading="eager" decoding="async" className="w-full h-full object-cover" />
                </div>
                <p className="relative text-center text-white/80 text-sm mt-6">
                  Led by Elevate co-founders <span className="text-white font-semibold">Naa</span> &amp; <span className="text-white font-semibold">Rosemary</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── The Problem ──────────────────────────────────────── */}
        <section className="container-site py-16 lg:py-20" aria-labelledby="problem-heading">
          <div className="max-w-3xl">
            <h2 id="problem-heading" className="text-headline-lg mb-5">Does your late-night browser look like this?</h2>
            <div className="space-y-4 text-ink-muted leading-relaxed">
              <p>It’s 11 PM. You have 15 different university tabs open, your head is spinning, and you’re staring at a blank Google Doc, typing and deleting the same first sentence. You know you have a great story to tell, but everything you write feels boring, and you have no idea how to make it compelling enough to stand out.</p>
              <p>And to make it worse, you keep asking whether your grad school dream is still valid, with headlines about countries tightening immigration rules. The UK has cut the Graduate visa from 24 to 18 months; in the US, students face increasing scrutiny and reports of sudden visa cancellations. The old way of applying, without a clear plan, is no longer enough.</p>
              <p className="text-ink font-medium">But here’s the good news: top universities are still actively seeking global talent and issuing offers every day. The difference is that you can no longer guess your way through, you need a strategic narrative that highlights your value and resilience. That’s exactly what this bootcamp gives you.</p>
            </div>
          </div>
        </section>

        {/* ── Free match tool CTA ──────────────────────────────── */}
        <section className="container-site pb-4" aria-labelledby="match-cta">
          <div className="rounded-2xl border-2 border-primary/20 bg-surface-tint/60 p-7 sm:p-9 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="flex-1">
              <p className="eyebrow text-primary mb-2">Not sure where you stand?</p>
              <h2 id="match-cta" className="text-headline-md text-navy mb-1">See the programs and scholarships you qualify for, free</h2>
              <p className="text-ink-muted text-sm">Take the 2-minute match and get a personalized shortlist before you decide.</p>
            </div>
            <a href="/grad-school-match/" className="btn-secondary shrink-0">Find my matches</a>
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
          <h2 id="bonus-heading" className="text-headline-lg text-center mb-4">You’re not just getting live classes, you’re getting the tools to win</h2>
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
            <p className="text-ink-muted text-center max-w-2xl mx-auto mb-12">Chevening, DAAD, Mastercard Foundation and Forté scholars, MBAs from Columbia, Duke and Kellogg, and admissions and visa specialists, each session is led by someone with direct, relevant experience.</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {FACILITATORS.map((f) => {
                const slug = f.photo.replace(/^.*\/|\.webp$/g, '');
                return (
                  <a key={f.name} href={`#fac-${slug}`} className="group bg-white rounded-xl border border-black/5 overflow-hidden flex flex-col no-underline hover:shadow-card transition-shadow">
                    <div className="aspect-[4/5] bg-surface-tint overflow-hidden">
                      <img src={f.photo} alt={f.name} width={600} height={750} loading="lazy" className="w-full h-full object-cover object-top" />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <span className="inline-flex self-start items-center text-[11px] font-semibold uppercase tracking-wide text-primary bg-surface-tint px-2.5 py-1 rounded-full mb-3">{f.session}</span>
                      <h3 className="text-lg font-bold text-navy leading-tight">{f.name}</h3>
                      <p className="text-primary text-sm font-medium mb-3">{f.credential}</p>
                      <span className="mt-auto inline-flex items-center gap-1 text-primary text-sm font-semibold group-hover:gap-2 transition-all">Read full bio &rarr;</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Full-bio modals, zero-JS, opened via CSS :target */}
          {FACILITATORS.map((f) => {
            const slug = f.photo.replace(/^.*\/|\.webp$/g, '');
            return (
              <div key={slug} id={`fac-${slug}`} className="bio-modal" role="dialog" aria-modal="true" aria-labelledby={`fac-${slug}-name`}>
                <a href="#_" className="bio-modal__backdrop" aria-label="Close bio" />
                <div className="bio-modal__panel">
                  <a href="#_" className="bio-modal__close" aria-label="Close bio">&times;</a>
                  <div className="flex items-center gap-4 mb-5 pr-6">
                    <img src={f.photo} alt="" width={160} height={200} loading="lazy" className="w-20 h-24 rounded-lg object-cover object-top shrink-0" />
                    <div>
                      <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-primary bg-surface-tint px-2.5 py-1 rounded-full mb-2">{f.session}</span>
                      <h3 id={`fac-${slug}-name`} className="text-xl font-bold text-navy leading-tight">{f.name}</h3>
                      <p className="text-primary text-sm font-medium">{f.credential}</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-ink-muted leading-relaxed">
                    {f.bio.map((para, i) => <p key={i}>{para}</p>)}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* ── Testimonial ──────────────────────────────────────── */}
        <section className="container-site py-16 lg:py-20" aria-labelledby="proof-heading">
          <h2 id="proof-heading" className="text-headline-lg text-center mb-10">Trusted by applicants who got in</h2>
          <VideoTestimonials items={BOOTCAMP_VIDEO_TESTIMONIALS} />
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
                  <span className="text-4xl font-bold text-primary">GHS 1,500</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-electric mb-6">Standard price, limited seats</p>
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
                  Choose your sessions
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
              It’s an 8-session intensive programme that walks you through the entire graduate school application process, from choosing the right programme and building your school list, to writing your personal statement, securing funding, and preparing to arrive on campus. Whether you’re just starting to explore your options or already in the middle of messy applications, we walk with you through every single step.
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
              <p className="text-sm font-semibold uppercase tracking-wider text-electric mb-3">Seats are limited, registration is open</p>
              <h2 id="final-cta" className="text-headline-lg text-white mb-5">Secure your future with confidence</h2>
              <p className="text-white/90 text-lg max-w-xl mx-auto mb-8">Stop guessing. Get the exact blueprint, the funding lists, and the people who’ve done it, all in one bootcamp.</p>
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
