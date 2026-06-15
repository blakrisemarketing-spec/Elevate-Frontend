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
    heading: 'General',
    items: [
      { question: 'What does Elevate Career Hub do?', answer: 'Elevate Career Hub is a career development platform supporting students and professionals through career document preparation, graduate school applications, one-on-one coaching, bootcamps, and webinars.' },
      { question: 'Can students and professionals outside Africa access your services?', answer: 'Yes, we support students and professionals globally. Our writers are all over the world and are trained according to international standards across multiple regions, including the US, UK, Canada, and beyond.' },
      { question: 'How do I get started with Elevate Career Hub?', answer: 'You can get started by placing an order directly through our online platforms. If you are unsure about which service best suits your needs, book a free discovery call with our team for guidance and recommendations.' },
      { question: 'Are your services designed for specific industries or fields?', answer: 'No. Our services cater to professionals and students across a wide range of industries and academic fields, with support from experts spanning technology, finance, audit, engineering, architecture, HR, healthcare, law, marketing, education, consulting, supply chain and logistics, energy, real estate, non-profit and international development, media and communications, government and public policy, pharmaceuticals, construction, hospitality, and many more.' },
    ],
  },
  {
    heading: 'DIY Products',
    items: [
      { question: 'What DIY products do you offer, and who are they best for?', answer: 'We offer DIY resources for individuals who prefer to handle parts of the process independently. These include step-by-step guides, templates, recorded webinar sessions, and practical resources covering application preparation, networking, career positioning, and more. They are best for self-starters who want structured guidance without full-service support.' },
      { question: 'Are the DIY products one-time purchases or subscriptions?', answer: 'Our DIY products are one-time purchases that come with lifetime access to the materials purchased.' },
    ],
  },
  {
    heading: 'Services & Process',
    items: [
      { question: 'I already have admission. Can you help me secure scholarships?', answer: 'We support scholarship applications by helping clients develop strong scholarship essays and other required application documents. We also encourage clients to research scholarship opportunities early, as funding is often influenced by the schools and programmes they apply to. Where a client already has an admission offer, available funding will depend on the institution and external scholarship providers. We can help identify opportunities and strengthen your application, but the final availability of funding sits with those providers.' },
      { question: 'Do you provide interview coaching for specific industries or job roles?', answer: 'Yes. We provide expert-led interview preparation sessions tailored to specific industries and job roles, facilitated by professionals with relevant industry experience.' },
      { question: 'Do you offer visa support?', answer: 'We do not directly provide visa processing services. However, we work with trusted visa support agency partners who offer professional visa assistance across various destinations. Through these partnerships, our clients can access reliable visa support at subsidised rates, regardless of their study or travel destination.' },
      { question: 'What happens after I purchase a service?', answer: 'After purchasing a service, a team member will reach out within 24 hours to collect the information needed to begin working on your request.' },
      { question: 'How long does it take to complete a service?', answer: 'Our standard turnaround time is 5 working days. We also offer expedited services with delivery within 48 hours after all required information has been received. Expedited services attract an additional fee.' },
      { question: 'How many revisions are included in each service?', answer: 'We offer up to three revisions after the first draft has been shared for your review.' },
    ],
  },
  {
    heading: 'Payments',
    items: [
      { question: 'What payment methods do you accept, and do you offer payment plans?', answer: 'We accept credit and debit cards, PayPal, mobile money, and bank transfers. For payment plans, reach out to us directly and we can discuss options based on your needs.' },
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
          eyebrow="Our Story"
          title="We exist to break one pattern"
          crumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]}
          intro={
            <>
              <p className="mb-4">Opportunity, almost everywhere, gets distributed by who you know &mdash; not what you can do. Whether you&rsquo;re applying to a top firm in Accra, chasing a master&rsquo;s at Manchester, or rebuilding a career as an immigrant in London or Toronto, the rules have always rewarded insiders.</p>
              <p>Elevate exists to break that pattern, by being the connection our clients didn&rsquo;t have.</p>
            </>
          }
        />

        {/* Brand Story */}
        <section className="container-site py-16 max-w-3xl" aria-labelledby="story-heading">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">How it started</p>
          <h2 id="story-heading" className="text-headline-lg mb-6">2020 will be remembered as the year everything changed</h2>
          <div className="space-y-4 text-ink-muted leading-relaxed">
            <p>The way the world worked shifted almost overnight. Offices emptied, industries slowed down, and for millions of people, the lives they had carefully built suddenly felt uncertain. For many young professionals, it was the moment everything got disrupted. There were layoffs, hiring freezes kicked in, offers were rescinded, start dates pushed indefinitely, and promotions that once felt certain were suddenly off the table. Plans that made perfect sense in January just did not hold by April.</p>
            <p>And in the middle of the chaos and uncertainty, Elevate was born. We started by offering one-on-one advice, sharing what we knew from our own experiences navigating careers, applying to roles, preparing for interviews, and getting into programs abroad. As more people found us, those conversations grew into a community of young professionals all trying to figure out their next step.</p>
            <p>Today, Elevate is for anyone who is ready to move but needs the right support to do it well. We work with young professionals, career changers, and people breaking into spaces that have not always been easy to access. We are known for focusing on what actually gets results &mdash; helping you build the right strategy, position yourself well, and tell your story in a way that opens doors.</p>
            <p>Over 2,000 professionals across different industries and countries have come through Elevate Career Hub. Many landed roles they had been chasing for years, others got into graduate programs they thought were a long shot, and some just finally felt like they had a clear direction and someone in their corner.</p>
            <p>That is what we are building toward: a global community where any professional, no matter where they are starting from, has access to the guidance, the tools, and the support they need to build a career they are proud of. You should not have to figure this out alone. And with Elevate Career Hub, you do not have to.</p>
          </div>
        </section>

        {/* Vision + Mission */}
        <section className="bg-surface" aria-labelledby="vm-heading">
          <div className="container-site py-16 grid gap-6 md:grid-cols-2">
            <h2 id="vm-heading" className="sr-only">Our vision and mission</h2>
            <article className="card">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Our Vision</p>
              <h3 className="text-headline-md mb-3">Opportunity within reach</h3>
              <p className="text-ink-muted leading-relaxed">To put world-class opportunity within reach, no matter where you begin.</p>
            </article>
            <article className="card">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Our Mission</p>
              <h3 className="text-headline-md mb-3">Insider knowledge that opens doors</h3>
              <p className="text-ink-muted leading-relaxed">To accelerate access to global careers and educational opportunities by sharing the insider knowledge that actually opens doors.</p>
            </article>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-canvas" aria-labelledby="stats-heading">
          <div className="container-site py-14">
            <h2 id="stats-heading" className="sr-only">Our impact</h2>
            <div className="grid grid-cols-3 gap-6 text-center">
              <Stat value="6+" label="Years of experience" />
              <Stat value="2,000+" label="Professionals helped" />
              <Stat value="96%" label="Positive reviews" />
            </div>
          </div>
        </section>

        <WhyChooseUs background="surface" />

        {/* Team */}
        <section className="bg-canvas" aria-labelledby="team-heading">
          <div className="container-site py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Our Team</p>
              <h2 id="team-heading" className="text-headline-lg">The people who&rsquo;ve walked the path</h2>
              <p className="text-ink-muted leading-relaxed mt-4">None of what we teach is theoretical. Every strategy we share, we&rsquo;ve lived.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
              <article className="card">
                <div className="aspect-[4/5] rounded-xl overflow-hidden mb-5 bg-primary-100">
                  <img
                    src="/assets/founders/naa-about.webp"
                    alt="Naa Lamle Lamptey, Elevate Career Hub co-founder"
                    width={720}
                    height={900}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <h3 className="text-headline-md mb-1">Naa Lamle Lamptey</h3>
                <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">Co-founder</p>
                <div className="space-y-3 text-ink-muted leading-relaxed">
                  <p>Naa works as a Global Finance Manager within a food and snacks company in the United States, where she brings strong expertise in corporate development and strategy. She is also pursuing an MBA at the Ross School of Business, University of Michigan, where she is a Fort&eacute; Fellow &mdash; a scholarship awarded to women demonstrating exceptional promise in business leadership. She holds a Bachelor&rsquo;s degree in Actuarial Science and a Master&rsquo;s degree in Development Finance.</p>
                  <p>Networking and relationship-building have been a defining thread in her career. Through strategic outreach and referrals, she secured a role that sponsored her relocation from Ghana to the United States, even when the position had not been publicly advertised. Earlier in her career, she landed her first professional role with a leading fintech in Ghana in a similar way &mdash; by directly reaching out to the company&rsquo;s CEO.</p>
                  <p>As a co-founder of Elevate Career Hub, Naa has always been passionate about helping people navigate uncertainty in their careers. What started as a desire to share hard-won lessons has grown into a platform that has reached over 2,000 professionals across Africa and the diaspora. Through bootcamps and 1:1 coaching, she has helped clients land roles at top companies, secure funding, and earn admission into leading graduate programs around the world.</p>
                  <p>What sets her approach apart is that none of it is theoretical. Every framework she teaches, she has lived. She knows what it takes to break into competitive spaces with no blueprint, no insider access, and no one handing you the next step &mdash; and that&rsquo;s what keeps people coming back.</p>
                </div>
              </article>
              <article className="card">
                <div className="aspect-[4/5] rounded-xl overflow-hidden mb-5 bg-primary-100">
                  <img
                    src="/assets/founders/rosemary-about.webp"
                    alt="Rosemary Agyeiwah Great-Damzi, Elevate Career Hub co-founder"
                    width={720}
                    height={900}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <h3 className="text-headline-md mb-1">Rosemary Great-Damzi</h3>
                <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">Co-founder</p>
                <div className="space-y-3 text-ink-muted leading-relaxed">
                  <p>Rosemary Great-Damzi is an ACCA-qualified Chartered Accountant and a dedicated internal audit and risk management professional with extensive experience across financial services, oil and gas, and the public sector. She holds a Master&rsquo;s degree in Project Management from the University of Manchester, which she earned on a prestigious full-ride scholarship that covered her tuition, accommodation, flights, and visa costs in full, and came with a substantial monthly stipend. She currently works in internal audit at a leading fintech in London.</p>
                  <p>Through a highly targeted job search strategy, Rosemary tripled her salary within two years, often navigating recruitment processes with multiple offers to choose from. Beyond her corporate career, she is deeply committed to career development. As a co-founder of Elevate Career Hub, she is dedicated to giving job seekers the tools, confidence, and strategies they need to build fulfilling careers.</p>
                  <p>That same commitment extends to those pursuing further study. Having navigated the scholarship and admissions journey herself, Rosemary is just as passionate about helping others secure admission into leading universities and compete for the most prestigious scholarships available. She works closely with applicants to sharpen their personal statements, build compelling profiles, and approach the process with clarity and strategy rather than guesswork.</p>
                  <p>Her goal is simple: to demystify a journey that often feels out of reach, and to show ambitious candidates that world-class education and full funding are well within their grasp with the right preparation and positioning.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-surface" aria-labelledby="faq-heading">
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
