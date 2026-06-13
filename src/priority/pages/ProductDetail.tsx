import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';
import { FinalCTA } from '../components/FinalCTA';
import { PRODUCTS } from '../data/products';
import { CATALOG, formatCedis } from '../../checkout/catalog';

/**
 * Data-driven template for `/product/<slug>/` pages. The SSG build passes `slug`
 * as a prop (see scripts/build-priority-routes.mjs) and the dev registry calls
 * it the same way. Content lives in data/products.ts; price comes from catalog.ts.
 */
export function ProductDetailPage({ slug }: { slug: string }) {
  const product = PRODUCTS.find((p) => p.catalogId === slug);
  if (!product) throw new Error(`ProductDetailPage: no product content for slug "${slug}"`);

  const item = CATALOG[product.catalogId];
  const isFree = Boolean(product.freeDownloadPath);
  const priceLabel = isFree ? 'Free' : item ? formatCedis(item.amountPesewas) : '';

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="/diy-products/" />

      <main id="main">
        <PageHero
          eyebrow={product.category ? `DIY Product · ${product.category}` : 'DIY Product'}
          title={product.shortName}
          crumbs={[
            { label: 'Home', href: '/' },
            { label: 'DIY Products', href: '/diy-products/' },
            { label: product.shortName },
          ]}
          intro={<p>{product.tagline}</p>}
        />

        <section className="container-site py-16" aria-labelledby="product-overview">
          <div className="grid gap-10 lg:grid-cols-3 lg:items-start">
            <div className="lg:col-span-2">
              <h2 id="product-overview" className="sr-only">About this product</h2>
              {product.sections.map((section, i) => (
                <div key={i} className="mb-8">
                  <h3 className="text-headline-md mb-3">{section.heading}</h3>
                  <p className="text-ink-muted leading-relaxed">{section.body}</p>
                </div>
              ))}

              {product.whatsInside && product.whatsInside.length > 0 && (
                <div className="mt-2">
                  <h3 className="text-headline-md mb-4">What&rsquo;s inside</h3>
                  <ul className="flex flex-col gap-3">
                    {product.whatsInside.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <svg viewBox="0 0 20 20" className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 10l4 4 6-8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span className="text-ink">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Purchase / download card */}
            <aside className="lg:sticky lg:top-24">
              <div className="card">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">
                  {isFree ? 'Free download' : 'Get instant access'}
                </p>
                <p className="text-3xl font-bold text-primary mb-1">{priceLabel}</p>
                <p className="text-ink-muted text-sm mb-5">
                  {isFree
                    ? 'A free resource from the Elevate Career Hub team.'
                    : 'One-time payment. Delivered to your email after checkout.'}
                </p>
                {isFree ? (
                  <a href={product.freeDownloadPath} className="btn-primary w-full text-center" download>
                    Download free
                  </a>
                ) : (
                  <button type="button" className="btn-primary buy-btn w-full" data-service-id={product.catalogId}>
                    Buy now — {priceLabel}
                  </button>
                )}
                <p className="text-center text-xs text-ink-muted mt-4">Secured by Paystack · cards &amp; mobile money</p>
              </div>
            </aside>
          </div>
        </section>

        <FinalCTA
          eyebrow="Want a hand?"
          heading="Prefer us to do it with you?"
          subheading="Browse our career and education services, or message us on WhatsApp and we’ll point you to the right next step."
        />
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
