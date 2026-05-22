import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';
import { Stat } from '../components/Stat';
import { WhyChooseUs } from '../components/WhyChooseUs';
import { FAQAccordion } from '../components/FAQAccordion';
import { FinalCTA } from '../components/FinalCTA';

const FAQS = [
  {
    heading: 'General Questions',
    items: [
      { question: 'What services do you offer?', answer: 'Elevate Career Hub offers a range of career and educational services, including resume writing, interview coaching, school selection guidance, reference letter drafting, and more.' },
      { question: 'How do I get started with Elevate Career Hub?', answer: 'Getting started is easy! Simply explore our website to learn more about our services, and then schedule a consultation with one of our experts to discuss your specific needs and goals.' },
      { question: 'Are your services designed for specific industries or fields?', answer: 'Yes, our services are highly customizable and can be tailored to meet the unique needs of clients across various industries and fields.' },
    ],
  },
  {
    heading: 'Payment and Processes',
    items: [
      { question: 'What are your payment options?', answer: 'We accept various payment methods, including credit/debit cards, PayPal, and bank transfers.' },
      { question: 'How long does it take to complete a service?', answer: 'The timeframe for completing a service varies depending on its complexity and the client\'s specific requirements. During your consultation, we\'ll provide you with an estimated timeline for completion.' },
      { question: 'What happens after I purchase a service?', answer: 'After purchasing a service, you\'ll be contacted by one of our team members to discuss next steps and gather any additional information needed to proceed.' },
    ],
  },
  {
    heading: 'Educational Services Specifics',
    items: [
      { question: 'Can you assist me with selecting the right school for my educational goals?', answer: 'Yes, our school selection guidance services are designed to help clients identify schools that align with their academic aspirations and career goals.' },
    ],
  },
];

export function AboutPage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="/about/" />

      <main id="main">
        <PageHero
          eyebrow="About us"
          title="Crafting Careers, Building Educational Futures"
          crumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]}
          intro={
            <>
              <p className="mb-4">Welcome to Elevate Career Hub, where we believe in transforming careers through empowerment, education, and connections. Elevate is more than a career hub; we are a community of dedicated professionals, mentors, and learners who understand the dynamic nature of the professional world.</p>
              <p>Our team is passionate about guiding individuals toward fulfilling and rewarding career and educational paths.</p>
            </>
          }
        />

        {/* Vision + Mission */}
        <section className="container-site py-16 grid gap-6 md:grid-cols-2">
          <article className="card">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Our Vision</p>
            <h2 className="text-headline-md mb-3">A world where every individual can ascend</h2>
            <p className="text-ink-muted leading-relaxed">Elevate envisions a world where every individual has the tools and support needed to ascend in their professional and academic life.</p>
          </article>
          <article className="card">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Our Mission</p>
            <h2 className="text-headline-md mb-3">Empower through tailored opportunities</h2>
            <p className="text-ink-muted leading-relaxed">Our mission is to empower individuals by offering tailored opportunities, expert-led growth, and meaningful connections. Together, we navigate the dynamic career and higher education landscape, ensuring you unlock your full potential and achieve unparalleled success.</p>
          </article>
        </section>

        {/* Stats */}
        <section className="bg-surface" aria-labelledby="stats-heading">
          <div className="container-site py-14">
            <h2 id="stats-heading" className="sr-only">Our impact</h2>
            <div className="grid grid-cols-3 gap-6 text-center">
              <Stat value="5+" label="Years of experience" />
              <Stat value="2,000+" label="Satisfied clients" />
              <Stat value="99%" label="Positive reviews" />
            </div>
          </div>
        </section>

        <WhyChooseUs background="canvas" />

        {/* Team */}
        <section className="bg-surface" aria-labelledby="team-heading">
          <div className="container-site py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Our Team</p>
              <h2 id="team-heading" className="text-headline-lg">Meet the Professionals</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              <article className="card">
                <h3 className="text-headline-md mb-1">Naa Lamle Lamptey</h3>
                <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">Co-founder</p>
                <p className="text-ink-muted leading-relaxed">
                  Naa Lamle co-founded Elevate Career Hub to make world-class career and education guidance accessible to ambitious professionals across Africa and the diaspora. Full bio coming soon.
                </p>
              </article>
              <article className="card">
                <h3 className="text-headline-md mb-1">Rosemary Agyeiwah Great-Damzi</h3>
                <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">Co-founder</p>
                <p className="text-ink-muted leading-relaxed mb-3">
                  Rosemary joined Elevate Career Hub as a co-founder in 2021. When she started her first job in 2018, after completing her bachelor&rsquo;s degree in accounting, she realized that she was ill-prepared for the job market despite graduating with 1<sup>st</sup> Class Honors.
                </p>
                <p className="text-ink-muted leading-relaxed mb-3">
                  After learning a few lessons the hard way and providing direct mentorship to a few people, she decided to use LinkedIn, through her &lsquo;Dear Young Professional&rsquo; series, to reach out to more young people and educate them on things she wished she had known before she started working. The great feedback she received led her to start a mentoring community named &lsquo;Mentoring With Rosemary&rsquo;.
                </p>
                <p className="text-ink-muted leading-relaxed">
                  As the sole recipient of the fully-funded GDI Merit Scholarship at the University of Manchester in 2022, she is instrumental in assisting our grad school clients to secure substantive scholarships and admissions into top universities all over the world. Rosemary is also a member of the Association of Chartered Certified Accountants (United Kingdom).
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading">
          <div className="container-site py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">FAQs</p>
              <h2 id="faq-heading" className="text-headline-lg">Frequently Asked Questions</h2>
            </div>
            <div className="max-w-3xl mx-auto">
              <FAQAccordion groups={FAQS} />
            </div>
          </div>
        </section>

        <FinalCTA />
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
