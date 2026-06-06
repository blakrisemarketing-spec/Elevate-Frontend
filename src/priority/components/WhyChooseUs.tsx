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
          <h2 id="why-heading" className="text-headline-lg">Guidance from people who&rsquo;ve actually been inside</h2>
          <p className="text-ink-muted leading-relaxed mt-4">
            Most guidance comes from people who read about the process. Ours comes from people who&rsquo;ve lived it &mdash; broken into top firms, won the scholarships, and started over in a new country.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <article className="card">
            <h3 className="text-headline-md mb-3">We&rsquo;ve been inside</h3>
            <p className="text-ink-muted leading-relaxed">We&rsquo;re not guessing how it works. We&rsquo;ve sat on the inside of top firms and world-class universities, and we tell you what actually moves the needle &mdash; not the generic advice everyone else repeats.</p>
          </article>
          <article className="card">
            <h3 className="text-headline-md mb-3">We walk it with you</h3>
            <p className="text-ink-muted leading-relaxed">This isn&rsquo;t a template you&rsquo;re left to figure out alone. We&rsquo;re with you at every step, from first application to offer &mdash; the way a friend who&rsquo;s done it would be.</p>
          </article>
          <article className="card">
            <h3 className="text-headline-md mb-3">We tell you the truth</h3>
            <p className="text-ink-muted leading-relaxed">No false promises, no fluff. We&rsquo;re honest about what&rsquo;s hard and clear about what works &mdash; because that&rsquo;s the only thing that actually gets you in.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
