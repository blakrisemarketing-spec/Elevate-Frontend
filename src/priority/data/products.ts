/**
 * Content for the DIY product detail pages (`/product/<slug>/`).
 *
 * The `ProductDetail` template renders these; the SSG build + the dev registry
 * generate one route per entry. Price/SKU come from `catalog.ts` (the single
 * source of truth) via `catalogId`; this file holds only display copy.
 */

export interface ProductDetailContent {
  /** /product/<slug>/ route. */
  route: string;
  /** Catalog id (price source of truth) AND the data-service-id on the buy button. */
  catalogId: string;
  /** Short label for breadcrumbs/hero. */
  shortName: string;
  /** <title>. */
  title: string;
  /** <meta name="description">. */
  metaDescription: string;
  /** Hero subhead. */
  tagline: string;
  /** A small category chip (e.g. "eBook"). */
  category?: string;
  /** Sales-copy sections. */
  sections: { heading: string; body: string }[];
  /** Optional "what's inside" bullets. */
  whatsInside?: string[];
  /** Free products link straight to a download instead of a buy button. */
  freeDownloadPath?: string;
}

export const PRODUCTS: ProductDetailContent[] = [
  {
    route: '/product/becoming-a-job-magnet-on-linkedin/',
    catalogId: 'diy-job-magnet-linkedin',
    shortName: 'Becoming a Job Magnet on LinkedIn',
    title: 'Becoming a Job Magnet on LinkedIn — Elevate Career Hub',
    metaDescription:
      'Build a stellar LinkedIn profile that gets recruiters and hiring managers chasing you with opportunities.',
    tagline:
      'Unlock the secrets to becoming a job magnet on LinkedIn with our comprehensive DIY course.',
    category: 'Course',
    sections: [
      {
        heading: 'Make recruiters come to you',
        body:
          'Learn how to build a stellar LinkedIn profile that gets recruiters and hiring managers chasing you with opportunities. This resource gives you expert tips, strategies, and actionable advice to optimise your profile, expand your professional network, and attract career opportunities — whether you’re a seasoned professional or just starting out.',
      },
    ],
    whatsInside: [
      'How to optimise every section of your LinkedIn profile',
      'Strategies to expand your professional network',
      'Tactics to attract recruiters and opportunities',
      'Actionable advice you can apply today',
    ],
  },
  {
    route: '/product/complete-grad-school-bundle/',
    catalogId: 'diy-grad-school-bundle',
    shortName: 'Complete Grad School Bundle',
    title: 'Complete Grad School Bundle — Elevate Career Hub',
    metaDescription:
      'An all-in-one toolkit for graduate school applications: CV templates, statement of purpose guides, reference templates, and more.',
    tagline:
      'Everything you need for a strong graduate school application, in one all-in-one toolkit.',
    category: 'Bundle',
    sections: [
      {
        heading: 'Your complete graduate school toolkit',
        body:
          'This all-in-one DIY product includes the essential resources you need to apply with confidence — CV templates, statement of purpose guides, reference letter templates, interview preparation, and more. Take the next step towards your academic goals with this invaluable resource.',
      },
    ],
    whatsInside: [
      'Grad School CV template',
      'Grad School recommendation letter template',
      'Grad School reference page template',
      'List of fully funded scholarships',
      'List of schools that do not require IELTS/GRE/GMAT',
      'Personal statement guide (including samples)',
      'Grad School interview guide (including examples)',
      'Grad School applications tracker',
    ],
  },
  {
    route: '/product/how-to-write-the-resume-that-lands-the-interview/',
    catalogId: 'diy-resume-that-lands',
    shortName: 'How to Write the Resume that Lands the Interview',
    title: 'How to Write the Resume that Lands the Interview — Elevate Career Hub',
    metaDescription:
      'Learn the formula for a resume that gets past Applicant Tracking Systems and lands you interviews.',
    tagline:
      'If you keep getting rejections from jobs you’re qualified for, your resume may be the reason. Learn the formula that lands interviews.',
    category: 'Course',
    sections: [
      {
        heading: 'A resume that gets past the bots — and the humans',
        body:
          'This comprehensive DIY course is your ultimate guide to creating a standout resume that captures the attention of employers and gets past Applicant Tracking Systems. Packed with expert tips, proven strategies, and practical advice, it walks you through every step — from formatting and content selection to highlighting your skills and accomplishments effectively.',
      },
    ],
    whatsInside: [
      'How to get past Applicant Tracking Systems (ATS)',
      'Formatting that makes recruiters keep reading',
      'Choosing and framing the right content',
      'Highlighting skills and accomplishments with impact',
    ],
  },
  {
    route: '/product/mastering-the-art-of-job-hunting-in-the-uk-as-an-international-student/',
    catalogId: 'diy-uk-job-hunting',
    shortName: 'Mastering Job Hunting in the UK',
    title: 'Mastering Job Hunting in the UK as an International Student — Elevate Career Hub',
    metaDescription:
      'Navigate the UK job market with confidence: the recruitment process, visa-sponsoring companies, and how to stand out to UK employers.',
    tagline:
      'Learn the UK recruitment process, which companies offer visa sponsorship, and how to make yourself outstanding to UK employers.',
    category: 'eBook',
    sections: [
      {
        heading: 'Your guide to the UK job market',
        body:
          'This essential DIY product is your comprehensive guide to navigating the UK job market with confidence. Packed with insights, tips, and strategies tailored specifically for international students, it equips you with the knowledge and skills needed to secure rewarding opportunities and kickstart your career in the UK.',
      },
    ],
    whatsInside: [
      'How the UK recruitment process really works',
      'Companies that offer visa sponsorship by field',
      'How to position yourself to stand out to UK employers',
      'Strategies tailored for international students',
    ],
  },
  {
    route: '/product/nailing-your-job-interviews/',
    catalogId: 'diy-nailing-interviews',
    shortName: 'Nailing Your Job Interviews',
    title: 'Nailing Your Job Interviews — Elevate Career Hub',
    metaDescription:
      'Expert insights, proven strategies, and practical tips to ace your interviews and land your dream job.',
    tagline:
      'Elevate your interview game with our powerhouse interview course and land the job of your dreams.',
    category: 'Course',
    sections: [
      {
        heading: 'Walk in prepared. Walk out memorable.',
        body:
          'This essential DIY product gives you expert insights, proven strategies, and practical tips to ace your interviews. From preparing for common questions to mastering body language and communication, it equips you with the skills and confidence needed to impress employers and stand out from the competition.',
      },
    ],
    whatsInside: [
      'How to prepare for common interview questions',
      'Mastering body language and communication',
      'Structuring answers that land',
      'Building genuine interview confidence',
    ],
  },
  {
    route: '/product/remote-job-playbook/',
    catalogId: 'diy-remote-job-playbook',
    shortName: 'Remote Job Playbook',
    title: 'Remote Job Playbook — Elevate Career Hub',
    metaDescription:
      'Discover the strategies trusted by thousands of professionals to secure high-paying remote jobs from anywhere in the world.',
    tagline:
      'Unlock your remote career potential — the strategies trusted by thousands of professionals to secure high-paying remote jobs from anywhere in the world.',
    category: 'eBook',
    freeDownloadPath: '/downloads/the-remote-job-playbook.pdf',
    sections: [
      {
        heading: 'Comprehensive insights for job seekers',
        body:
          'Learn how to identify the best remote job sites featuring high-quality listings tailored to your skills. From crafting the perfect application to standing out in remote interviews, we’ve got you covered with proven techniques that have worked for countless clients.',
      },
      {
        heading: 'Avoid pitfalls, seize opportunities',
        body:
          'Navigate the ever-growing remote work landscape by spotting the red flags to watch out for and recognising the green flags that signal great opportunities. Stay informed and make smarter decisions as you build your dream remote career path.',
      },
    ],
    whatsInside: [
      'How to identify the best remote job sites and high-quality listings',
      'Crafting applications that stand out for remote roles',
      'Techniques for standing out in remote interviews',
      'Red flags to avoid and green flags to look for',
    ],
  },
  {
    route: '/product/the-complete-job-search-bundle/',
    catalogId: 'diy-complete-job-search',
    shortName: 'The Complete Job Search Bundle',
    title: 'The Complete Job Search Bundle — Elevate Career Hub',
    metaDescription:
      'Everything you need to find, land, and start your next role — resume, cover letter, LinkedIn, and interview resources in one package.',
    tagline:
      'A curated collection of everything you need to find, land, and start your next role — in one package.',
    category: 'Bundle',
    sections: [
      {
        heading: 'Your end-to-end job search toolkit',
        body:
          'This comprehensive bundle offers a curated collection of essential resources, including resume templates, a cover letter guide, interview preparation, and networking strategies — everything you need to run a focused, effective job search from start to finish.',
      },
    ],
    whatsInside: [
      'Our Ultimate Resume Writing course',
      'Our Premium LinkedIn Optimisation course',
      'Our Comprehensive Interview Preparation course',
      '2 editable resume templates',
      'A job search tracker',
    ],
  },
];
