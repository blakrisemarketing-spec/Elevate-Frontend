import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';
import { FinalCTA } from '../components/FinalCTA';

interface Product {
  title: string;
  description: string;
  price: string;
  href: string;
  whatsappMessage: string;
}

const PRODUCTS: Product[] = [
  {
    title: 'Becoming a Job Magnet on LinkedIn',
    description: 'Unlock the secrets to becoming a job magnet on LinkedIn with our comprehensive DIY product.',
    price: '₵ 199.00',
    href: '/product/becoming-a-job-magnet-on-linkedin/',
    whatsappMessage: 'Hello Elevate Career Hub, I would like to purchase "Becoming a Job Magnet on LinkedIn".',
  },
  {
    title: 'Complete Grad School Bundle',
    description: 'This all-in-one DIY product includes essential resources such as CV templates, statement of purpose guides, and more.',
    price: '₵ 250.00',
    href: '/product/complete-grad-school-bundle/',
    whatsappMessage: 'Hello Elevate Career Hub, I would like to purchase the "Complete Grad School Bundle".',
  },
  {
    title: 'How to Write the Resume that Lands the Interview',
    description: 'If you keep getting rejections from jobs you\'re qualified for, then your resume may be holding you back. Learn the formula that gets interviews.',
    price: '₵ 199.00',
    href: '/product/how-to-write-the-resume-that-lands-the-interview/',
    whatsappMessage: 'Hello Elevate Career Hub, I would like to purchase "How to Write the Resume that Lands the Interview".',
  },
  {
    title: 'Mastering the Art of Job Hunting in the UK as an International Student',
    description: 'Learn about the recruitment process in the UK, the companies that offer visa sponsorship, and how to position yourself for interviews.',
    price: '₵ 199.00',
    href: '/product/mastering-the-art-of-job-hunting-in-the-uk-as-an-international-student/',
    whatsappMessage: 'Hello Elevate Career Hub, I would like to purchase the UK job-hunting playbook.',
  },
  {
    title: 'Nailing Your Job Interviews',
    description: 'Elevate your interview game with our powerhouse interview course and land the job of your dreams with confidence.',
    price: '₵ 199.00',
    href: '/product/nailing-your-job-interviews/',
    whatsappMessage: 'Hello Elevate Career Hub, I would like to purchase "Nailing Your Job Interviews".',
  },
  {
    title: 'Remote Job Playbook',
    description: 'Unlock your remote career potential. Discover the strategies trusted by thousands of professionals to secure remote roles.',
    price: 'Free',
    href: '/product/remote-job-playbook/',
    whatsappMessage: 'Hello Elevate Career Hub, I would like the Remote Job Playbook.',
  },
  {
    title: 'The Complete Job Search Bundle',
    description: 'Everything you need to find, land, and start your next role — CV, cover letter, LinkedIn, and interview resources in one package.',
    price: '₵ 250.00',
    href: '/product/the-complete-job-search-bundle/',
    whatsappMessage: 'Hello Elevate Career Hub, I would like the Complete Job Search Bundle.',
  },
];

function whatsappLink(message: string): string {
  return `https://wa.me/233531113454?text=${encodeURIComponent(message)}`;
}

export function DIYProductsPage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="/diy-products/" />

      <main id="main">
        <PageHero
          eyebrow="DIY Products"
          title="Practical DIY Resources for Your Next Step"
          crumbs={[{ label: 'Home', href: '/' }, { label: 'DIY Products' }]}
          intro={
            <p>
              Discover our range of DIY products designed to elevate your professional and educational journey. From comprehensive interview preparation and interview courses to targeted resume guides, not forgetting our grad school and job search bundles, our offerings are crafted to equip you with the skills and insights needed to turn your career and higher education dreams into a reality. Your success story begins with Elevate.
            </p>
          }
        />

        <section className="container-site py-16" aria-labelledby="products-heading">
          <h2 id="products-heading" className="sr-only">Available DIY products</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((product, i) => (
              <article key={i} className="card flex flex-col h-full">
                <h3 className="text-headline-md mb-3">
                  <a href={product.href} className="no-underline text-navy hover:text-primary">{product.title}</a>
                </h3>
                <p className="text-ink-muted leading-relaxed flex-1">{product.description}</p>
                <div className="flex items-baseline gap-2 mt-5">
                  <span className="text-2xl font-bold text-primary">{product.price}</span>
                </div>
                <a
                  href={whatsappLink(product.whatsappMessage)}
                  className="btn-primary mt-5"
                  target="_blank"
                  rel="noopener"
                  aria-label={`Message Elevate Career Hub on WhatsApp to purchase ${product.title}`}
                >
                  Message us to purchase
                </a>
              </article>
            ))}
          </div>
        </section>

        <FinalCTA />
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
