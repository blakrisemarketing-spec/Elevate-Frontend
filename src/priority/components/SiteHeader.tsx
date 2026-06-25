interface NavChild {
  label: string;
  href: string;
}
interface NavItem {
  label: string;
  href?: string;
  children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Services',
    children: [
      { label: 'Educational Services', href: '/educational-services/' },
      { label: 'Career Services', href: '/career-services/' },
    ],
  },
  { label: 'Events', href: '/events/' },
  { label: 'Contact Us', href: '/contact-us/' },
];

interface SiteHeaderProps {
  currentRoute: string;
}

function isActive(item: NavItem, currentRoute: string): boolean {
  if (item.href) return item.href === currentRoute;
  return item.children?.some((c) => c.href === currentRoute) ?? false;
}

const Chevron = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function SiteHeader({ currentRoute }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-navy text-white">
      <div className="container-site flex items-center justify-between gap-4 py-4">
        <a href="/" className="inline-flex items-center no-underline" aria-label="Elevate Career Hub home">
          <img src="/assets/logo-white.webp" alt="Elevate Career Hub" width={420} height={195} className="h-8 w-auto" />
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div key={item.label} className="relative group">
                <button
                  type="button"
                  aria-haspopup="true"
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive(item, currentRoute) ? 'text-white font-semibold' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {item.label}
                  <Chevron className="w-4 h-4 transition-transform group-hover:rotate-180" />
                </button>
                {/* CSS-only dropdown: reveals on hover or keyboard focus, no JS. */}
                <div className="absolute left-0 top-full pt-2 min-w-[15rem] invisible opacity-0 translate-y-1 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0">
                  <div className="bg-white rounded-xl shadow-soft border border-black/5 overflow-hidden py-1">
                    {item.children.map((c) => (
                      <a
                        key={c.href}
                        href={c.href}
                        className={`block px-4 py-2.5 text-sm no-underline ${
                          c.href === currentRoute ? 'text-primary font-semibold bg-surface' : 'text-navy hover:bg-surface'
                        }`}
                        aria-current={c.href === currentRoute ? 'page' : undefined}
                      >
                        {c.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm no-underline transition-colors ${
                  item.href === currentRoute ? 'text-white font-semibold' : 'text-white/80 hover:text-white'
                }`}
                aria-current={item.href === currentRoute ? 'page' : undefined}
              >
                {item.label}
              </a>
            ),
          )}
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
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <li key={item.label}>
                  <details className="group">
                    <summary
                      className={`flex items-center justify-between px-3 py-3 rounded-lg text-base no-underline cursor-pointer list-none [&::-webkit-details-marker]:hidden ${
                        isActive(item, currentRoute) ? 'bg-white/10 text-white font-semibold' : 'text-white/80'
                      }`}
                    >
                      {item.label}
                      <Chevron className="w-5 h-5 transition-transform group-open:rotate-180" />
                    </summary>
                    <ul className="mt-1 ml-3 flex flex-col gap-1 border-l border-white/15 pl-3">
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <a
                            href={c.href}
                            className={`block px-3 py-2.5 rounded-lg text-base no-underline ${
                              c.href === currentRoute ? 'bg-white/10 text-white font-semibold' : 'text-white/80'
                            }`}
                            aria-current={c.href === currentRoute ? 'page' : undefined}
                          >
                            {c.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ) : (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={`block px-3 py-3 rounded-lg text-base no-underline ${
                      item.href === currentRoute ? 'bg-white/10 text-white font-semibold' : 'text-white/80'
                    }`}
                    aria-current={item.href === currentRoute ? 'page' : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              ),
            )}
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
