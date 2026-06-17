import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';

const REGISTER_WA =
  'https://wa.me/233531113454?text=Hello%20Elevate%20Career%20Hub%2C%20I%27d%20like%20to%20register%20for%20the%20Job%20Readiness%20Bootcamp.';

const OUTCOMES = [
  'Build a targeted job search plan so you stop spraying applications and hoping',
  'Align your CV to the job description so you actually get noticed by recruiters',
  'Present a clear, credible professional brand that attracts offers',
  'Use networking and referrals strategically, without sounding desperate',
  'Answer interview questions with clarity, structure, and confidence',
  'Use AI the right way so it helps you instead of quietly harming your chances',
  'Identify and apply for remote roles safely (and avoid scams)',
  'Understand what visa-sponsored, international roles realistically look like',
];

const SESSIONS = [
  { n: '01', title: 'Building a targeted job search plan that gets results', body: 'Career gap analysis, goal setting, the 2026 job market, and a realistic plan. You stop applying randomly.' },
  { n: '02', title: 'Becoming a recruiter’s top choice in screening', body: 'How ATS and recruiters filter applications, why strong CVs still get rejected, keyword strategy, and referrals.' },
  { n: '03', title: 'Building a personal brand that attracts opportunities', body: 'LinkedIn optimisation for recruiter discovery and using social media intentionally.' },
  { n: '04', title: 'Networking, referrals & the hidden job market', body: 'Contacting hiring managers professionally, strategic networking, and follow-up rules that work.' },
  { n: '05', title: 'How to ace every interview stage', body: 'How hiring managers assess you, structuring strong answers, and smart follow-up emails.' },
  { n: '06', title: 'Leveraging AI in your job search & skills building', body: 'Using AI to find roles, screen job descriptions, and tailor applications, without getting flagged.' },
  { n: '07', title: 'Landing international / visa-sponsored roles', body: 'Markets open to international hires, sponsorship realities, CV adjustments, and global job boards.' },
  { n: '08', title: 'The blueprint for landing remote jobs', body: 'What remote employers worry about, where legit remote jobs are posted, and scam red flags.' },
];

const TESTIMONIALS = [
  { quote: 'Right after school, with the help of Elevate, I got my first role with JP Morgan. Elevate has been my go-to partner for everything career-related, one of the best, if not the best in the industry.' },
  { quote: 'As an immigrant in the Netherlands, Elevate helped me land an enviable role with the Dutch Relief Alliance. They’re the best in the game!' },
  { quote: 'Elevate guided me through every step until I landed a role at KPMG. I couldn’t have done it without them. So grateful!' },
];

export function JobReadinessBootcampPage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="" />

      <main id="main">
        <PageHero
          eyebrow="Job Readiness Bootcamp"
          title="Stop applying blindly. Start getting interviews."
          crumbs={[{ label: 'Home', href: '/' }, { label: 'Job Readiness Bootcamp' }]}
          intro={
            <p>
              You’re qualified, but your applications aren’t getting you seen. The gap between &lsquo;good enough&rsquo; and &lsquo;obvious choice&rsquo; is smaller than you think, and we close it in 8 focused, live online sessions.
            </p>
          }
        />

        <section className="container-site py-16" aria-labelledby="why-heading">
          <div className="max-w-3xl">
            <h2 id="why-heading" className="text-headline-lg mb-4">Why this bootcamp, why now</h2>
            <p className="text-ink-muted leading-relaxed mb-4">
              The job market is more competitive than ever, more applicants, fewer easy wins, and more silent rejections. For every job posted on LinkedIn there are, on average, 400+ resumes recruiters have to sort through.
            </p>
            <p className="text-ink-muted leading-relaxed">
              Finding a job in this market requires strategy and skill, your experience alone won’t cut it. In 8 focused sessions you’ll build a job search strategy that fits your background, position yourself as a recruiter’s obvious choice, network with confidence, and learn how to stand out for remote and international roles.
            </p>
          </div>
        </section>

        <section className="bg-surface" aria-labelledby="outcomes-heading">
          <div className="container-site py-16">
            <h2 id="outcomes-heading" className="text-headline-lg text-center mb-10">What you’ll walk away with</h2>
            <ul className="grid gap-3 sm:grid-cols-2 max-w-4xl mx-auto">
              {OUTCOMES.map((o, i) => (
                <li key={i} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-black/5">
                  <svg viewBox="0 0 20 20" className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 10l4 4 6-8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-sm text-ink">{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="container-site py-16" aria-labelledby="curriculum-heading">
          <h2 id="curriculum-heading" className="text-headline-lg text-center mb-3">The 8-session curriculum</h2>
          <p className="text-ink-muted text-center mb-10">Live online · 4–28 April 2026</p>
          <div className="grid gap-5 md:grid-cols-2 max-w-5xl mx-auto">
            {SESSIONS.map((s) => (
              <article key={s.n} className="card flex gap-4">
                <span className="text-2xl font-bold text-electric shrink-0" aria-hidden="true">{s.n}</span>
                <div>
                  <h3 className="text-lg font-bold text-navy mb-1">{s.title}</h3>
                  <p className="text-ink-muted text-sm leading-relaxed">{s.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-surface" aria-labelledby="instructor-heading">
          <div className="container-site py-16 max-w-3xl">
            <h2 id="instructor-heading" className="text-headline-lg mb-4">Your instructor</h2>
            <p className="text-ink-muted leading-relaxed">
              <strong className="text-navy">Naa Lamle Lamptey</strong>, Elevate co-founder, holds a Bachelor’s in Actuarial Science and a Master’s in Development Finance, and is pursuing an MBA at the Ross School of Business, University of Michigan. She works as a Global Finance Manager with a leading US company, bringing strong expertise in financial management and global business operations.
            </p>
          </div>
        </section>

        <section className="container-site py-16" aria-labelledby="results-heading">
          <h2 id="results-heading" className="text-headline-lg text-center mb-10">Results our clients have seen</h2>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <blockquote key={i} className="card text-ink-muted leading-relaxed text-sm">
                <p>&ldquo;{t.quote}&rdquo;</p>
              </blockquote>
            ))}
          </div>
        </section>

        <section aria-labelledby="register-heading">
          <div className="container-site py-20">
            <div className="bg-gradient-to-br from-primary to-navy text-white rounded-xl p-10 sm:p-14 text-center shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-wider text-electric mb-3">Seats are limited</p>
              <h2 id="register-heading" className="text-headline-lg text-white mb-5">Invest in your success, register today</h2>
              <p className="text-white/90 text-lg max-w-xl mx-auto mb-8">
                To keep sessions effective we cap the number of seats, and they sell out fast. Message us to secure your place.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href={REGISTER_WA} className="btn-primary bg-electric text-navy hover:bg-electric-600" target="_blank" rel="noopener">Register now</a>
                <a href="/contact-us/" className="btn-secondary bg-transparent border-white text-white hover:bg-white/10">Ask a question</a>
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
