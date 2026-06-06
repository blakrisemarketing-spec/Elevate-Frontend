interface FinalCTAProps {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
}

export function FinalCTA({
  eyebrow = 'Get started',
  heading = 'Tell us the goal. We’ll map the path.',
  subheading = 'A job at a top firm, a scholarship to a world-class university, a career in a new country. Tell us where you want to go and we’ll show you how to get there.',
}: FinalCTAProps) {
  return (
    <section aria-labelledby="cta-heading">
      <div className="container-site py-20">
        <div className="bg-gradient-to-br from-primary to-navy text-white rounded-xl p-10 sm:p-14 text-center shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wider text-electric mb-3">{eyebrow}</p>
          <h2 id="cta-heading" className="text-headline-lg text-white mb-5">{heading}</h2>
          <p className="text-white/90 text-lg max-w-xl mx-auto mb-8">{subheading}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/contact-us/" className="btn-primary bg-electric text-navy hover:bg-electric-600">Book a free chat</a>
            <a href="https://wa.me/233531113454" className="btn-secondary bg-transparent border-white text-white hover:bg-white/10" rel="noopener" target="_blank">WhatsApp us</a>
          </div>
        </div>
      </div>
    </section>
  );
}
