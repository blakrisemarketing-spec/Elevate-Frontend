import { TestimonialCard } from './TestimonialCard';

const TESTIMONIALS = [
  {
    author: 'Sarah',
    quote: 'Just wanted to shoot you a quick message to say a massive thank you for all your help getting me where I am now. Your help with my CV, LinkedIn tips and advice as well as that job application you practically held my hand through — it all made a huge difference. Three months into my new gig, and I\'m loving it.',
  },
  {
    author: 'Samuella',
    quote: 'Thank you so much for your assistance with my SOP. I landed an unconditional offer with the University of Manchester!',
  },
  {
    author: 'Nana Adjoa',
    quote: 'I just got an email this morning that I\'ve been shortlisted to take the assessment by PwC. Thank you for that impeccable CV. Fingers crossed. I\'ll be back for interview tips.',
  },
  {
    author: 'Danielle',
    quote: 'This is a wonderful piece. It\'s as if you know my aspirations. The part about establishing a consultancy — spot on! A great work done. Thank you so much.',
  },
  {
    author: 'Davida',
    quote: 'I\'ve looked at the LinkedIn Optimization SEVERAL TIMES. Emphasis on several times. I love it! And I just kept on smiling. It\'s like you took the words out of my head.',
  },
];

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
            <TestimonialCard key={i} author={t.author} quote={t.quote} />
          ))}
        </div>
      </div>
    </section>
  );
}
