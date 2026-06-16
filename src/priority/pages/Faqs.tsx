import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';
import { FinalCTA } from '../components/FinalCTA';
import { FAQAccordion } from '../components/FAQAccordion';
import { SITE_FAQ_GROUPS as FAQ_GROUPS } from '../data/faqs';

export function FaqsPage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="" />

      <main id="main">
        <PageHero
          eyebrow="FAQs"
          title="Frequently asked questions"
          crumbs={[{ label: 'Home', href: '/' }, { label: 'FAQs' }]}
          intro={<p>Answers to the questions we hear most. Still stuck? Message us on WhatsApp and we’ll help.</p>}
        />

        <section className="container-site py-16" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="sr-only">Frequently asked questions</h2>
          <div className="max-w-3xl mx-auto">
            <FAQAccordion groups={FAQ_GROUPS} />
          </div>
        </section>

        <FinalCTA
          eyebrow="Still have a question?"
          heading="Ask us anything"
          subheading="Tell us what you’re working on and we’ll point you to the right next step — no insider network required."
        />
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
