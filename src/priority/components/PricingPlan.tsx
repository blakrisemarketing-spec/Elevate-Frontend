interface PricingPlanProps {
  tier: string;
  variant?: string;
  price?: string;
  priceNote?: string;
  features: string[];
  footnote?: string;
  ctaLabel?: string;
  href?: string;
  highlighted?: boolean;
  /** When set, the CTA becomes a Paystack buy button. */
  serviceId?: string;
}

export function PricingPlan({
  tier,
  variant,
  price,
  priceNote,
  features,
  footnote,
  ctaLabel = 'Get Started',
  href = '/contact-us/',
  highlighted = false,
  serviceId,
}: PricingPlanProps) {
  return (
    <article className={`card flex flex-col h-full ${highlighted ? 'ring-2 ring-primary' : ''}`}>
      <div className="mb-1 text-sm font-semibold uppercase tracking-wider text-primary">{tier}</div>
      {variant && <div className="text-xs uppercase tracking-wide text-ink-muted mb-3">{variant}</div>}
      {price && (
        <div className="flex items-baseline gap-2 mb-5">
          <span className="text-display-lg text-navy leading-none">{price}</span>
          {priceNote && <span className="text-sm text-ink-muted">{priceNote}</span>}
        </div>
      )}
      <ul className="flex-1 flex flex-col gap-2 text-sm text-ink leading-relaxed">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            <svg viewBox="0 0 20 20" className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 10l4 4 6-8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {footnote && <p className="mt-4 text-xs text-ink-muted italic">{footnote}</p>}
      {serviceId ? (
        <button type="button" className="btn-primary buy-btn mt-6" data-service-id={serviceId}>{ctaLabel}</button>
      ) : (
        <a
          href={href}
          className="btn-primary mt-6"
          {...(/^https?:/.test(href) ? { target: '_blank', rel: 'noopener' } : {})}
        >
          {ctaLabel}
        </a>
      )}
    </article>
  );
}
