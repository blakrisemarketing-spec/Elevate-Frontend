import type { ReactNode } from 'react';

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  crumbs: Crumb[];
}

export function PageHero({ eyebrow, title, intro, crumbs }: PageHeroProps) {
  return (
    <section className="bg-gradient-to-br from-primary to-navy text-white" aria-labelledby="page-hero-heading">
      <div className="container-site py-14 lg:py-20">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm">
          <ol className="flex flex-wrap items-center gap-1.5 text-white/70">
            {crumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {crumb.href ? (
                  <a href={crumb.href} className="text-white/80 hover:text-electric no-underline">{crumb.label}</a>
                ) : (
                  <span className="text-white" aria-current="page">{crumb.label}</span>
                )}
                {i < crumbs.length - 1 && <span aria-hidden="true">/</span>}
              </li>
            ))}
          </ol>
        </nav>
        {eyebrow && (
          <p className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-electric bg-white/10 px-3 py-1 rounded-full mb-4">{eyebrow}</p>
        )}
        <h1 id="page-hero-heading" className="text-display-lg text-white mb-4">{title}</h1>
        {intro && <div className="text-lg text-white/90 leading-relaxed max-w-3xl">{intro}</div>}
      </div>
    </section>
  );
}
