interface TestimonialCardProps {
  quote: string;
  author: string;
  role?: string;
  image?: string;
}

export function TestimonialCard({ quote, author, role, image }: TestimonialCardProps) {
  return (
    <figure className="card h-full flex flex-col">
      <div className="flex items-center gap-1 text-electric mb-3" aria-label="Rated 5 out of 5">
        {[0, 1, 2, 3, 4].map(i => (
          <svg key={i} viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor" aria-hidden="true"><path d="M10 1.5l2.6 5.6 6.2.6-4.7 4.1 1.4 6L10 14.7l-5.5 3.1 1.4-6L1.2 7.7l6.2-.6L10 1.5z"/></svg>
        ))}
      </div>
      <blockquote className="text-ink leading-relaxed flex-1">&ldquo;{quote}&rdquo;</blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        {image && (
          <img src={image} alt={author} width={48} height={48} loading="lazy" className="w-12 h-12 rounded-full object-cover shrink-0" />
        )}
        <span>
          <span className="block text-sm font-semibold text-navy">{author}</span>
          {role && <span className="block text-xs text-ink-muted">{role}</span>}
        </span>
      </figcaption>
    </figure>
  );
}
