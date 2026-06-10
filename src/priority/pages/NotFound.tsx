import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';

const POPULAR = [
  { label: 'Career Services', href: '/career-services/' },
  { label: 'Educational Services', href: '/educational-services/' },
  { label: 'DIY Products', href: '/diy-products/' },
  { label: 'About Us', href: '/about/' },
  { label: 'Contact Us', href: '/contact-us/' },
];

export function NotFoundPage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="" />

      <main id="main">
        <section className="bg-gradient-to-br from-primary to-navy text-white" aria-labelledby="nf-heading">
          <div className="container-site py-20 lg:py-28 text-center">
            <p className="text-display-lg text-electric mb-2" aria-hidden="true">404</p>
            <h1 id="nf-heading" className="text-headline-lg text-white mb-4">We couldn&rsquo;t find that page</h1>
            <p className="text-lg text-white/90 leading-relaxed max-w-xl mx-auto mb-8">
              The page you&rsquo;re looking for may have moved or no longer exists. Let&rsquo;s get you back on track.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/" className="btn-primary bg-electric text-navy hover:bg-electric-600">Back to home</a>
              <a href="/contact-us/" className="btn-secondary bg-transparent border-white text-white hover:bg-white/10">Contact us</a>
            </div>
          </div>
        </section>

        <section className="container-site py-16" aria-labelledby="nf-popular">
          <h2 id="nf-popular" className="text-headline-md text-center mb-8">Popular pages</h2>
          <ul className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
            {POPULAR.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="inline-flex items-center rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-ink no-underline hover:border-primary hover:text-primary transition-colors">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
