import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';
import { FinalCTA } from '../components/FinalCTA';
import { BLOG_POSTS } from '../data/blog';

/** Data-driven template for `/<post-slug>/`. Renders structured body blocks. */
export function BlogPostPage({ slug }: { slug: string }) {
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) throw new Error(`BlogPostPage: no post for slug "${slug}"`);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="/blog/" />

      <main id="main">
        <PageHero
          eyebrow="Blog"
          title={post.title}
          crumbs={[{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog/' }, { label: post.title }]}
          intro={<p className="text-white/80 text-base">{post.date}</p>}
        />

        <section className="container-site py-16" aria-labelledby="post-body">
          <article className="max-w-3xl mx-auto">
            <h2 id="post-body" className="sr-only">{post.title}</h2>
            {post.body.map((block, i) => {
              if (block.type === 'h') return <h3 key={i} className="text-headline-md text-navy mt-10 mb-3">{block.text}</h3>;
              if (block.type === 'ul') return (
                <ul key={i} className="list-disc pl-6 text-ink-muted leading-relaxed mb-5 space-y-2">
                  {block.items.map((item, j) => <li key={j}>{item}</li>)}
                </ul>
              );
              return <p key={i} className="text-ink-muted leading-relaxed mb-5">{block.text}</p>;
            })}

            <p className="mt-10">
              <a href="/blog/" className="text-primary font-semibold no-underline hover:text-navy">&larr; Back to all articles</a>
            </p>
          </article>
        </section>

        <FinalCTA />
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
