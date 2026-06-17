import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { VideoTestimonials } from '../components/VideoTestimonials';
import { BlogCover } from '../components/BlogCover';
import { TESTIMONIALS } from '../data/testimonials';
import { BLOG_POSTS } from '../data/blog';

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

          <div className="container-site grid gap-12 lg:grid-cols-12 lg:items-center py-16 lg:py-20 relative">
            {/* LEFT, copy */}
            <div className="lg:col-span-6 relative z-10">
              <p className="eyebrow text-primary mb-5">Accelerating access to global careers &amp; scholarships</p>
              <h1 id="hero-heading" className="text-display-xl text-navy mb-2">
                Most opportunities go to people who already know someone.
              </h1>
              <h2 className="text-display-xl text-primary mb-7">
                We&rsquo;re changing that.
              </h2>
              <p className="text-lg text-ink-muted leading-relaxed mb-9 max-w-xl not-italic">
                We help ambitious people break into top jobs, top universities, and new careers home or abroad, no insider network required.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <a href="/career-services/" className="btn-primary">
                  Land a job <ArrowRight />
                </a>
                <a href="/educational-services/" className="inline-flex items-center gap-2 text-navy font-semibold no-underline group">
                  Study abroad
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-navy/20 group-hover:bg-electric group-hover:border-electric transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M8 5l8 7-8 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </a>
              </div>
            </div>

            {/* RIGHT, photo + overlay */}
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

                {/* Photo, two co-founders auto-crossfading (CSS-only, no JS) */}
                <div className="relative rounded-[2rem] overflow-hidden shadow-soft aspect-[4/5] bg-gradient-to-b from-surface-tint to-white">
                  <img
                    src="/assets/founders/rosemary.webp"
                    alt="Rosemary Agyeiwah Great-Damzi, Elevate Career Hub co-founder"
                    width={720}
                    height={900}
                    loading="eager"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                  <img
                    src="/assets/founders/naa.webp"
                    alt="Naa Lamle Lamptey, Elevate Career Hub co-founder"
                    width={720}
                    height={900}
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
              No insider network? That&rsquo;s exactly who we&rsquo;re here for. Elevate is the connection our clients didn&rsquo;t have.
            </div>
          </div>
        </section>

        {/* CLIENTS BAND ─────────────────────────────────────── */}
        <section className="bg-navy" aria-labelledby="clients-heading">
          <div className="container-site py-12">
            <h2 id="clients-heading" className="text-center text-headline-md text-white mb-9">
              Our clients are now building careers and studying at:
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
              <p className="eyebrow text-navy mb-4">Our Story</p>
              <h2 id="about-heading" className="text-display-lg text-primary mb-6">
                We exist to break one pattern
              </h2>
              <p className="text-ink-muted leading-relaxed mb-4">
                Elevate isn&rsquo;t just a service provider. It&rsquo;s an answer to a problem most ambitious applicants never name out loud, that opportunity, almost everywhere, gets distributed by who you know, not what you can do.
              </p>
              <p className="text-ink-muted leading-relaxed mb-4">
                Whether you&rsquo;re applying to a top firm in Accra, chasing a master&rsquo;s at Manchester, or rebuilding a career as an immigrant in London or Toronto, the rules have always rewarded insiders.
              </p>
              <p className="text-ink-muted leading-relaxed mb-8">
                We&rsquo;re the brilliant friend who&rsquo;s been inside the system, learned how it works, and tells you what they wish someone had told them. Warm enough to trust. Direct enough to actually help.
              </p>
              <a href="/about/" className="btn-primary">
                Read our story <ArrowRight />
              </a>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-card translate-y-6 bg-primary-100">
                  <img
                    src="/assets/founders/rosemary-square.webp"
                    alt="Rosemary Agyeiwah Great-Damzi, Elevate Career Hub co-founder"
                    width={600}
                    height={750}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-card -translate-y-6 bg-primary-100">
                  <img
                    src="/assets/founders/naa-square.webp"
                    alt="Naa Lamle Lamptey, Elevate Career Hub co-founder"
                    width={600}
                    height={750}
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
                <div className="text-display-lg text-electric leading-none">6+</div>
                <p className="text-sm uppercase tracking-wide mt-3">Years of experience</p>
              </div>
              <div>
                <div className="text-display-lg text-electric leading-none">2,000+</div>
                <p className="text-sm uppercase tracking-wide mt-3">Professionals helped</p>
              </div>
              <div>
                <div className="text-display-lg text-electric leading-none">96%</div>
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
                Here&rsquo;s how we can help
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <article className="card bg-white">
                <h3 className="text-headline-md text-navy mb-4">Career Services</h3>
                <p className="text-ink-muted leading-relaxed mb-6">
                  Whether you&rsquo;re going after a top firm at home or rebuilding your career in a new country, we&rsquo;ll help you get there faster. Resume, interviews, positioning, the whole approach, shaped by people who&rsquo;ve actually sat on the inside and know what makes a candidate stand out.
                </p>
                <a href="/career-services/" className="inline-flex items-center gap-1 text-primary font-semibold no-underline hover:underline">
                  Learn more <ArrowRight />
                </a>
              </article>
              <article className="card bg-surface-tint ring-2 ring-electric/30">
                <h3 className="text-headline-md text-navy mb-4">Educational Services</h3>
                <p className="text-ink-muted leading-relaxed mb-6">
                  Picking the right master&rsquo;s program and actually getting in (and funded) is a lot to figure out alone. We&rsquo;ve done it ourselves, at schools like Manchester and Michigan Ross, and we&rsquo;ll walk it with you: choosing the program that fits, building an application that lands, and going after the scholarships that pay for it.
                </p>
                <a href="/educational-services/" className="inline-flex items-center gap-1 text-primary font-semibold no-underline hover:underline">
                  Learn more <ArrowRight />
                </a>
              </article>
              <article className="card bg-white">
                <h3 className="text-headline-md text-navy mb-4">DIY Products</h3>
                <p className="text-ink-muted leading-relaxed mb-6">
                  Want to start on your own? These are the resume templates, interview guides, and prep tools we wish we&rsquo;d had at the beginning. Practical, no fluff, built to get you moving today, with the option to bring us in whenever you want a hand.
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

            <VideoTestimonials />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
              {TESTIMONIALS.map((t, i) => (
                <figure key={i} className="bg-white rounded-2xl p-6 flex gap-4 shadow-card">
                  {t.image ? (
                    <img src={t.image} alt={t.author} width={48} height={48} loading="lazy" className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <span aria-hidden="true" className="inline-block w-12 h-12 rounded-full bg-gradient-to-br from-electric to-primary shrink-0" />
                  )}
                  <div>
                    <blockquote className="text-sm text-ink leading-relaxed">{t.quote}</blockquote>
                    <figcaption className="mt-3 text-xs font-semibold text-navy">
                      {t.author}
                      {t.role && <span className="block font-normal text-ink-muted mt-0.5">{t.role}</span>}
                    </figcaption>
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
              {BLOG_POSTS.slice(0, 3).map((post) => (
                <article key={post.slug} className="bg-white rounded-2xl overflow-hidden shadow-card flex flex-col">
                  <a href={post.route} className="block relative" aria-label={post.title}>
                    <BlogCover cover={post.cover} className="w-full aspect-[16/10]" />
                    <span className="absolute top-4 left-4 inline-block bg-white/95 text-navy text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                  </a>
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-xs text-ink-muted font-medium mb-3">{post.date} &middot; {post.readMinutes} min read</p>
                    <h3 className="font-sans font-bold text-base text-navy leading-snug mb-4 not-italic">
                      <a href={post.route} className="no-underline text-navy hover:text-primary">{post.title}</a>
                    </h3>
                    <a href={post.route} className="inline-flex items-center gap-1 text-primary font-semibold mt-auto no-underline hover:underline">
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
                  Tell us the goal and we&rsquo;ll map the path
                </h2>
                <p className="text-white/90 text-lg max-w-xl mx-auto mb-8 not-italic">
                  A job at a top firm, a scholarship to a world-class university, a career in a new country. Tell us where you want to go.
                </p>
                <a href="/contact-us/" className="btn-white">
                  Book a free chat <ArrowRight />
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
