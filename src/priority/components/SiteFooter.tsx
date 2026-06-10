export function SiteFooter() {
  return (
    <footer className="bg-navy text-white">
      <div className="container-site py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <a href="/" className="inline-flex items-center no-underline" aria-label="Elevate Career Hub home">
              <img src="/assets/logo-white.webp" alt="Elevate Career Hub" width={420} height={195} className="h-10 w-auto" />
            </a>
            <p className="text-white/70 text-sm leading-relaxed mt-4">
              Stay connected to us. Follow us on our socials and reach out!
            </p>
            <ul className="flex items-center gap-3 mt-5" aria-label="Social links">
              <li>
                <a href="https://www.instagram.com/elevatecareerhub/" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-electric hover:text-navy no-underline transition-colors" aria-label="Instagram" rel="noopener" target="_blank">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.5.2.9.5 1.3.9.4.4.7.8.9 1.3.2.4.4 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.5-.5.9-.9 1.3-.4.4-.8.7-1.3.9-.4.2-1 .4-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.5-.2-.9-.5-1.3-.9-.4-.4-.7-.8-.9-1.3-.2-.4-.4-1-.4-2.2-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.5.5-.9.9-1.3.4-.4.8-.7 1.3-.9.4-.2 1-.4 2.2-.4 1.2-.1 1.6-.1 4.8-.1zM12 0C8.7 0 8.3 0 7.1.1 5.8.1 5 .3 4.2.6c-.8.3-1.5.7-2.2 1.4C1.3 2.7.9 3.4.6 4.2.3 5 .1 5.8.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.1 1.3.3 2.1.6 2.9.3.8.7 1.5 1.4 2.2.7.7 1.4 1.1 2.2 1.4.8.3 1.6.5 2.9.6C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c1.3-.1 2.1-.3 2.9-.6.8-.3 1.5-.7 2.2-1.4.7-.7 1.1-1.4 1.4-2.2.3-.8.5-1.6.6-2.9.1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.1-1.3-.3-2.1-.6-2.9-.3-.8-.7-1.5-1.4-2.2C21.3 1.3 20.6.9 19.8.6 19 .3 18.2.1 16.9.1 15.7 0 15.3 0 12 0zm0 5.8c-3.4 0-6.2 2.8-6.2 6.2s2.8 6.2 6.2 6.2 6.2-2.8 6.2-6.2S15.4 5.8 12 5.8zm0 10.3c-2.3 0-4.1-1.8-4.1-4.1 0-2.3 1.8-4.1 4.1-4.1 2.3 0 4.1 1.8 4.1 4.1 0 2.3-1.8 4.1-4.1 4.1zm6.4-11.9c-.8 0-1.4.6-1.4 1.4 0 .8.6 1.4 1.4 1.4.8 0 1.4-.6 1.4-1.4 0-.8-.6-1.4-1.4-1.4z"/></svg>
                </a>
              </li>
              <li>
                <a href="https://www.tiktok.com/@elevatecareerhub" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-electric hover:text-navy no-underline transition-colors" aria-label="TikTok" rel="noopener" target="_blank">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true"><path d="M16.6 5.82a4.28 4.28 0 0 1-1.05-2.82h-3.3v12.49a2.59 2.59 0 0 1-2.59 2.52A2.59 2.59 0 0 1 7.07 15.4a2.59 2.59 0 0 1 3.39-2.46V9.57a5.9 5.9 0 0 0-.8-.05A5.92 5.92 0 0 0 3.74 15.4a5.92 5.92 0 0 0 9.85 4.42 5.92 5.92 0 0 0 2-4.42V9.01a7.55 7.55 0 0 0 4.41 1.41V7.13a4.28 4.28 0 0 1-3.4-1.31z"/></svg>
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/company/elevatewithnll/" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-electric hover:text-navy no-underline transition-colors" aria-label="LinkedIn" rel="noopener" target="_blank">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow text-electric mb-5">Quicklinks</h3>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><a href="/" className="text-white/80 hover:text-electric no-underline">Home</a></li>
              <li><a href="/about/" className="text-white/80 hover:text-electric no-underline">About</a></li>
              <li><a href="/educational-services/" className="text-white/80 hover:text-electric no-underline">Educational Services</a></li>
              <li><a href="/blog/" className="text-white/80 hover:text-electric no-underline">Blog</a></li>
              <li><a href="/diy-products/" className="text-white/80 hover:text-electric no-underline">DIY Products</a></li>
              <li><a href="/contact-us/" className="text-white/80 hover:text-electric no-underline">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow text-electric mb-5">Support</h3>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><a href="/faqs/" className="text-white/80 hover:text-electric no-underline">FAQs</a></li>
              <li><a href="/privacy-policy/" className="text-white/80 hover:text-electric no-underline">Privacy Policy</a></li>
              <li><a href="/terms/" className="text-white/80 hover:text-electric no-underline">Terms &amp; Services</a></li>
              <li><a href="/refund-policy/" className="text-white/80 hover:text-electric no-underline">Refund Policy</a></li>
              <li><a href="/contact-us/" className="text-white/80 hover:text-electric no-underline">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow text-electric mb-5">Let&rsquo;s talk!</h3>
            <p className="text-white/70 text-sm mb-4">Tell us the goal and we&rsquo;ll map the path. Book a free chat &mdash; no insider network required.</p>
            <a href="https://wa.me/233531113454" className="btn-electric text-sm" target="_blank" rel="noopener">
              Let&rsquo;s talk
            </a>
            <ul className="flex flex-col gap-2 text-sm mt-5">
              <li className="text-white/70">
                <span className="text-white/50 text-xs uppercase tracking-wide block">WhatsApp</span>
                <a href="https://wa.me/233531113454" className="text-white hover:text-electric no-underline" rel="noopener" target="_blank">+233 53 111 3454</a>
              </li>
              <li className="text-white/70">
                <span className="text-white/50 text-xs uppercase tracking-wide block">Email</span>
                <a href="mailto:hello@elevatecareerhub.com" className="text-white hover:text-electric no-underline break-all">hello@elevatecareerhub.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-white/50">
          <p>Copyright &copy; {new Date().getFullYear()} Elevate Career Hub</p>
          <ul className="flex items-center gap-4">
            <li><a href="/privacy-policy/" className="text-white/60 hover:text-white no-underline">Privacy Policy</a></li>
            <li><a href="/terms/" className="text-white/60 hover:text-white no-underline">Terms &amp; Services</a></li>
            <li><a href="/refund-policy/" className="text-white/60 hover:text-white no-underline">Refund Policy</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
