import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';
import { FinalCTA } from '../components/FinalCTA';
import { BlogCover } from '../components/BlogCover';
import { BLOG_POSTS } from '../data/blog';

/** Data-driven template for `/<post-slug>/`. Renders structured body blocks. */
export function BlogPostPage({ slug }: { slug: string }) {
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) throw new Error(`BlogPostPage: no post for slug "${slug}"`);

  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="/blog/" />

      <main id="main">
        <PageHero
          eyebrow={post.category}
          title={post.title}
          crumbs={[{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog/' }, { label: post.title }]}
          intro={<p className="text-white/80 text-base">{post.date} &middot; {post.readMinutes} min read</p>}
        />

        <section className="container-site py-12 md:py-16" aria-labelledby="post-body">
          <article className="max-w-3xl mx-auto">
            <h2 id="post-body" className="sr-only">{post.title}</h2>

            <div className="rounded-2xl overflow-hidden shadow-card mb-8">
              <BlogCover cover={post.cover} className="w-full h-48 sm:h-60" />
            </div>

            <p className="flex items-center gap-3 text-sm text-ink-muted mb-8 pb-6 border-b border-surface-muted">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary font-bold">E</span>
              By the Elevate Career Hub team
            </p>

            {post.body.map((block, i) => {
              if (block.type === 'h') return <h3 key={i} className="text-headline-md text-navy mt-10 mb-3">{block.text}</h3>;
              if (block.type === 'ul') return (
                <ul key={i} className="list-disc pl-6 text-ink-muted leading-relaxed mb-5 space-y-2">
                  {block.items.map((item, j) => <li key={j}>{item}</li>)}
                </ul>
              );
              // Lead the article with a slightly larger opening paragraph.
              const lead = i === 0 ? 'text-lg text-ink' : 'text-ink-muted';
              return <p key={i} className={`${lead} leading-relaxed mb-5`}>{block.text}</p>;
            })}

            <p className="mt-10">
              <a href="/blog/" className="text-primary font-semibold no-underline hover:text-navy">&larr; Back to all articles</a>
            </p>
          </article>
        </section>

        {related.length > 0 && (
          <section className="bg-surface" aria-labelledby="related-heading">
            <div className="container-site py-14">
              <h2 id="related-heading" className="text-headline-md text-navy mb-8 text-center">Keep reading</h2>
              <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
                {related.map((p) => (
                  <article key={p.slug} className="group flex flex-col h-full bg-white rounded-2xl shadow-card overflow-hidden">
                    <a href={p.route} className="block relative" aria-label={p.title}>
                      <BlogCover cover={p.cover} className="w-full h-32" />
                      <span className="absolute top-3 left-3 inline-block bg-white/95 text-navy text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                        {p.category}
                      </span>
                    </a>
                    <div className="flex flex-col flex-1 p-5">
                      <p className="text-xs font-medium text-ink-muted mb-2">{p.date} &middot; {p.readMinutes} min read</p>
                      <h3 className="text-base font-bold leading-snug">
                        <a href={p.route} className="no-underline text-navy hover:text-primary">{p.title}</a>
                      </h3>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <FinalCTA />
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
