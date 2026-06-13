import { TestimonialCard } from './TestimonialCard';
import { TESTIMONIALS } from '../data/testimonials';

interface TestimonialsBlockProps {
  background?: 'canvas' | 'surface';
}

export function TestimonialsBlock({ background = 'surface' }: TestimonialsBlockProps) {
  const bgClass = background === 'surface' ? 'bg-surface' : 'bg-canvas';
  return (
    <section className={bgClass} aria-labelledby="testimonials-heading">
      <div className="container-site py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Testimonials</p>
          <h2 id="testimonials-heading" className="text-headline-lg">Positive Reviews From Our Clients</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} author={t.author} role={t.role} image={t.image} quote={t.quote} />
          ))}
        </div>
      </div>
    </section>
  );
}
