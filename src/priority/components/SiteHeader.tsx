interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about/' },
  { label: 'Educational Services', href: '/educational-services/' },
  { label: 'Career Services', href: '/career-services/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'Contact Us', href: '/contact-us/' },
];

interface SiteHeaderProps {
  currentRoute: string;
}

export function SiteHeader({ currentRoute }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-navy text-white">
      <div className="container-site flex items-center justify-between gap-4 py-4">
        <a href="/" className="inline-flex items-center no-underline" aria-label="Elevate Career Hub home">
          <img src="/assets/logo-white.webp" alt="Elevate Career Hub" width={420} height={195} className="h-8 w-auto" />
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-sm no-underline transition-colors ${
                link.href === currentRoute
                  ? 'text-white font-semibold'
                  : 'text-white/80 hover:text-white'
              }`}
              aria-current={link.href === currentRoute ? 'page' : undefined}
            >
              {link.label}
            </a>
          ))}
          <a href="/diy-products/" className="btn-outline ml-3 px-5 py-2 text-sm border border-white/60">DIY Product</a>
        </nav>

        {/* CSS-only mobile menu */}
        <input id="primary-nav-toggle" type="checkbox" className="nav-toggle peer sr-only" aria-hidden="true" />
        <label
          htmlFor="primary-nav-toggle"
          className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-white/40 text-white cursor-pointer"
          aria-label="Toggle menu"
        >
          <svg className="icon-open w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/></svg>
          <svg className="icon-close w-6 h-6 hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M6 18L18 6" strokeLinecap="round"/></svg>
        </label>
        <label htmlFor="primary-nav-toggle" className="nav-overlay lg:hidden fixed inset-0 bg-black/60 opacity-0 pointer-events-none transition-opacity z-30" aria-hidden="true"></label>
        <nav
          className="nav-drawer lg:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-navy shadow-2xl translate-x-full transition-transform z-40 pt-20 px-6 pb-8 overflow-y-auto"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`block px-3 py-3 rounded-lg text-base no-underline ${
                    link.href === currentRoute
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-white/80'
                  }`}
                  aria-current={link.href === currentRoute ? 'page' : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a href="/diy-products/" className="block px-3 py-3 rounded-lg text-base no-underline text-white/80">
                DIY Product
              </a>
            </li>
          </ul>
          <a href="/contact-us/" className="btn-electric w-full mt-6">Get Started</a>
        </nav>
      </div>
    </header>
  );
}
