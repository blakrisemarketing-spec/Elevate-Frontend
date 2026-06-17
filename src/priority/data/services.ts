/**
 * Content for the individual service detail pages (e.g. `/curriculum-vitae/`).
 *
 * The `ServiceDetail` template renders these; the SSG build + the dev registry
 * generate one route per entry. Price tiers come from `catalog.ts` via
 * `priceTierIds`; this file holds only display copy. Services with no catalog
 * SKU (empty priceTierIds) show a contact CTA instead of buy buttons.
 */

export interface ServiceDetailContent {
  route: string;
  slug: string;
  shortName: string;
  title: string;
  metaDescription: string;
  eyebrow: string;
  heading: string;
  intro: string;
  parentService: 'career' | 'education';
  sections: { heading: string; body: string }[];
  features?: { title: string; body: string }[];
  /** Catalog ids offered as buy options (price tiers). Empty → contact CTA only. */
  priceTierIds?: string[];
}

export const SERVICES: ServiceDetailContent[] = [
  {
    route: '/curriculum-vitae/',
    slug: 'curriculum-vitae',
    shortName: 'Curriculum Vitae',
    title: 'Curriculum Vitae Writing, Elevate Career Hub',
    metaDescription:
      'A professionally crafted CV that tells your career story with impact, optimised for ATS and tailored to your industry.',
    eyebrow: 'Career Services',
    heading: 'Curriculum Vitae',
    intro:
      'Your CV is more than a document, it’s your professional story. Our CV service is meticulously crafted so your unique narrative stands out in a competitive job market.',
    parentService: 'career',
    sections: [
      {
        heading: 'Why choose our CV service',
        body:
          'Seamless excellence in action. Our process is designed to showcase your professional narrative with precision and impact, strategically crafting your story for success rather than simply listing experiences.',
      },
    ],
    features: [
      { title: 'Strategic storytelling', body: 'We highlight your achievements, aspirations, and potential, creating a document that captivates employers.' },
      { title: 'Keyword optimisation', body: 'Your document is optimised with industry-specific keywords to get noticed by applicant tracking systems (ATS).' },
      { title: 'Tailored to your industry', body: 'We align your CV with the specific requirements and expectations of your field.' },
      { title: 'Professional formatting', body: 'A well-organised document showcases your information effectively and makes a strong first impression.' },
    ],
    priceTierIds: ['career-cv-early', 'career-cv-experienced', 'career-cv-senior'],
  },
  {
    route: '/cover-letter/',
    slug: 'cover-letter',
    shortName: 'Cover Letter',
    title: 'Cover Letter Writing, Elevate Career Hub',
    metaDescription:
      'A compelling cover letter that makes the case for why you are the ideal candidate, tailored to the role.',
    eyebrow: 'Career Services',
    heading: 'Cover Letters',
    intro:
      'A well-crafted cover letter is your introduction to potential employers, a narrative that captivates from the start and makes a compelling case for why you’re the ideal candidate.',
    parentService: 'career',
    sections: [
      {
        heading: 'More than a formality',
        body:
          'Our Cover Letter Service is designed to uplift your application and set you apart in a competitive job market, transforming your professional story into a document designed to make you stand out.',
      },
    ],
    features: [
      { title: 'Consultation', body: 'Your input is pivotal in shaping a cover letter that authentically represents you.' },
      { title: 'Content creation', body: 'Our expert team crafts a cover letter strategically aligned with the job requirements.' },
      { title: 'Feedback and revision', body: 'We revise until you’re fully confident your cover letter reflects the best version of yourself.' },
      { title: 'Final delivery', body: 'Once you’re satisfied, we deliver the final version of your professionally crafted cover letter.' },
    ],
    priceTierIds: ['career-cover-letter-local', 'career-cover-letter-intl'],
  },
  {
    route: '/linkedin-optimization/',
    slug: 'linkedin-optimization',
    shortName: 'LinkedIn Optimisation',
    title: 'LinkedIn Optimisation, Elevate Career Hub',
    metaDescription:
      'A strategic elevation of your LinkedIn profile, content, keywords, and visuals that get you discovered by recruiters.',
    eyebrow: 'Career Services',
    heading: 'LinkedIn Optimisation',
    intro:
      'Your LinkedIn profile is your digital handshake. Our LinkedIn Optimisation service is a strategic elevation of your professional brand, not just a transformation.',
    parentService: 'career',
    sections: [
      {
        heading: 'A profile that works for you',
        body:
          'We go beyond conventional profile enhancement, delving into strategic content creation, keyword optimisation, and visual refinement so your profile becomes a beacon of your professional story, inviting opportunities and connections.',
      },
    ],
    features: [
      { title: 'Strategic profile enhancement', body: 'Every element is refined to elevate its impact and resonance.' },
      { title: 'Keyword optimisation', body: 'Get discovered by recruiters searching for your skills.' },
      { title: 'Headline & summary crafting', body: 'A compelling headline and summary that tell your story.' },
      { title: 'Visual refinement', body: 'A polished, professional presentation across your profile.' },
    ],
    priceTierIds: ['career-linkedin'],
  },
  {
    route: '/reference-letter/',
    slug: 'reference-letter',
    shortName: 'Reference Letter',
    title: 'Reference Letters, Elevate Career Hub',
    metaDescription:
      'Powerful, personalised reference letters that endorse your professional character and open doors.',
    eyebrow: 'Career Services',
    heading: 'Reference Letters',
    intro:
      'Reference letters are powerful endorsements that can significantly impact your professional journey. Our Reference Letter Service transforms them into captivating narratives that take your professional standing to the next level.',
    parentService: 'career',
    sections: [
      {
        heading: 'Endorsements that stand out',
        body:
          'We understand the pivotal role reference letters play in shaping perceptions, and our service ensures they become invaluable assets in your career arsenal, strategically crafted to highlight your unique strengths and qualities.',
      },
    ],
    features: [
      { title: 'Diverse industry expertise', body: 'Letters that resonate with professionals in your specific field.' },
      { title: 'Strategic content creation', body: 'Personalised to provide a comprehensive portrayal of your professional character.' },
      { title: 'Strategic use across platforms', body: 'Suited to job applications, academic submissions, and professional networking.' },
      { title: 'Alignment with expectations', body: 'Reflecting the qualities and competencies valued in your field.' },
    ],
    priceTierIds: [],
  },
  {
    route: '/statement-of-purpose/',
    slug: 'statement-of-purpose',
    shortName: 'Statement of Purpose',
    title: 'Statement of Purpose & Scholarship Essays, Elevate Career Hub',
    metaDescription:
      'A collaborative service that amplifies your voice and aspirations in a Statement of Purpose that exceeds reviewers’ expectations.',
    eyebrow: 'Educational Services',
    heading: 'Statement of Purpose',
    intro:
      'Your Statement of Purpose is the linchpin of your academic journey, an opportunity to articulate your ambitions and showcase your unique qualities. Our SOP service is a collaborative journey designed to amplify your voice and aspirations.',
    parentService: 'education',
    sections: [
      {
        heading: 'Your story, told with precision',
        body:
          'We begin with a collaborative exploration of your academic and professional journey, a personalised consultation that delves into your experiences and goals, ensuring your SOP is well-written and deeply resonant with your personality and ambitions.',
      },
    ],
    features: [
      { title: 'Authenticity of work', body: 'Your personality, motivations, and unique perspective shine through.' },
      { title: 'Tailored to diverse goals', body: 'Every aspect is presented to make a lasting impact, from academic achievements to career aspirations.' },
      { title: 'Expert team', body: 'We articulate your unique journey with precision and care.' },
      { title: 'Fair pricing', body: 'Top-notch service with a pricing structure that respects your budget.' },
    ],
    priceTierIds: ['edu-essay-500', 'edu-essay-1000'],
  },
  {
    route: '/suggestion-of-schools/',
    slug: 'suggestion-of-schools',
    shortName: 'School Selection',
    title: 'School Selection & Programme Research, Elevate Career Hub',
    metaDescription:
      'Personalised school suggestions and in-depth programme research to help you choose the right institution with confidence.',
    eyebrow: 'Educational Services',
    heading: 'School Selection',
    intro:
      'Selecting the right school is a pivotal decision. Our School Selection service guides you through the process, ensuring you make an informed decision aligned with your educational goals and aspirations.',
    parentService: 'education',
    sections: [
      {
        heading: 'Embark on your educational journey with confidence',
        body:
          'Choosing the right school shapes your academic and personal future. Our experienced consultants provide personalised insights, comprehensive research, and unwavering support to connect you with institutions where your potential can truly flourish.',
      },
    ],
    features: [
      { title: 'Personalised consultation', body: 'We delve into your unique profile to provide tailored recommendations.' },
      { title: 'Alignment with your goals', body: 'Institutions offering programmes and resources matched to your aspirations.' },
      { title: 'Comprehensive research', body: 'In-depth research on programmes, faculty, and opportunities, a curated shortlist.' },
      { title: 'Campus culture fit', body: 'Insights on community, diversity, and environment so you can thrive.' },
    ],
    priceTierIds: ['edu-school-selection'],
  },
  {
    route: '/interview-preparation-session/',
    slug: 'interview-preparation-session',
    shortName: 'Interview Preparation',
    title: 'Interview Preparation Session, Elevate Career Hub',
    metaDescription:
      'Personalised 1-on-1 interview coaching with mock interviews and constructive feedback to help you make a lasting impression.',
    eyebrow: 'Career Services',
    heading: 'Interview Preparation Session',
    intro:
      'Interviews are the gateways to your professional journey. Our 1-on-1 Interview Preparation service gives you the personalised guidance and strategic insights needed to excel in any interview scenario.',
    parentService: 'career',
    sections: [
      {
        heading: 'Step in fully prepared',
        body:
          'Whether you’re gearing up for a job interview, internship, or professional advancement, our experienced coaches elevate your performance with a personalised approach so you make a lasting impression.',
      },
    ],
    features: [
      { title: 'Personalised coaching', body: 'Sessions catered to your strengths, areas of improvement, and target industry.' },
      { title: 'Mock interviews', body: 'Real-time practice with constructive feedback on answers, body language, and presentation.' },
      { title: 'Strategic Q&A', body: 'Prepare for the spectrum of questions likely to arise in your field.' },
      { title: 'Ongoing support', body: 'Guidance that continues beyond the session, all the way to interview success.' },
    ],
    priceTierIds: ['career-interview-prep'],
  },
  {
    route: '/career-strategy-session/',
    slug: 'career-strategy-session',
    shortName: 'Career Strategy Session',
    title: 'Career Strategy Session, Elevate Career Hub',
    metaDescription:
      'Personalised insights, actionable strategies, and a roadmap to navigate your professional trajectory with confidence.',
    eyebrow: 'Career Services',
    heading: 'Career Strategy Session',
    intro:
      'Your career is a dynamic journey, and strategic planning is the compass that guides you toward success. Our Career Strategy Sessions provide personalised insights, actionable strategies, and a roadmap for your professional trajectory.',
    parentService: 'career',
    sections: [
      {
        heading: 'A roadmap built around you',
        body:
          'Whether you’re at a crossroads, aspiring for growth, or considering a shift, our sessions empower you with the tools needed for informed, strategic decision-making, from career assessment to goal alignment and networking.',
      },
    ],
    features: [
      { title: 'Personalised assessment', body: 'We analyse your unique profile to tailor a strategy aligned with your long-term goals.' },
      { title: 'Skill enhancement', body: 'Insights into development opportunities, certifications, and training programmes.' },
      { title: 'Goal alignment & roadmapping', body: 'A step-by-step plan outlining milestones and next moves.' },
      { title: 'Networking & branding', body: 'Build a strong network and position yourself as a standout candidate.' },
    ],
    priceTierIds: [],
  },
];
