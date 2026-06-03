import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';
import { PriceCard } from '../components/PriceCard';
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
          eyebrow="Our Career Services"
          title="Career Services That Help You Stand Out"
          crumbs={[{ label: 'Home', href: '/' }, { label: 'Career Services' }]}
          intro={<p>Get expert support with CV writing, cover letters, LinkedIn optimization, interview preparation, and career bundles tailored to your goals.</p>}
        />

        {/* À la carte */}
        <section aria-labelledby="alacarte-heading">
          <div className="container-site py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">À la carte</p>
              <h2 id="alacarte-heading" className="text-headline-lg">Standalone Career Services</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <PriceCard
                title="Curriculum Vitae"
                description="Our Curriculum Vitae (CV) service at Elevate goes beyond mere documentation — it's a strategic masterpiece designed to showcase your skills, experiences, and accomplishments effectively."
                price="₵ 350"
                serviceId="career-cv"
              />
              <PriceCard
                title="Cover Letter"
                description="Our service crafts a narrative that highlights your strengths and aspirations. Make a lasting impression and stand out in the competitive job market with a cover letter that speaks directly to your potential employers."
                price="₵ 300"
                serviceId="career-cover-letter"
              />
              <PriceCard
                title="LinkedIn Optimization"
                description="We fine-tune your LinkedIn profile to attract attention, showcase your skills, and maximize networking opportunities."
                price="₵ 380"
                serviceId="career-linkedin"
              />
              <PriceCard
                title="1-on-1 Interview Prep"
                description="Our experienced coaches tailor sessions to your specific needs, helping you refine your skills, boost confidence, and excel in your upcoming interviews."
                price="₵ 450"
                serviceId="career-interview-prep"
              />
            </div>
          </div>
        </section>

        {/* Pricing plans */}
        <section className="bg-surface" aria-labelledby="bundles-heading">
          <div className="container-site py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Pricing Plans</p>
              <h2 id="bundles-heading" className="text-headline-lg">Affordable Pricing Packages For Your Career Advancement</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              <PricingPlan
                tier="Bronze Career Bundle"
                price="₵ 1,800"
                ctaLabel="Pay ₵ 1,800"
                serviceId="bundle-bronze"
                features={[
                  '1-on-1 Career Consultation',
                  '1 Resume',
                  'Cover Letter',
                  'LinkedIn Makeover',
                  '1-on-1 Interview Prep Session',
                ]}
              />
              <PricingPlan
                tier="Silver Career Bundle"
                price="₵ 3,000"
                highlighted
                ctaLabel="Pay ₵ 3,000"
                serviceId="bundle-silver"
                features={[
                  '1-on-1 Career Consultation',
                  '3 Resumes',
                  '3 Cover Letters',
                  'LinkedIn Makeover',
                  '1-on-1 Interview Prep Session',
                ]}
              />
              <PricingPlan
                tier="Gold Career Bundle"
                price="₵ 4,200"
                ctaLabel="Pay ₵ 4,200"
                serviceId="bundle-gold"
                features={[
                  '1-on-1 Career Consultation',
                  '5 Resumes',
                  '5 Cover Letters',
                  'LinkedIn Makeover',
                  '1-on-1 Interview Prep Session',
                ]}
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
