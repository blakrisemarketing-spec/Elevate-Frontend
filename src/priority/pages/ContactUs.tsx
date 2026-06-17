import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';

const TOPICS = [
  'CVs and cover letters',
  'Graduate school applications',
  'Interview preparation',
  'Scholarships and essays',
  'School selection',
  'DIY career resources',
];

export function ContactUsPage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="/contact-us/" />

      <main id="main">
        <PageHero
          eyebrow="Contact"
          title="Reach out, we&rsquo;re here to help"
          crumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
          intro={<p>Tell us what you are working on and we will guide you to the right next step. Replies are typically within the same business day.</p>}
        />

        <section className="container-site py-16" aria-labelledby="reach-heading">
          <h2 id="reach-heading" className="sr-only">Ways to reach us</h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <a
              href="https://wa.me/233531113454?text=Hello%20Elevate%20Career%20Hub%2C%20I%27d%20like%20to%20talk%20about..."
              target="_blank"
              rel="noopener"
              className="card text-center flex flex-col items-center gap-3 no-underline hover:shadow-soft transition-shadow"
              aria-label="Message Elevate Career Hub on WhatsApp"
            >
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor"><path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.76.46 3.47 1.33 4.98L2 22l5.16-1.35a9.96 9.96 0 0 0 4.88 1.27h.01c5.52 0 10-4.48 10-10s-4.49-9.92-10.01-9.92zm5.86 14.18c-.25.7-1.44 1.34-2.02 1.42-.51.08-1.18.11-1.91-.12-.44-.14-1-.32-1.72-.63-3.03-1.31-5.01-4.36-5.16-4.56-.15-.2-1.24-1.66-1.24-3.16s.79-2.24 1.07-2.54c.28-.3.62-.38.83-.38h.6c.19 0 .45-.07.7.54.25.61.86 2.11.94 2.27.08.16.13.34.03.55-.1.21-.15.34-.3.52-.15.18-.31.41-.45.55-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.03 1.13 1 2.07 1.31 2.36 1.46.29.15.46.13.63-.08.17-.21.74-.86.94-1.16.2-.3.39-.25.66-.15.27.1 1.72.81 2.01.96.29.15.49.22.56.34.07.13.07.7-.18 1.4z"/></svg>
              </span>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">WhatsApp</p>
              <p className="text-headline-md">+233 53 111 3454</p>
              <p className="text-ink-muted text-sm">Fastest way to reach us. Available during business hours.</p>
              <span className="btn-primary mt-2">Message us on WhatsApp</span>
            </a>

            <a
              href="mailto:hello@elevatecareerhub.com"
              className="card text-center flex flex-col items-center gap-3 no-underline hover:shadow-soft transition-shadow"
              aria-label="Email Elevate Career Hub"
            >
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l9 6 9-6M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Email</p>
              <p className="text-headline-md break-all">hello@elevatecareerhub.com</p>
              <p className="text-ink-muted text-sm">For longer questions or sharing documents.</p>
              <span className="btn-secondary mt-2">Send an email</span>
            </a>
          </div>
        </section>

        <section className="bg-surface" aria-labelledby="topics-heading">
          <div className="container-site py-16">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center max-w-5xl mx-auto">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">What can we help with?</p>
                <h2 id="topics-heading" className="text-headline-lg mb-4">Talk to Elevate Career Hub</h2>
                <p className="text-ink-muted leading-relaxed mb-3">
                  Tell us what you are working on and we will guide you to the right next step. You can ask about CVs, cover letters, applications, interviews, scholarships, school selection, DIY resources, and education or career planning.
                </p>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TOPICS.map((topic, i) => (
                  <li key={i} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-black/5">
                    <svg viewBox="0 0 20 20" className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 10l4 4 6-8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="text-sm text-ink">{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
