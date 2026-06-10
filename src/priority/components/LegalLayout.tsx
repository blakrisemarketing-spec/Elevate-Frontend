import type { ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { WhatsAppFAB } from './WhatsAppFAB';
import { PageHero } from './PageHero';

interface LegalLayoutProps {
  /** Current route, for header nav state (legal pages have no active nav item). */
  currentRoute: string;
  eyebrow: string;
  title: string;
  crumbLabel: string;
  lastUpdated: string;
  intro: ReactNode;
  children: ReactNode;
}

/**
 * Shared shell for the policy pages (Privacy, Terms, Refund). Keeps the zero-JS
 * priority-page rule: pure static markup, no hooks, no client island.
 */
export function LegalLayout({ currentRoute, eyebrow, title, crumbLabel, lastUpdated, intro, children }: LegalLayoutProps) {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute={currentRoute} />

      <main id="main">
        <PageHero
          eyebrow={eyebrow}
          title={title}
          crumbs={[{ label: 'Home', href: '/' }, { label: crumbLabel }]}
          intro={intro}
        />

        <section className="container-site py-16">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-ink-muted mb-10">Last updated: {lastUpdated}</p>
            {children}
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}

/* Lightweight prose primitives so the policy pages stay readable and on-token. */
export function LH2({ id, children }: { id?: string; children: ReactNode }) {
  return <h2 id={id} className="text-headline-md mt-10 mb-3">{children}</h2>;
}

export function LP({ children }: { children: ReactNode }) {
  return <p className="text-ink-muted leading-relaxed mb-4">{children}</p>;
}

export function LUL({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-6 text-ink-muted leading-relaxed mb-4 space-y-1.5">{children}</ul>;
}

export function LA({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} className="text-primary underline hover:text-navy">{children}</a>;
}
