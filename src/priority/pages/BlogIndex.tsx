import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';
import { FinalCTA } from '../components/FinalCTA';
import { BlogCover } from '../components/BlogCover';
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
          intro={<p>Practical advice on CVs, applications, interviews, and standing out, from the Elevate Career Hub team.</p>}
        />

        <section className="container-site py-16" aria-labelledby="articles-heading">
          <h2 id="articles-heading" className="sr-only">Articles</h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
            {BLOG_POSTS.map((post) => (
              <article key={post.slug} className="group flex flex-col h-full bg-white rounded-2xl shadow-card overflow-hidden">
                <a href={post.route} className="block relative" aria-label={post.title}>
                  <BlogCover cover={post.cover} className="w-full h-44 sm:h-48" />
                  <span className="absolute top-4 left-4 inline-block bg-white/95 text-navy text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                </a>
                <div className="flex flex-col flex-1 p-6 sm:p-7">
                  <p className="text-xs font-medium text-ink-muted mb-2">{post.date} &middot; {post.readMinutes} min read</p>
                  <h3 className="text-headline-md mb-3">
                    <a href={post.route} className="no-underline text-navy hover:text-primary">{post.title}</a>
                  </h3>
                  <p className="text-ink-muted leading-relaxed flex-1">{post.excerpt}</p>
                  <p className="mt-5">
                    <a href={post.route} className="text-primary font-semibold no-underline hover:text-navy">Read article &rarr;</a>
                  </p>
                </div>
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
