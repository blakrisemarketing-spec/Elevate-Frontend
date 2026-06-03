import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';

const CLIENT_LOGOS = [
  { name: 'Harvard University', src: '/assets/wp-content/uploads/2024/02/Harvard-300x180.png' },
  { name: 'EY', src: '/assets/wp-content/uploads/2024/02/EY-300x180.png' },
  { name: 'KPMG', src: '/assets/wp-content/uploads/2024/02/KPMG-300x180.png' },
  { name: 'PwC', src: '/assets/wp-content/uploads/2024/02/pwc-300x180.png' },
  { name: 'University of Manchester', src: '/assets/wp-content/uploads/2024/02/MU-300x180.png' },
  { name: 'University of British Columbia', src: '/assets/wp-content/uploads/2024/02/ubc-300x180.png' },
  { name: 'SFU Beedie School of Business', src: '/assets/wp-content/uploads/2024/02/SFU-300x180.png' },
  { name: 'Cambridge University Press', src: '/assets/wp-content/uploads/2024/02/CU-300x180.png' },
];

const TESTIMONIALS = [
  { author: 'Sarah', quote: 'Just wanted to shoot you a quick message to say a massive thank you for all your help getting me where I am now. Your help with my CV, LinkedIn tips and advice as well as that job application you practically held my hand through — it all made a huge difference. Three months into my new gig, and I\'m loving it.' },
  { author: 'Samuella', quote: 'Thank you so much for your assistance with my SOP. I landed an unconditional offer with the University of Manchester!' },
  { author: 'Nana Adjoa', quote: 'I just got an email this morning that I\'ve been shortlisted to take the assessment by PwC. Thank you for that impeccable CV. Fingers crossed. I\'ll be back for interview tips.' },
  { author: 'Danielle', quote: 'This is a wonderful piece. It\'s as if you know my aspirations. The part about establishing a consultancy — spot on! A great work done. Thank you so much.' },
  { author: 'Davida', quote: 'I\'ve looked at the LinkedIn Optimization SEVERAL TIMES. Emphasis on several times. I love it! And I just kept on smiling. It\'s like you took the words out of my head.' },
  { author: 'Nyhira', quote: 'I owe you one, big tie. I\'ll make sure to spread the word about how awesome the Elevate Team is.' },
];

const BLOG_POSTS = [
  { date: '14 October 2023', title: 'How to Boost Your Career with Professional Resume Writing', href: '/how-to-boost-your-career-with-professional-resume-writing/' },
  { date: '14 October 2023', title: 'How Our Career Development Company Can Help You Stand Out', href: '/how-our-career-development-company-can-help-you-stand-out/' },
  { date: '14 October 2023', title: 'The Importance of Professional Documents in Career Development', href: '/the-importance-of-professional-documents-in-career-development/' },
];

function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const AVATARS = [
  '/assets/wp-content/uploads/2024/01/T9-100x100.webp',
  '/assets/wp-content/uploads/2024/01/T7-Copy-100x100.webp',
  '/assets/wp-content/uploads/2024/01/R5-Copy-100x100.webp',
];

function ClientAvatarStack() {
  return (
    <div className="flex -space-x-2 shrink-0" aria-hidden="true">
      {AVATARS.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          loading="eager"
          decoding="async"
          width={36}
          height={36}
          className="inline-block w-9 h-9 rounded-full ring-2 ring-white object-cover bg-canvas"
        />
      ))}
    </div>
  );
}

export function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="/" />

      <main id="main">
        {/* HERO ─────────────────────────────────────────────── */}
        <section className="relative bg-canvas overflow-hidden" aria-labelledby="hero-heading">
          {/* Decorative background dots (top-left) */}
          <div aria-hidden="true" className="absolute top-10 left-6 lg:left-12 w-32 h-32 opacity-30">
            <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
              {Array.from({ length: 49 }, (_, i) => {
                const col = i % 7;
                const row = Math.floor(i / 7);
                return <circle key={i} cx={5 + col * 14} cy={5 + row * 14} r="1.6" fill="currentColor" />;
              })}
            </svg>
          </div>

          <div className="container-site grid gap-12 lg:grid-cols-12 lg:items-center py-16 lg:py-24 relative">
            {/* LEFT — copy */}
            <div className="lg:col-span-6 relative z-10">
              <p className="eyebrow text-primary mb-5">Welcome to Elevate</p>
              <h1 id="hero-heading" className="text-display-xl mb-7 text-navy">
                Complete Hub for Unrivaled Career and Education Success
              </h1>
              <p className="text-lg text-ink-muted leading-relaxed mb-9 max-w-xl not-italic">
                Are you ready to ascend to new heights in your career or education? Welcome to Elevate Career Hub, your gateway to a transformative career experience.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <a href="/contact-us/" className="btn-primary">
                  Get Started Here <ArrowRight />
                </a>
                <a href="/career-services/" className="inline-flex items-center gap-2 text-navy font-semibold no-underline group">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-navy/20 group-hover:bg-electric group-hover:border-electric transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M8 5l8 7-8 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  Explore services
                </a>
              </div>
            </div>

            {/* RIGHT — photo + overlay */}
            <div className="lg:col-span-6 relative">
              <div className="relative max-w-md lg:max-w-none mx-auto">
                {/* Navy backdrop shape (behind photo) */}
                <div
                  aria-hidden="true"
                  className="absolute -right-4 -bottom-4 top-8 left-8 bg-gradient-to-br from-navy via-primary to-electric rounded-[2.5rem]"
                />
                {/* Decorative dots (top-right corner of card) */}
                <div aria-hidden="true" className="absolute -top-4 -right-2 w-20 h-20 opacity-40 z-10">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-electric">
                    {Array.from({ length: 25 }, (_, i) => {
                      const col = i % 5;
                      const row = Math.floor(i / 5);
                      return <circle key={i} cx={5 + col * 20} cy={5 + row * 20} r="2.2" fill="currentColor" />;
                    })}
                  </svg>
                </div>

                {/* Photo — two co-founders auto-crossfading (CSS-only, no JS) */}
                <div className="relative rounded-[2rem] overflow-hidden shadow-soft aspect-[4/5] bg-gradient-to-b from-surface-tint to-white">
                  <img
                    src="/assets/founders/rosemary.webp"
                    alt="Rosemary Agyeiwah Great-Damzi, Elevate Career Hub co-founder"
                    width={600}
                    height={465}
                    loading="eager"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                  <img
                    src="/assets/founders/naa.webp"
                    alt="Naa Lamle Lamptey, Elevate Career Hub co-founder"
                    width={600}
                    height={692}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="hero-swap-top absolute inset-0 w-full h-full object-cover object-top"
                  />
                </div>

                {/* Stat overlay card */}
                <div className="absolute -bottom-6 -left-4 sm:-left-6 right-8 sm:right-auto sm:w-[22rem] bg-white rounded-2xl shadow-soft p-5">
                  <div className="flex items-center gap-3.5">
                    <ClientAvatarStack />
                    <div className="min-w-0">
                      <div className="font-display italic font-bold text-navy text-3xl leading-none whitespace-nowrap">2,000+</div>
                      <p className="text-xs text-ink-muted mt-1 not-italic">Total clients we&rsquo;ve helped elevate</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom banner stripe */}
          <div className="bg-electric/15 border-y border-electric/30 mt-8 lg:mt-12">
            <div className="container-site py-4 text-center text-sm text-navy not-italic">
              Take the first step toward new opportunities. We&rsquo;re here to guide you through every stage of your career journey.
            </div>
          </div>
        </section>

        {/* CLIENTS BAND ─────────────────────────────────────── */}
        <section className="bg-navy" aria-labelledby="clients-heading">
          <div className="container-site py-12">
            <h2 id="clients-heading" className="text-center text-headline-md text-white mb-9">
              Most of our clients are now in:
            </h2>
            <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14" aria-label="Companies and universities our clients work and study at">
              {CLIENT_LOGOS.map(logo => (
                <li key={logo.name}>
                  <img
                    src={logo.src}
                    alt={logo.name}
                    loading="lazy"
                    decoding="async"
                    className="h-9 sm:h-11 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ABOUT ────────────────────────────────────────────── */}
        <section className="bg-canvas" aria-labelledby="about-heading">
          <div className="container-site py-20 grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="eyebrow text-navy mb-4">About Us</p>
              <h2 id="about-heading" className="text-display-lg text-primary mb-6">
                Crafting Careers, Building Educational Futures
              </h2>
              <p className="text-ink-muted leading-relaxed mb-4">
                Our story is one of dedication to empowering individuals on their career journeys and in achieving their educational goals. At Elevate, we believe in the transformative power of a thriving career and a world-class education.
              </p>
              <p className="text-ink-muted leading-relaxed mb-4">
                Our mission is to provide a dynamic hub where ambitious professionals, like you, can discover, learn, and connect. Whether you&rsquo;re seeking new opportunities, looking to enhance your skills, or craving mentorship to guide your path, Elevate is designed to be your ally in achieving your career and educational goals.
              </p>
              <p className="text-ink-muted leading-relaxed mb-8">
                Discover the story behind Elevate – your go-to destination for professional growth. Learn about our mission, values, and the passionate team driving the vision.
              </p>
              <a href="/about/" className="btn-primary">
                Learn More <ArrowRight />
              </a>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-card translate-y-6 bg-primary-100">
                  <img
                    src="/assets/wp-content/uploads/2024/02/Rosemary-Headshots-44-scaled-e1708820376937-600x600.webp"
                    alt="Rosemary Agyeiwah Great-Damzi, Elevate Career Hub co-founder"
                    width={600}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-card -translate-y-6 bg-primary-100">
                  <img
                    src="/assets/wp-content/uploads/2024/02/Naa-7_Original-scaled-e1708822884258-600x600.webp"
                    alt="Naa Lamle Lamptey, Elevate Career Hub co-founder"
                    width={600}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS BAND ────────────────────────────────────────── */}
        <section className="bg-navy" aria-labelledby="stats-heading">
          <div className="container-site py-14">
            <h2 id="stats-heading" className="sr-only">Our impact</h2>
            <div className="grid grid-cols-3 gap-6 text-center text-white">
              <div>
                <div className="text-display-lg text-electric leading-none">5+</div>
                <p className="text-sm uppercase tracking-wide mt-3">Years of experience</p>
              </div>
              <div>
                <div className="text-display-lg text-electric leading-none">2,000+</div>
                <p className="text-sm uppercase tracking-wide mt-3">Satisfied Clients</p>
              </div>
              <div>
                <div className="text-display-lg text-electric leading-none">99%</div>
                <p className="text-sm uppercase tracking-wide mt-3">Positive Reviews</p>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES ─────────────────────────────────────────── */}
        <section className="bg-primary" aria-labelledby="services-heading">
          <div className="container-site py-20">
            <div className="text-center max-w-2xl mx-auto mb-12 text-white">
              <p className="eyebrow text-electric mb-4">Our Services</p>
              <h2 id="services-heading" className="text-display-lg text-white">
                Our Suite of Services for Career Ascension
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <article className="card bg-white">
                <h3 className="text-headline-md text-navy mb-4">Career Services</h3>
                <p className="text-ink-muted leading-relaxed mb-6">
                  Elevate your career with our comprehensive Career Services. From professional resume writing to personalized interview coaching, we offer tailored solutions to help you navigate every stage of your career journey with confidence and success.
                </p>
                <a href="/career-services/" className="inline-flex items-center gap-1 text-primary font-semibold no-underline hover:underline">
                  Learn more <ArrowRight />
                </a>
              </article>
              <article className="card bg-surface-tint ring-2 ring-electric/30">
                <h3 className="text-headline-md text-navy mb-4">Educational Services</h3>
                <p className="text-ink-muted leading-relaxed mb-6">
                  Unlock your academic potential with our Educational Services. Whether you&rsquo;re selecting the perfect school or seeking expert guidance on academic planning, our dedicated team is here to support you in making informed decisions and achieving your educational goals.
                </p>
                <a href="/educational-services/" className="inline-flex items-center gap-1 text-primary font-semibold no-underline hover:underline">
                  Learn more <ArrowRight />
                </a>
              </article>
              <article className="card bg-white">
                <h3 className="text-headline-md text-navy mb-4">DIY Products</h3>
                <p className="text-ink-muted leading-relaxed mb-6">
                  Empower yourself with our range of DIY Products made to enhance your career and educational prospects. From resume templates to interview preparation guides, our products provide valuable resources to help you take control.
                </p>
                <a href="/diy-products/" className="inline-flex items-center gap-1 text-primary font-semibold no-underline hover:underline">
                  Learn more <ArrowRight />
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS ──────────────────────────────────────── */}
        <section className="bg-canvas" aria-labelledby="testimonials-heading">
          <div className="container-site py-20">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="eyebrow text-primary mb-4">Testimonials</p>
              <h2 id="testimonials-heading" className="text-display-lg text-primary">
                Positive Reviews From Our Clients
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <figure key={i} className="bg-white rounded-2xl p-6 flex gap-4 shadow-card">
                  <span aria-hidden="true" className="inline-block w-12 h-12 rounded-full bg-gradient-to-br from-electric to-primary shrink-0" />
                  <div>
                    <blockquote className="text-sm text-ink leading-relaxed">{t.quote}</blockquote>
                    <figcaption className="mt-3 text-xs font-semibold text-navy">{t.author}</figcaption>
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* BLOG ─────────────────────────────────────────────── */}
        <section className="bg-canvas" aria-labelledby="blog-heading">
          <div className="container-site py-20 border-t border-black/5">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="eyebrow text-primary mb-4">Blog</p>
              <h2 id="blog-heading" className="text-display-lg text-primary">
                News Articles From Elevate
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {BLOG_POSTS.map((post, i) => (
                <article key={i} className="bg-white rounded-2xl overflow-hidden shadow-card flex flex-col">
                  <div aria-hidden="true" className="aspect-[16/10] bg-gradient-to-br from-primary-100 via-electric-400 to-primary" />
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-3">{post.date}</p>
                    <h3 className="font-sans font-bold text-base text-navy leading-snug mb-4 not-italic">
                      {post.title}
                    </h3>
                    <a href={post.href} className="inline-flex items-center gap-1 text-primary font-semibold mt-auto no-underline hover:underline">
                      Read more <ArrowRight />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA ─────────────────────────────────────────── */}
        <section aria-labelledby="cta-heading">
          <div className="container-site py-20">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-navy via-primary to-electric p-10 sm:p-16 text-center shadow-soft">
              <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent_55%)]" />
              <div className="relative">
                <p className="eyebrow text-electric mb-4">Get Started</p>
                <h2 id="cta-heading" className="text-display-lg text-white mb-6">
                  Take the First Step. Launch Your Success Story with Elevate
                </h2>
                <p className="text-white/90 text-lg max-w-xl mx-auto mb-8 not-italic">
                  Reach out and elevate your career journey today.
                </p>
                <a href="/contact-us/" className="btn-white">
                  Contact Us <ArrowRight />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
