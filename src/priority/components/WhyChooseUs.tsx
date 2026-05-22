interface WhyChooseUsProps {
  background?: 'canvas' | 'surface';
}

export function WhyChooseUs({ background = 'surface' }: WhyChooseUsProps) {
  const bgClass = background === 'surface' ? 'bg-surface' : 'bg-canvas';
  return (
    <section className={bgClass} aria-labelledby="why-heading">
      <div className="container-site py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Why choose us</p>
          <h2 id="why-heading" className="text-headline-lg">Unmatched and Unrivaled Excellence</h2>
          <p className="text-ink-muted leading-relaxed mt-4">
            Craft your unique success story with our trailblazing guidance, where your journey is an art of possibilities and achievements that paint the canvas of your future.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <article className="card text-center">
            <h3 className="text-headline-md mb-3">Professional Staff</h3>
            <p className="text-ink-muted leading-relaxed">Our expert staff ensures guidance with precision and excellence.</p>
          </article>
          <article className="card text-center">
            <h3 className="text-headline-md mb-3">Affordable Price</h3>
            <p className="text-ink-muted leading-relaxed">Competitive pricing tailored to your budget, ensuring accessibility without compromising quality.</p>
          </article>
          <article className="card text-center">
            <h3 className="text-headline-md mb-3">Complete Commitment</h3>
            <p className="text-ink-muted leading-relaxed">Experience our unwavering commitment to your success&mdash;every effort, every detail, meticulously aligned to propel you forward.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
