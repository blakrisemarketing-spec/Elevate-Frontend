import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';
import { PriceCard } from '../components/PriceCard';
import { PricingPlan } from '../components/PricingPlan';
import { WhyChooseUs } from '../components/WhyChooseUs';
import { TestimonialsBlock } from '../components/TestimonialsBlock';
import { FinalCTA } from '../components/FinalCTA';

const SHARED_FEATURES = [
  'Grad School CV(s) tailored to each program and school',
  'Personalized list of potential schools based on your background (you can also decide on your own schools)',
  '4 Personal statements tailored to each program and school',
  '8 Reference letter drafts',
  'LinkedIn Profile Optimization',
  'Any scholarship (or other admission) essays',
];

const FOOTNOTE = 'Services are subject to terms and conditions. We only accept a few applicants per year, to uphold the "Elevate standard".';

export function EducationalServicesPage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="/educational-services/" />

      <main id="main">
        <PageHero
          eyebrow="Our Education Services"
          title="Education Support for Stronger Applications"
          crumbs={[{ label: 'Home', href: '/' }, { label: 'Educational Services' }]}
          intro={<p>Prepare stronger graduate school and scholarship applications with support for CVs, essays, school selection, references, and interviews.</p>}
        />

        {/* À la carte */}
        <section aria-labelledby="alacarte-heading">
          <div className="container-site py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">À la carte service</p>
              <h2 id="alacarte-heading" className="text-headline-lg">Standalone Educational Services</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <PriceCard
                title="Grad School CV"
                description="Let us help you stand out and make a lasting impression on admissions committees with a compelling CV that showcases your potential and take the next step towards your academic aspirations with confidence."
                price="₵ 350"
                serviceId="edu-grad-cv"
              />
              <PriceCard
                title="Reference Letter Draft"
                description="Enhance your application with our Reference Letter Draft Services. Our experienced team crafts personalized reference letters that highlight your strengths, achievements, and qualifications."
                price="₵ 300"
                priceNote="per letter"
                serviceId="edu-reference-letter"
              />
              <PriceCard
                title="LinkedIn Optimization"
                description="We fine-tune your LinkedIn profile to attract attention, showcase your skills, and maximize networking opportunities. Let your LinkedIn profile become a powerful tool for career advancement."
                price="₵ 380"
                serviceId="edu-linkedin"
              />
              <PriceCard
                title="Suggestion of Schools"
                description="Discover the perfect fit for your ambitions with our tailored university suggestions. Let our expert advisors guide you to the ideal universities based on your academic goals, preferences, and aspirations."
                price="₵ 400"
                serviceId="edu-school-suggestion"
              />
              <PriceCard
                title="1-on-1 Interview Prep"
                description="Our experienced coaches tailor sessions to your specific needs, helping you refine your skills, boost confidence, and excel in your upcoming interviews."
                price="₵ 450"
                serviceId="edu-interview-prep"
              />
              {/* SOP has two purchasable lengths → two buy buttons in one card */}
              <article className="card flex flex-col h-full">
                <h3 className="text-headline-md mb-3">Statement of Purpose / Scholarship Essay</h3>
                <p className="text-ink-muted leading-relaxed flex-1">Our expert guidance ensures your unique story and aspirations shine through. Stand out with an essay that articulates your goals, passions, and potential for success.</p>
                <div className="mt-5 flex flex-col gap-3">
                  <button type="button" className="btn-primary buy-btn" data-service-id="edu-sop-500">Pay ₵ 470 · 500 words</button>
                  <button type="button" className="btn-secondary buy-btn" data-service-id="edu-sop-1000">Pay ₵ 750 · 1000 words</button>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Pricing packages */}
        <section className="bg-surface" aria-labelledby="packages-heading">
          <div className="container-site py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Pricing Plans</p>
              <h2 id="packages-heading" className="text-headline-lg">Cost-Effective Packages For Your Educational Needs</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              <PricingPlan
                tier="Silver Package"
                variant="General"
                features={[
                  ...SHARED_FEATURES,
                  '1 one-on-one coaching session',
                  'Applications review',
                  'The entire application is done on your behalf',
                ]}
                footnote={FOOTNOTE}
                ctaLabel="I am interested"
              />
              <PricingPlan
                tier="Silver Package"
                variant="MBA"
                highlighted
                features={[
                  ...SHARED_FEATURES,
                  '4 one-on-one coaching sessions',
                  'Pre-application strategy session',
                  'Applications review',
                  'The entire application is done on your behalf',
                ]}
                footnote={FOOTNOTE}
                ctaLabel="I am interested"
              />
              <PricingPlan
                tier="Gold Package"
                variant="General"
                features={[
                  'Includes everything in Silver (MBA), plus:',
                  'Priority guidance and support throughout the process',
                  'The entire application is done on your behalf',
                  'Priority in scholarship applications',
                  'Advanced schools research',
                  'Bi-weekly school application reports',
                ]}
                footnote={FOOTNOTE}
                ctaLabel="I am interested"
              />
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
