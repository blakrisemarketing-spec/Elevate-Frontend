interface PriceCardProps {
  title: string;
  description: string;
  price: string;
  priceNote?: string;
  href?: string;
  ctaLabel?: string;
  /** When set, the CTA becomes a Paystack buy button (progressive-enhancement island). */
  serviceId?: string;
}

export function PriceCard({ title, description, price, priceNote, href = '/contact-us/', ctaLabel, serviceId }: PriceCardProps) {
  return (
    <article className="card flex flex-col h-full">
      <h3 className="text-headline-md mb-3">{title}</h3>
      <p className="text-ink-muted leading-relaxed flex-1">{description}</p>
      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-display-lg text-primary leading-none">{price}</span>
        {priceNote && <span className="text-sm text-ink-muted">{priceNote}</span>}
      </div>
      {serviceId ? (
        <button type="button" className="btn-primary buy-btn mt-5" data-service-id={serviceId}>
          {ctaLabel || `Pay ${price}`}
        </button>
      ) : (
        <a href={href} className="btn-primary mt-5">{ctaLabel || 'Get Started'}</a>
      )}
    </article>
  );
}
