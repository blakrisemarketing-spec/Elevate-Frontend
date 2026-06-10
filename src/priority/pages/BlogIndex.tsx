import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';
import { FinalCTA } from '../components/FinalCTA';
import { BLOG_POSTS } from '../data/blog';

export function BlogIndexPage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="/blog/" />

      <main id="main">
        <PageHero
          eyebrow="Blog"
          title="Career & education insights"
          crumbs={[{ label: 'Home', href: '/' }, { label: 'Blog' }]}
          intro={<p>Practical advice on CVs, applications, interviews, and standing out — from the Elevate Career Hub team.</p>}
        />

        <section className="container-site py-16" aria-labelledby="articles-heading">
          <h2 id="articles-heading" className="sr-only">Articles</h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
            {BLOG_POSTS.map((post) => (
              <article key={post.slug} className="card flex flex-col h-full">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{post.date}</p>
                <h3 className="text-headline-md mb-3">
                  <a href={post.route} className="no-underline text-navy hover:text-primary">{post.title}</a>
                </h3>
                <p className="text-ink-muted leading-relaxed flex-1">{post.excerpt}</p>
                <p className="mt-5">
                  <a href={post.route} className="text-primary font-semibold no-underline hover:text-navy">Read article &rarr;</a>
                </p>
              </article>
            ))}
          </div>
        </section>

        <FinalCTA />
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
