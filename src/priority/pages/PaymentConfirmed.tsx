import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';

/**
 * Post-payment confirmation. Static by default (works with JS off, the buyer's
 * email carries the reference + any download). A tiny inline script
 * progressively fills in the reference from ?ref and reveals a download button
 * for digital products from ?item.
 */
export function PaymentConfirmedPage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="/contact-us/" />

      <main id="main">
        <section className="container-site py-20">
          <div className="max-w-xl mx-auto text-center">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-electric/15 text-primary mb-6" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <h1 className="text-display-lg text-primary mb-4">Payment confirmed</h1>
            <p className="text-lg text-ink-muted leading-relaxed mb-2 not-italic">
              Thank you, your payment was successful. A confirmation has been sent to your email.
            </p>
            <p id="ref-row" className="text-sm text-ink-muted mb-8 not-italic" style={{ display: 'none' }}>
              Reference: <span id="ref" className="font-semibold text-navy"></span>
            </p>

            <a id="download" href="#" className="btn-primary mb-4" style={{ display: 'none' }}>
              Download your product
            </a>

            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <a href="/" className="btn-secondary">Back to home</a>
              <a href="https://wa.me/233531113454" className="btn-secondary" target="_blank" rel="noopener">Message us on WhatsApp</a>
            </div>

            <p className="text-sm text-ink-muted mt-10 not-italic">
              For services, our team will reach out shortly to get started. Need us sooner? Email{' '}
              <a href="mailto:hello@elevatecareerhub.com">hello@elevatecareerhub.com</a>.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />

      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var p=new URLSearchParams(location.search);var ref=p.get('ref');var item=p.get('item');if(ref){var r=document.getElementById('ref');if(r)r.textContent=ref;var row=document.getElementById('ref-row');if(row)row.style.display='';}var d={'diy-remote-job-playbook':'/downloads/the-remote-job-playbook.pdf'};if(item&&d[item]){var a=document.getElementById('download');if(a){a.href=d[item];a.style.display='';}}}catch(e){}})();`,
        }}
      />
    </>
  );
}
