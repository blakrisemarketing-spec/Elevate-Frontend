import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';
import { PricingPlan } from '../components/PricingPlan';
import { WhyChooseUs } from '../components/WhyChooseUs';
import { TestimonialsBlock } from '../components/TestimonialsBlock';
import { FinalCTA } from '../components/FinalCTA';

export function CareerServicesPage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="/career-services/" />

      <main id="main">
        <PageHero
          eyebrow="Career Services"
          title="Get the insider edge on your own terms"
          crumbs={[{ label: 'Home', href: '/' }, { label: 'Career Services' }]}
          intro={
            <p>
              You don&rsquo;t always need a total career makeover. Sometimes you just need that one missing piece, a CV that actually gets read, a LinkedIn profile that stops the scroll, or interview prep with someone who&rsquo;s actually hired for your role. Flex Services lets you grab exactly what you need, guided by a team that&rsquo;s been behind the closed doors of hiring.
            </p>
          }
        />

        {/* SECTION 1, Flex (à la carte) services */}
        <section aria-labelledby="flex-heading">
          <div className="container-site py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Career Flex Services</p>
              <h2 id="flex-heading" className="text-headline-lg">Pick exactly what you need</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 max-w-5xl mx-auto">
              {/* CV, tiered */}
              <article className="card flex flex-col h-full">
                <h3 className="text-headline-md mb-2">Curriculum Vitae (CV)</h3>
                <p className="text-sm font-semibold text-primary mb-3">Stop sending CVs into a black hole.</p>
                <p className="text-ink-muted leading-relaxed mb-5">
                  A weak CV doesn&rsquo;t always look &ldquo;bad&rdquo;, usually it just fails to tell a recruiter why they should keep reading. We don&rsquo;t just fix your CV; we translate your experience into the language recruiters use to make shortlisting decisions, whether you&rsquo;re applying down the street or across the ocean.
                </p>
                <ul className="flex flex-col gap-4 mt-auto">
                  <li>
                    <p className="text-sm text-ink mb-2"><span className="font-semibold text-navy">Early Career (0&ndash;3 yrs).</span> We turn internships, projects, volunteer work, and transferable skills into a CV that makes you the obvious choice.</p>
                    <button type="button" className="btn-primary buy-btn w-full" data-service-id="career-cv-early">₵350 Investment · Early Career</button>
                  </li>
                  <li>
                    <p className="text-sm text-ink mb-2"><span className="font-semibold text-navy">Experienced Professional (3&ndash;10 yrs).</span> We restructure and sharpen your experience into a clear, compelling professional story.</p>
                    <button type="button" className="btn-primary buy-btn w-full" data-service-id="career-cv-experienced">₵400 Investment · Experienced</button>
                  </li>
                  <li>
                    <p className="text-sm text-ink mb-2"><span className="font-semibold text-navy">Senior Executive (10+ yrs).</span> A leadership asset that communicates influence, strategic impact, and decision-making authority.</p>
                    <button type="button" className="btn-primary buy-btn w-full" data-service-id="career-cv-senior">₵450 Investment · Senior Executive</button>
                  </li>
                </ul>
              </article>

              {/* Cover letter, two options */}
              <article className="card flex flex-col h-full">
                <h3 className="text-headline-md mb-2">Cover Letter</h3>
                <p className="text-sm font-semibold text-primary mb-3">The cover letter that makes a recruiter pay attention.</p>
                <p className="text-ink-muted leading-relaxed mb-5">
                  A strong cover letter does more than repeat your CV. It communicates intent, clarity, personality, and alignment in a way most applications never do. Every letter is customised to the role, the company, and the expectations of the market you&rsquo;re targeting.
                </p>
                <div className="flex flex-col gap-3 mt-auto">
                  <button type="button" className="btn-primary buy-btn" data-service-id="career-cover-letter-local">₵350 Investment · Local applications</button>
                  <button type="button" className="btn-secondary buy-btn" data-service-id="career-cover-letter-intl">₵400 Investment · International applications</button>
                </div>
              </article>

              {/* LinkedIn */}
              <article className="card flex flex-col h-full">
                <h3 className="text-headline-md mb-2">LinkedIn Optimisation</h3>
                <p className="text-sm font-semibold text-primary mb-3">Your profile is either opening doors or quietly closing them.</p>
                <p className="text-ink-muted leading-relaxed flex-1">
                  Recruiters are looking for you long before a job is even posted. If your profile isn&rsquo;t optimised, you&rsquo;re essentially invisible. We optimise every aspect of your profile to turn it into a magnet that pulls recruiters in.
                </p>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-display-lg text-primary leading-none">₵400</span>
                </div>
                <button type="button" className="btn-primary buy-btn mt-5" data-service-id="career-linkedin">₵400 Investment</button>
              </article>

              {/* Interview prep */}
              <article className="card flex flex-col h-full">
                <h3 className="text-headline-md mb-2">1-on-1 Interview Preparation</h3>
                <p className="text-sm font-semibold text-primary mb-3">Practice with someone who&rsquo;s actually sat on the other side of the table.</p>
                <p className="text-ink-muted leading-relaxed flex-1">
                  Most prep is just memorising &ldquo;safe&rdquo; answers, that&rsquo;s not how you get the job. We pair you with an expert who works in your field. They&rsquo;ll tell you what the interviewer is really listening for, even the things they don&rsquo;t put in the job description.
                </p>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-display-lg text-primary leading-none">₵500</span>
                </div>
                <button type="button" className="btn-primary buy-btn mt-5" data-service-id="career-interview-prep">₵500 Investment</button>
              </article>

              {/* Career strategy, consultation */}
              <article className="card flex flex-col h-full lg:col-span-2">
                <h3 className="text-headline-md mb-2">1-on-1 Career Strategy Session</h3>
                <p className="text-sm font-semibold text-primary mb-3">Figure out your next move with someone who knows the market.</p>
                <p className="text-ink-muted leading-relaxed flex-1">
                  Most career advice is completely generic, &ldquo;just network more&rdquo; or &ldquo;follow your passion.&rdquo; That doesn&rsquo;t help when you&rsquo;re trying to pivot industries, move abroad, or break into a space where you don&rsquo;t know anyone. This is a strategic deep dive into your skills, your goals, and the reality of the market you&rsquo;re targeting, ending with a step-by-step plan to land the role you want.
                </p>
                <a href="/contact-us/" className="btn-primary mt-5 self-start">Book a strategy session</a>
              </article>
            </div>
          </div>
        </section>

        {/* SECTION 2, Bundles */}
        <section className="bg-surface" aria-labelledby="bundles-heading">
          <div className="container-site py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Career Bundles</p>
              <h2 id="bundles-heading" className="text-headline-lg">Everything you need to go from &ldquo;Applicant&rdquo; to &ldquo;Hired&rdquo;</h2>
              <p className="text-ink-muted leading-relaxed mt-4">
                The system rewards people who have the full package. Our bundles bring your CV, your LinkedIn, and your interview game into one cohesive strategy, no more patching it together.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
              <PricingPlan
                tier="Starter Bundle"
                price="₵1,100"
                serviceId="bundle-starter"
                ctaLabel="₵1,100 Investment"
                features={[
                  '1 professionally written CV, tailored to your level and target role',
                  '1 cover letter for your specific role or market',
                  'A full LinkedIn profile makeover, headline, summary, experience, keywords, and positioning',
                ]}
                footnote="The foundation every serious job seeker needs."
              />
              <PricingPlan
                tier="Job Market Accelerator"
                price="₵2,000"
                highlighted
                serviceId="bundle-accelerator"
                ctaLabel="₵2,000 Investment"
                features={[
                  'Everything in Starter',
                  '1 one-on-one career consultation on your search, positioning, and next move',
                  '1 one-on-one interview prep session with an industry expert in your field',
                ]}
                footnote="For the professional who is done “trying” and ready to start winning."
              />
              <PricingPlan
                tier="Premium Job Search"
                price="₵5,000"
                serviceId="bundle-premium"
                ctaLabel="₵5,000 Investment"
                features={[
                  '3 tailored CVs, adapted for different roles or industries',
                  '3 cover letters, each for a specific target',
                  'A full LinkedIn profile makeover',
                  '3 one-on-one career consultations',
                  '3 one-on-one interview prep sessions with matched experts',
                ]}
                footnote="Your job search complete support system, for mid-career and senior professionals."
              />
              <PricingPlan
                tier="Comprehensive Job Search"
                price="₵8,250"
                serviceId="bundle-comprehensive"
                ctaLabel="₵8,250 Investment"
                features={[
                  '5 tailored CVs, each adapted to a specific role and company',
                  '5 cover letters, each for the application it supports',
                  'A full LinkedIn profile makeover',
                  '5 one-on-one career consultations, from search design to negotiation',
                  '5 one-on-one interview prep sessions with role-matched experts',
                ]}
                footnote="Your own personal job search engine, our highest level of support."
              />
            </div>

            {/* Closing CTA */}
            <div className="max-w-3xl mx-auto mt-12 bg-white rounded-2xl p-8 text-center shadow-card">
              <h3 className="text-headline-md mb-4">Still deciding? Let&rsquo;s find your fit.</h3>
              <ul className="text-sm text-ink-muted leading-relaxed space-y-1 mb-6">
                <li>Just getting started (or returning after a break)? Go with the <span className="font-semibold text-navy">Starter Bundle</span>.</li>
                <li>Actively searching and need a real strategy? The <span className="font-semibold text-navy">Accelerator</span> was built for you.</li>
                <li>Running a high-stakes, multi-application campaign? The <span className="font-semibold text-navy">Premium</span> or <span className="font-semibold text-navy">Comprehensive</span> bundles give you heavy-duty support.</li>
              </ul>
              <a href="/contact-us/" className="btn-primary">Book a free consultation</a>
            </div>
          </div>
        </section>

        <WhyChooseUs background="canvas" />
        <TestimonialsBlock background="surface" />
        <FinalCTA />
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
