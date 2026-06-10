import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';
import { FinalCTA } from '../components/FinalCTA';
import { FAQAccordion } from '../components/FAQAccordion';

/**
 * Copy is taken verbatim from the WordPress FAQs snapshot, with one factual
 * correction: payment methods now reflect the live Paystack integration (cards
 * and mobile money) rather than the old "PayPal / bank transfer" line.
 */
const FAQ_GROUPS = [
  {
    heading: 'General questions',
    items: [
      {
        question: 'What services do you offer?',
        answer:
          'Elevate Career Hub offers a range of career and educational services, including resume writing, interview coaching, school selection guidance, reference letter drafting, and more.',
      },
      {
        question: 'How do I get started with Elevate Career Hub?',
        answer:
          'Getting started is easy! Explore our website to learn more about our services, then message us on WhatsApp to discuss your specific needs and goals.',
      },
      {
        question: 'Are your services tailored to specific industries or fields?',
        answer:
          'Yes, our services are highly customizable and can be tailored to meet the unique needs of clients across various industries and fields.',
      },
    ],
  },
  {
    heading: 'Payment and process',
    items: [
      {
        question: 'What are your payment options?',
        answer:
          'We accept payments by card and mobile money, processed securely through Paystack.',
      },
      {
        question: 'How long does it take to complete a service?',
        answer:
          'The timeframe depends on the complexity of the service and your specific requirements. When we begin, we’ll give you an estimated timeline for completion.',
      },
      {
        question: 'What happens after I purchase a service?',
        answer:
          'After purchasing, one of our team members will contact you to discuss next steps and gather any additional information needed to proceed.',
      },
    ],
  },
  {
    heading: 'Educational services',
    items: [
      {
        question: 'Can you assist me with selecting the right school for my educational goals?',
        answer:
          'Yes, our school selection guidance is designed to help you identify schools that align with your academic aspirations and career goals.',
      },
      {
        question: 'What types of educational services do you offer?',
        answer:
          'We offer a range of educational services, including school selection guidance, academic planning, reference letter drafting, and more.',
      },
      {
        question: 'How can I benefit from your educational services?',
        answer:
          'Our educational services are tailored to help you make informed decisions about your academic journey — whether you’re applying to schools, planning your coursework, or seeking academic guidance.',
      },
    ],
  },
  {
    heading: 'Career services',
    items: [
      {
        question: 'Can you help me with my resume even if I have limited work experience?',
        answer:
          'Absolutely. Our resume writing services cater to clients at all stages of their career journey, including those with limited work experience.',
      },
      {
        question: 'Do you provide interview coaching for specific industries or job roles?',
        answer:
          'Yes, our interview coaching is customized to meet the specific needs of clients in various industries and job roles.',
      },
      {
        question: 'What types of career services do you offer?',
        answer:
          'We offer a range of career services, including resume writing, interview coaching, career strategy sessions, reference letter drafting, and more.',
      },
    ],
  },
];

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
