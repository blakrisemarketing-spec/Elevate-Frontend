/**
 * FAQ content, shared by the page components (rendered via FAQAccordion) and
 * the build-time SEO step (FAQPage JSON-LD in scripts/build-priority-routes.mjs).
 * Keeping it here means the on-page FAQ and the structured data can't drift.
 */

export interface FaqItem {
  question: string;
  answer: string;
}
export interface FaqGroup {
  heading: string;
  items: FaqItem[];
}

/** General site FAQs (the /faqs/ page). */
export const SITE_FAQ_GROUPS: FaqGroup[] = [
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

/** FAQs specific to the Get Into Grad School Bootcamp landing page. */
export const BOOTCAMP_FAQ_GROUPS: FaqGroup[] = [
  {
    heading: 'About the bootcamp',
    items: [
      { question: 'What is the bootcamp all about?', answer: 'An 8-session intensive programme that walks you through the entire graduate school application process — from choosing the right programme and building your school list, to writing your personal statement, securing funding, and preparing to arrive on campus. Each session is led by a speaker with direct, relevant experience.' },
      { question: 'Who is this for?', answer: 'Anyone seriously considering graduate school, whether you’re just starting to explore your options or already in the middle of applications. It’s particularly relevant if you’re targeting programmes in the US, UK, Canada, Australia, or Europe.' },
      { question: 'Do I need to already know which school or programme I want?', answer: 'No. Session 1 starts with a diagnostic exercise to help you figure that out. You’ll leave with a clear direction — not just a list of schools to Google later.' },
      { question: 'Does it cover all types of graduate programmes?', answer: 'Yes. The bootcamp covers taught Masters, research-based programmes (MPhil, Masters by Research, PhD), and MBAs.' },
      { question: 'Is this only relevant for people applying from Ghana?', answer: 'The bootcamp is designed with an African applicant lens, but the content applies to anyone applying to graduate programmes abroad. School selection, application strategy, funding, and visa guidance are covered for multiple destination countries.' },
    ],
  },
  {
    heading: 'Funding, sessions & logistics',
    items: [
      { question: 'Will funding and scholarships be covered?', answer: 'Yes, and in depth. We cover graduate assistantships (one of the most underused funding routes for international students), a dedicated scholarships session with people who have actually won funding, and a resource pack with 50+ scholarships and 30+ low-tuition universities. Alternative funding such as loans is also covered.' },
      { question: 'I’m only interested in one or two topics. Can I attend individual sessions?', answer: 'Yes. Drop-in tickets are available, so you can register for just the sessions most relevant to you.' },
      { question: 'What do I need to bring or prepare?', answer: 'Nothing is required before Session 1 — it opens with a diagnostic exercise, so come with an open mind and a rough sense of your goals. For later sessions, facilitators may share prep materials in advance.' },
      { question: 'Will sessions be recorded?', answer: 'Yes. Recordings are shared with registered participants after each session, with 90 days of replay access.' },
      { question: 'What platform will sessions run on, and how long are they?', answer: 'Sessions run on Google Meet. Each one is 2 hours, with a Q&A included.' },
      { question: 'I have a question that isn’t covered here.', answer: 'Reach out to us at hello@elevatecareerhub.com or on WhatsApp at +233 53 111 3454.' },
    ],
  },
];
