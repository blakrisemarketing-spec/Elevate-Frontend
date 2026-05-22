interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about/' },
  { label: 'Career Services', href: '/career-services/' },
  { label: 'Educational Services', href: '/educational-services/' },
  { label: 'DIY Products', href: '/diy-products/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'Contact', href: '/contact-us/' },
];

interface SiteHeaderProps {
  currentRoute: string;
}

export function SiteHeader({ currentRoute }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-black/5">
      <div className="container-site flex items-center justify-between gap-4 py-4">
        <a href="/" className="flex items-center gap-2 no-underline text-navy font-display text-lg font-bold" aria-label="Elevate Career Hub home">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-white" aria-hidden="true">E</span>
          <span className="hidden sm:inline">Elevate Career Hub</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-sm no-underline ${link.href === currentRoute ? 'text-primary font-semibold' : 'text-ink hover:bg-primary-50 hover:text-primary'}`}
              aria-current={link.href === currentRoute ? 'page' : undefined}
            >
              {link.label}
            </a>
          ))}
          <a href="/contact-us/" className="btn-primary ml-2 px-4 py-2 text-sm">Get Started</a>
        </nav>

        {/* CSS-only mobile menu (no client JS) */}
        <input id="primary-nav-toggle" type="checkbox" className="nav-toggle peer sr-only" aria-hidden="true" />
        <label
          htmlFor="primary-nav-toggle"
          className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-primary text-primary cursor-pointer"
          aria-label="Toggle menu"
        >
          <svg className="icon-open w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/></svg>
          <svg className="icon-close w-6 h-6 hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M6 18L18 6" strokeLinecap="round"/></svg>
        </label>
        <label htmlFor="primary-nav-toggle" className="nav-overlay lg:hidden fixed inset-0 bg-navy/60 opacity-0 pointer-events-none transition-opacity z-30" aria-hidden="true"></label>
        <nav
          className="nav-drawer lg:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl translate-x-full transition-transform z-40 pt-20 px-6 pb-8 overflow-y-auto"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`block px-3 py-3 rounded-lg text-base no-underline ${link.href === currentRoute ? 'bg-primary-50 text-primary font-semibold' : 'text-ink'}`}
                  aria-current={link.href === currentRoute ? 'page' : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a href="/contact-us/" className="btn-primary w-full mt-6">Get Started</a>
        </nav>
      </div>
    </header>
  );
}
