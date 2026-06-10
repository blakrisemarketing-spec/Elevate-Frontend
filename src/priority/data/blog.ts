/**
 * Blog content. The `BlogIndex` page lists these; the `BlogPost` template
 * renders one per `slug`. Bodies are stored as structured blocks (paragraph /
 * heading / list) so they render as zero-JS static HTML — no markdown runtime
 * is pulled into the priority bundle.
 */

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'ul'; items: string[] };

export interface BlogPostContent {
  route: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  body: BlogBlock[];
}

export const BLOG_POSTS: BlogPostContent[] = [
  {
    route: '/how-to-boost-your-career-with-professional-resume-writing/',
    slug: 'how-to-boost-your-career-with-professional-resume-writing',
    title: 'How to Boost Your Career with Professional Resume Writing',
    date: '14 October 2023',
    excerpt:
      'Whether you’re a recent graduate or a seasoned professional, a well-crafted resume is essential in today’s competitive job market.',
    body: [
      { type: 'p', text: 'Are you looking to take your career to the next level? Whether you are a recent graduate or a seasoned professional, having a well-crafted resume is essential in today’s competitive job market. A professional resume can make all the difference in landing your dream job and standing out from the crowd.' },
      { type: 'p', text: 'At Elevate, we specialise in career development and offer expert resume writing services to help you showcase your skills and experience effectively. Our team of experienced writers understands the latest industry trends and knows what employers are looking for in a resume.' },
      { type: 'h', text: 'The importance of a professional resume' },
      { type: 'p', text: 'Your resume is often the first impression you make on a potential employer. It is a summary of your qualifications, skills, and experience, and it needs to grab the attention of hiring managers. A professional resume can:' },
      { type: 'ul', items: [
        'Highlight your key achievements and accomplishments',
        'Showcase your relevant skills and qualifications',
        'Demonstrate your attention to detail and professionalism',
        'Make you stand out from other candidates',
      ] },
      { type: 'h', text: 'How our resume writing services can help' },
      { type: 'p', text: 'Our team of writers will work closely with you to create a personalised resume that highlights your strengths and aligns with your career goals. Here’s how our resume writing services can benefit you:' },
      { type: 'ul', items: [
        'Customised approach: we tailor our services to your specific career goals, skills, and experience.',
        'Keyword optimisation: we ensure your resume is keyword-rich and optimised for Applicant Tracking Systems (ATS).',
        'Professional formatting: a well-formatted, easy-to-read resume that hiring managers can navigate quickly.',
        'Proofreading and editing: thorough checks so your resume is error-free and presents you in the best light.',
        'Expert advice: tips on job search strategies, interview preparation, and career development.',
      ] },
      { type: 'h', text: 'Invest in your career' },
      { type: 'p', text: 'Your resume is an investment in your future. By investing in professional resume writing services, you are giving yourself a competitive edge in the job market. Don’t let a poorly written resume hold you back from reaching your career goals.' },
    ],
  },
  {
    route: '/how-our-career-development-company-can-help-you-stand-out/',
    slug: 'how-our-career-development-company-can-help-you-stand-out',
    title: 'How Our Career Development Company Can Help You Stand Out',
    date: '14 October 2023',
    excerpt:
      'A strong resume, compelling cover letters, and persuasive personal statements can make all the difference when advancing your career.',
    body: [
      { type: 'p', text: 'When it comes to advancing your career, having a strong resume, compelling cover letters, and persuasive personal statements can make all the difference. At Elevate Career Hub, we understand the importance of these documents and are here to help you stand out from the competition.' },
      { type: 'p', text: 'One of the key services we offer is professional resume writing. Our team of experienced writers knows what employers are looking for and can craft a resume that highlights your skills, accomplishments, and experiences in the best possible way. We work closely with you to understand your career goals and tailor your resume accordingly.' },
      { type: 'p', text: 'In addition to resumes, we also specialise in creating impactful cover letters. A well-written cover letter can grab the attention of hiring managers and compel them to take a closer look at your application — customised to the specific job you are applying for.' },
      { type: 'p', text: 'Personal statements are another area where we excel. Whether you are applying to graduate school, professional programmes, or scholarships, a strong personal statement can greatly enhance your chances of acceptance. We help you craft a compelling statement that showcases your passion and dedication.' },
      { type: 'p', text: 'Finally, we offer assistance with school applications. The application process can be overwhelming — our team can guide you through it, helping you choose the right schools, craft standout essays, and prepare for interviews.' },
      { type: 'p', text: 'We are committed to helping you succeed. Each career journey is unique, and we tailor our services to meet your specific needs, ensuring you have the best possible chance of achieving your goals.' },
    ],
  },
  {
    route: '/the-importance-of-professional-documents-in-career-development/',
    slug: 'the-importance-of-professional-documents-in-career-development',
    title: 'The Importance of Professional Documents in Career Development',
    date: '14 October 2023',
    excerpt:
      'Resumes, cover letters, personal statements, and school applications are your introduction to employers, admissions committees, and scholarship panels.',
    body: [
      { type: 'p', text: 'When it comes to career development, having professional documents such as resumes, cover letters, personal statements, and school applications can make a significant impact on your success. These documents serve as your introduction to potential employers, admissions committees, and scholarship panels, showcasing your qualifications, skills, and experiences.' },
      { type: 'p', text: 'Let’s start with the resume. Your resume is a concise summary of your education, work experience, skills, and achievements. A well-crafted resume can grab the attention of hiring managers and increase your chances of landing an interview.' },
      { type: 'p', text: 'Next is the cover letter. While the resume focuses on your qualifications, the cover letter allows you to personalise your application and explain why you are interested in the position or programme — a chance to showcase your communication skills and enthusiasm.' },
      { type: 'p', text: 'Personal statements are often required for graduate school applications or scholarships. They provide insight into your motivations, goals, and experiences, and a compelling statement can set you apart from other applicants.' },
      { type: 'p', text: 'Lastly, school applications are essential for those seeking admission to educational institutions. The process requires various documents — transcripts, recommendation letters, and essays — that together provide a comprehensive view of your achievements and qualities.' },
      { type: 'h', text: 'Tips to enhance your documents' },
      { type: 'ul', items: [
        'Customise your resume and cover letter for each job or programme you apply to.',
        'Showcase your accomplishments and quantify your achievements with numbers and examples.',
        'Highlight skills and experiences that align with what the employer or institution is seeking.',
        'Proofread and edit carefully, and seek feedback from others.',
      ] },
      { type: 'p', text: 'In conclusion, professional documents play a vital role in career development. By investing time and effort into well-crafted resumes, cover letters, personal statements, and applications, you can significantly enhance your chances of success.' },
    ],
  },
  {
    route: '/tips-for-crafting-an-effective-resume-cover-letter-personal-statement-and-school-application/',
    slug: 'tips-for-crafting-an-effective-resume-cover-letter-personal-statement-and-school-application',
    title: 'Tips for Crafting an Effective Resume, Cover Letter, Personal Statement, and School Application',
    date: '14 October 2023',
    excerpt:
      'These documents are your first impression — and they can greatly impact your chances of landing an interview or getting accepted.',
    body: [
      { type: 'p', text: 'When it comes to your career development, having a well-crafted resume, cover letter, personal statement, and school application can make all the difference. These documents are your first impression and can greatly impact your chances of landing an interview or getting accepted into your desired school. Here are some tips to help you create effective and compelling documents.' },
      { type: 'h', text: 'Resume' },
      { type: 'ul', items: [
        'Tailor your resume to the specific job you are applying for, highlighting relevant skills and experiences.',
        'Use clear and concise language; avoid jargon and focus on quantifiable achievements.',
        'Format it in a clean, organised manner with bullet points that recruiters can scan.',
      ] },
      { type: 'h', text: 'Cover letter' },
      { type: 'ul', items: [
        'Address the hiring manager by name where possible.',
        'Open with a strong paragraph that grabs attention and states your interest in the job.',
        'Customise it for each application, highlighting skills that make you a strong fit.',
      ] },
      { type: 'h', text: 'Personal statement' },
      { type: 'ul', items: [
        'Begin with a compelling introduction that hooks the reader.',
        'Be authentic — showcase your unique experiences and avoid clichés.',
        'Demonstrate your passion and commitment, with examples of how you’ve pursued your interests.',
      ] },
      { type: 'h', text: 'School application' },
      { type: 'ul', items: [
        'Research the school thoroughly and tailor your application to their requirements and values.',
        'Highlight your academic achievements, extracurricular activities, and community involvement.',
        'Use the application essay to showcase your personality and why you’re a good fit.',
      ] },
      { type: 'p', text: 'Remember, these documents are your opportunity to stand out from the competition. Take the time to craft them carefully, and don’t be afraid to seek feedback from professionals in the field. Good luck with your career development journey!' },
    ],
  },
];
