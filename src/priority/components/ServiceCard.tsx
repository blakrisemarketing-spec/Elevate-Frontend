interface ServiceCardProps {
  title: string;
  description: string;
  href: string;
  cta?: string;
}

export function ServiceCard({ title, description, href, cta = 'Learn more' }: ServiceCardProps) {
  return (
    <article className="card flex flex-col h-full">
      <h3 className="text-headline-md mb-3">{title}</h3>
      <p className="text-ink-muted leading-relaxed flex-1">{description}</p>
      <a href={href} className="inline-flex items-center gap-1 text-primary font-semibold mt-5 no-underline hover:underline" aria-label={`${cta} about ${title}`}>
        {cta}
        <span aria-hidden="true">&rarr;</span>
      </a>
    </article>
  );
}
