interface PriceCardProps {
  title: string;
  description: string;
  price: string;
  priceNote?: string;
  href?: string;
  ctaLabel?: string;
}

export function PriceCard({ title, description, price, priceNote, href = '/contact-us/', ctaLabel = 'Get Started' }: PriceCardProps) {
  return (
    <article className="card flex flex-col h-full">
      <h3 className="text-headline-md mb-3">{title}</h3>
      <p className="text-ink-muted leading-relaxed flex-1">{description}</p>
      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-display-lg text-primary leading-none">{price}</span>
        {priceNote && <span className="text-sm text-ink-muted">{priceNote}</span>}
      </div>
      <a href={href} className="btn-primary mt-5">{ctaLabel}</a>
    </article>
  );
}
