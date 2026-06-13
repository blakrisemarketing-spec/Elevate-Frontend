import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';
import { FinalCTA } from '../components/FinalCTA';
import { SERVICES } from '../data/services';
import { CATALOG, formatCedis } from '../../checkout/catalog';

const PARENT = {
  career: { label: 'Career Services', href: '/career-services/' },
  education: { label: 'Educational Services', href: '/educational-services/' },
} as const;

/**
 * Data-driven template for individual service pages (e.g. `/curriculum-vitae/`).
 * The SSG build passes `slug` as a prop; the dev registry calls it the same way.
 * Content lives in data/services.ts; price tiers come from catalog.ts.
 */
export function ServiceDetailPage({ slug }: { slug: string }) {
  const svc = SERVICES.find((s) => s.slug === slug);
  if (!svc) throw new Error(`ServiceDetailPage: no service content for slug "${slug}"`);

  const parent = PARENT[svc.parentService];
  const tiers = (svc.priceTierIds ?? [])
    .map((id) => CATALOG[id])
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute={parent.href} />

      <main id="main">
        <PageHero
          eyebrow={svc.eyebrow}
          title={svc.heading}
          crumbs={[
            { label: 'Home', href: '/' },
            { label: parent.label, href: parent.href },
            { label: svc.shortName },
          ]}
          intro={<p>{svc.intro}</p>}
        />

        <section className="container-site py-16" aria-labelledby="service-overview">
          <div className="max-w-3xl">
            <h2 id="service-overview" className="sr-only">About this service</h2>
            {svc.sections.map((section, i) => (
              <div key={i} className="mb-8">
                <h3 className="text-headline-md mb-3">{section.heading}</h3>
                <p className="text-ink-muted leading-relaxed">{section.body}</p>
              </div>
            ))}
          </div>

          {svc.features && svc.features.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 mt-4">
              {svc.features.map((feature, i) => (
                <div key={i} className="card">
                  <h4 className="text-lg font-bold mb-2 text-navy">{feature.title}</h4>
                  <p className="text-ink-muted leading-relaxed text-sm">{feature.body}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {tiers.length > 0 && (
          <section className="bg-surface" aria-labelledby="service-pricing">
            <div className="container-site py-16">
              <h2 id="service-pricing" className="text-headline-lg text-center mb-3">Choose your option</h2>
              <p className="text-ink-muted text-center max-w-2xl mx-auto mb-10">
                Select the level that fits your stage. Not sure which to pick? Message us on WhatsApp and we&rsquo;ll help.
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                {tiers.map((item) => (
                  <article key={item.id} className="card flex flex-col h-full text-center">
                    <h3 className="text-lg font-bold text-navy mb-2">{item.name}</h3>
                    <p className="text-3xl font-bold text-primary mb-5 mt-1">{formatCedis(item.amountPesewas)}</p>
                    <button type="button" className="btn-primary buy-btn mt-auto" data-service-id={item.id}>
                      Buy now
                    </button>
                  </article>
                ))}
              </div>
              <p className="text-center text-xs text-ink-muted mt-6">Secured by Paystack · cards &amp; mobile money</p>
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
