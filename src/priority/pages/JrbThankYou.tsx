import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';

export function JrbThankYouPage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="" />

      <main id="main">
        <section className="bg-gradient-to-br from-primary to-navy text-white" aria-labelledby="jrb-ty-heading">
          <div className="container-site py-20 lg:py-28 text-center">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/15 text-electric mb-6" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <h1 id="jrb-ty-heading" className="text-display-lg text-white mb-4">Congratulations!</h1>
            <p className="text-lg text-white/90 leading-relaxed max-w-xl mx-auto">
              Welcome to the Job Readiness Bootcamp — and thank you for completing your payment.
            </p>
          </div>
        </section>

        <section className="container-site py-16" aria-labelledby="jrb-next">
          <div className="max-w-2xl mx-auto text-center">
            <h2 id="jrb-next" className="text-headline-lg mb-4">One last step</h2>
            <p className="text-ink-muted leading-relaxed mb-8">
              Please complete the short onboarding form so we can tailor the bootcamp experience to your goals and background. It takes about 3&ndash;5 minutes. If you have any questions, message us on WhatsApp and we&rsquo;ll help right away.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="https://wa.me/233531113454" className="btn-primary" target="_blank" rel="noopener">Message us on WhatsApp</a>
              <a href="/" className="btn-secondary">Back to home</a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
