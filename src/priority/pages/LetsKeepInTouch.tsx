import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';

const CHANNELS = [
  {
    label: 'WhatsApp',
    value: '+233 53 111 3454',
    href: 'https://wa.me/233531113454',
    note: 'The fastest way to reach us. Available during business hours.',
  },
  {
    label: 'Email',
    value: 'hello@elevatecareerhub.com',
    href: 'mailto:hello@elevatecareerhub.com',
    note: 'For longer questions or sharing documents.',
  },
  {
    label: 'Instagram',
    value: '@elevatecareerhub',
    href: 'https://www.instagram.com/elevatecareerhub/',
    note: 'Tips, wins, and behind-the-scenes.',
  },
];

export function LetsKeepInTouchPage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="" />

      <main id="main">
        <PageHero
          eyebrow="Stay connected"
          title="Let’s keep in touch"
          crumbs={[{ label: 'Home', href: '/' }, { label: 'Let’s keep in touch' }]}
          intro={<p>Follow along and reach out — we share practical career and scholarship tips, and we’re always happy to point you to the right next step.</p>}
        />

        <section className="container-site py-16" aria-labelledby="channels-heading">
          <h2 id="channels-heading" className="sr-only">Ways to stay in touch</h2>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {CHANNELS.map((c) => (
              <a key={c.label} href={c.href} target="_blank" rel="noopener"
                className="card text-center flex flex-col items-center gap-2 no-underline hover:shadow-soft transition-shadow">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">{c.label}</p>
                <p className="text-headline-md break-all">{c.value}</p>
                <p className="text-ink-muted text-sm">{c.note}</p>
              </a>
            ))}
          </div>

          <div className="text-center mt-12">
            <a href="/contact-us/" className="btn-primary">Get in touch</a>
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
