import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';
import { PricingPlan } from '../components/PricingPlan';
import { WhyChooseUs } from '../components/WhyChooseUs';
import { TestimonialsBlock } from '../components/TestimonialsBlock';
import { FinalCTA } from '../components/FinalCTA';

export function EducationalServicesPage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="/educational-services/" />

      <main id="main">
        <PageHero
          eyebrow="Grad School Services"
          title="Stop guessing what admissions committees want to see"
          crumbs={[{ label: 'Home', href: '/' }, { label: 'Educational Services' }]}
          intro={
            <p>
              Getting into a top-tier programme &mdash; whether it&rsquo;s an MBA in the US, an MSc in Germany, or a fully funded scholarship in the Netherlands &mdash; takes more than good grades. We help you navigate the unwritten rules of global admissions, with documents that speak the language of each institution and support from people who have seen the inside of this process from every angle.
            </p>
          }
        />

        {/* SECTION 1 — Flex (à la carte) services */}
        <section aria-labelledby="flex-heading">
          <div className="container-site py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Grad School Flex Services</p>
              <h2 id="flex-heading" className="text-headline-lg">Move from &ldquo;Outsider&rdquo; to &ldquo;Admitted&rdquo;</h2>
              <p className="text-ink-muted leading-relaxed mt-4">From picking the right schools to nailing your scholarship essays, choose exactly what you need.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 max-w-5xl mx-auto">
              {/* Grad CV — tiered */}
              <article className="card flex flex-col h-full">
                <h3 className="text-headline-md mb-2">Grad School CV</h3>
                <p className="text-sm font-semibold text-primary mb-3">An academic CV that stops the rejection cycle.</p>
                <p className="text-ink-muted leading-relaxed mb-5">
                  A grad school CV isn&rsquo;t a job description; it&rsquo;s an intellectual roadmap. AdComs want to see your research potential, leadership impact, and academic trajectory &mdash; not your daily office tasks. We translate your history into a narrative that signals you&rsquo;re ready for postgraduate study at the highest level.
                </p>
                <ul className="flex flex-col gap-4 mt-auto">
                  <li>
                    <p className="text-sm text-ink mb-2"><span className="font-semibold text-navy">Early Career (0&ndash;3 yrs).</span> For recent graduates moving into a first postgraduate application — positioned to speak directly to a master&rsquo;s admissions panel.</p>
                    <button type="button" className="btn-primary buy-btn w-full" data-service-id="edu-grad-cv-early">Pay ₵350 · Early Career</button>
                  </li>
                  <li>
                    <p className="text-sm text-ink mb-2"><span className="font-semibold text-navy">Experienced (3&ndash;10 yrs).</span> A CV that bridges your professional experience and your academic goals in a narrative that makes strategic sense to the AdComs.</p>
                    <button type="button" className="btn-primary buy-btn w-full" data-service-id="edu-grad-cv-experienced">Pay ₵400 · Experienced</button>
                  </li>
                  <li>
                    <p className="text-sm text-ink mb-2"><span className="font-semibold text-navy">Senior Executive (10+ yrs).</span> For executives pursuing MBAs, executive education, or research study — communicating leadership and a clear academic purpose.</p>
                    <button type="button" className="btn-primary buy-btn w-full" data-service-id="edu-grad-cv-senior">Pay ₵450 · Senior Executive</button>
                  </li>
                </ul>
              </article>

              {/* Essays — two lengths */}
              <article className="card flex flex-col h-full">
                <h3 className="text-headline-md mb-2">Statements &amp; Scholarship Essays</h3>
                <p className="text-sm font-semibold text-primary mb-3">The essay is where you win or lose.</p>
                <p className="text-ink-muted leading-relaxed mb-5">
                  The committee already knows your grades. The essay is the only place they see your <em>why</em>. We write personal statements, statements of purpose, study plans, and scholarship essays that are evidence-led and impact-oriented &mdash; mapping your journey directly to the programme&rsquo;s goals and the funder&rsquo;s criteria. Our clients have been shortlisted for Chevening, Gates Cambridge, Erasmus Mundus, DAAD, and Commonwealth.
                </p>
                <div className="flex flex-col gap-3 mt-auto">
                  <button type="button" className="btn-primary buy-btn" data-service-id="edu-essay-500">Pay ₵520 · up to 500 words</button>
                  <button type="button" className="btn-secondary buy-btn" data-service-id="edu-essay-1000">Pay ₵850 · up to 1,000 words</button>
                </div>
              </article>

              {/* LinkedIn */}
              <article className="card flex flex-col h-full">
                <h3 className="text-headline-md mb-2">LinkedIn Optimisation</h3>
                <p className="text-sm font-semibold text-primary mb-3">Yes, AdComs and scholarship boards will Google you.</p>
                <p className="text-ink-muted leading-relaxed flex-1">
                  Your application doesn&rsquo;t end with the PDF you upload. The moment an evaluator gets curious, they head to LinkedIn. We align your profile with your application narrative so that when they look you up, they find achievements that strengthen rather than complicate your case.
                </p>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-display-lg text-primary leading-none">₵400</span>
                </div>
                <button type="button" className="btn-primary buy-btn mt-5" data-service-id="edu-linkedin">Pay ₵400</button>
              </article>

              {/* School selection */}
              <article className="card flex flex-col h-full">
                <h3 className="text-headline-md mb-2">School Selection &amp; Programme Research</h3>
                <p className="text-sm font-semibold text-primary mb-3">Apply where the door is already ajar.</p>
                <p className="text-ink-muted leading-relaxed flex-1">
                  One of the most expensive mistakes you can make is applying to a big-name school that&rsquo;s a bad fit for your profile or your wallet. We build a strategic, realistic shortlist across Europe, the UK, and Canada based on where you have the highest chance of admission &mdash; and, more importantly, funding.
                </p>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-display-lg text-primary leading-none">₵500</span>
                </div>
                <button type="button" className="btn-primary buy-btn mt-5" data-service-id="edu-school-selection">Pay ₵500</button>
              </article>

              {/* Consultation & interview prep */}
              <article className="card flex flex-col h-full lg:col-span-2">
                <h3 className="text-headline-md mb-2">1-on-1 Consultation &amp; Interview Preparation</h3>
                <p className="text-sm font-semibold text-primary mb-3">Talk to someone who&rsquo;s been inside the room.</p>
                <p className="text-ink-muted leading-relaxed flex-1">
                  Consultations cover application strategy, programme selection, essay direction, and any part of the process where you need clarity before moving forward. Interview preparation is available for programmes that require it &mdash; including MBA programmes, scholarship finals, and research degree interviews &mdash; grounded in real knowledge of what panels in the UK, Europe, and North America are looking for.
                </p>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-display-lg text-primary leading-none">₵500</span>
                  <span className="text-sm text-ink-muted">per session</span>
                </div>
                <button type="button" className="btn-primary buy-btn mt-5 self-start" data-service-id="edu-consultation">Pay ₵500 · per session</button>
              </article>
            </div>

            {/* Flex CTA */}
            <div className="max-w-3xl mx-auto mt-12 bg-surface rounded-2xl p-8 text-center">
              <h3 className="text-headline-md mb-3">Not sure where to start?</h3>
              <p className="text-ink-muted leading-relaxed mb-6">
                Every application is different. Maybe you&rsquo;ve got the grades but no idea how to write the essay, or the dream but no school list. Tell us where you are, and we&rsquo;ll tell you exactly which key you need to open the door.
              </p>
              <a href="/contact-us/" className="btn-primary">Book a free consultation</a>
            </div>
          </div>
        </section>

        {/* SECTION 2 — Bundles */}
        <section className="bg-surface" aria-labelledby="bundles-heading">
          <div className="container-site py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Grad School Bundles</p>
              <h2 id="bundles-heading" className="text-headline-lg">Full support, from strategy to submission</h2>
              <p className="text-ink-muted leading-relaxed mt-4">
                The applications that get shortlisted come from applicants who are strategically prepared and have a system beside them. Our bundles give you end-to-end support across every essay, document, and deadline.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
              <PricingPlan
                tier="Strategic Bundle"
                price="₵1,800"
                serviceId="edu-bundle-strategic"
                ctaLabel="Pay ₵1,800"
                features={[
                  'A curated school list based on your funding goals',
                  '1 tailored Grad School CV',
                  '1 Personal Statement',
                  'A 1-on-1 strategy session to map out your win',
                ]}
                footnote="The blueprint for those who aren’t sure where to start."
              />
              <PricingPlan
                tier="Silver Bundle"
                variant="Masters / Taught"
                price="₵9,000"
                serviceId="edu-bundle-silver-general"
                ctaLabel="Pay ₵9,000"
                features={[
                  'A recommended schools list',
                  'Grad school CV(s), tailored to each programme',
                  '4 tailored Personal Statements (no templates)',
                  '8 reference letter drafts',
                  'Full scholarship essay support',
                  '4 strategic sessions',
                  'Full LinkedIn optimisation',
                  'Application review before submission',
                ]}
                footnote="A complete, expert-led cycle for competitive Master’s programmes."
              />
              <PricingPlan
                tier="Silver Bundle"
                variant="MBA / MFA / MRes"
                price="₵12,000"
                highlighted
                serviceId="edu-bundle-silver-mba"
                ctaLabel="Pay ₵12,000"
                features={[
                  'A recommended schools list',
                  'Grad school CV(s)',
                  '4 personal statements / SOPs / research proposals',
                  '8 reference letter drafts',
                  'Full LinkedIn optimisation',
                  'All scholarship and admissions essays',
                  '4 one-on-one sessions, incl. pre-application strategy',
                  'Interview prep for MBA and research supervision interviews',
                  'Application review before each submission',
                ]}
                footnote="Built for the complexity of MBA, MFA, and research degree applications."
              />
              <PricingPlan
                tier="Gold Bundle"
                price="₵14,000"
                serviceId="edu-bundle-gold"
                ctaLabel="Pay ₵14,000"
                features={[
                  'A recommended schools list, built around your profile and funding goals',
                  'Grad school CV(s), tailored to each programme',
                  '4 personal statements, each for a specific programme',
                  '8 reference letter drafts',
                  'Full LinkedIn optimisation',
                  'All scholarship and admissions essays',
                  'Interview preparation, where required',
                  'One-on-one guidance throughout the entire process',
                  'The entire application is done on your behalf',
                ]}
                footnote="Your entire application cycle, handled."
              />
            </div>

            {/* Closing CTA */}
            <div className="max-w-3xl mx-auto mt-12 bg-white rounded-2xl p-8 text-center shadow-card">
              <h3 className="text-headline-md mb-4">Still weighing your options?</h3>
              <ul className="text-sm text-ink-muted leading-relaxed space-y-1 mb-6">
                <li>Just exploring and need a map? The <span className="font-semibold text-navy">Strategic Bundle</span> is your first step.</li>
                <li>Ready to apply to your dream schools? The <span className="font-semibold text-navy">Silver Bundle</span> (General or MBA/MRes) covers your full cycle.</li>
                <li>Want us to handle the entire process for you? The <span className="font-semibold text-navy">Gold Bundle</span> was built for you.</li>
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
