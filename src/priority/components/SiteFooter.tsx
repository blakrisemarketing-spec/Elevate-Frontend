export function SiteFooter() {
  return (
    <footer className="bg-navy text-white mt-20">
      <div className="container-site py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <a href="/" className="flex items-center gap-2 no-underline text-white font-display text-lg font-bold mb-4">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-electric text-navy" aria-hidden="true">E</span>
              <span>Elevate Career Hub</span>
            </a>
            <p className="text-white/80 text-sm leading-relaxed">
              Stay connected to us. Follow us on our socials and reach out!
            </p>
            <ul className="flex items-center gap-3 mt-5" aria-label="Social links">
              <li><a href="https://instagram.com" className="text-white/80 hover:text-electric no-underline" aria-label="Instagram" rel="noopener" target="_blank">Instagram</a></li>
              <li><a href="https://twitter.com" className="text-white/80 hover:text-electric no-underline" aria-label="Twitter" rel="noopener" target="_blank">Twitter</a></li>
              <li><a href="https://linkedin.com" className="text-white/80 hover:text-electric no-underline" aria-label="LinkedIn" rel="noopener" target="_blank">LinkedIn</a></li>
              <li><a href="https://youtube.com" className="text-white/80 hover:text-electric no-underline" aria-label="YouTube" rel="noopener" target="_blank">YouTube</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white mb-4">Quick links</h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li><a href="/" className="text-white/80 hover:text-electric no-underline">Home</a></li>
              <li><a href="/about/" className="text-white/80 hover:text-electric no-underline">About</a></li>
              <li><a href="/educational-services/" className="text-white/80 hover:text-electric no-underline">Educational Services</a></li>
              <li><a href="/blog/" className="text-white/80 hover:text-electric no-underline">Blog</a></li>
              <li><a href="/diy-products/" className="text-white/80 hover:text-electric no-underline">DIY Products</a></li>
              <li><a href="/contact-us/" className="text-white/80 hover:text-electric no-underline">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white mb-4">Support</h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li><a href="/contact-us/" className="text-white/80 hover:text-electric no-underline">Help Center</a></li>
              <li><a href="/contact-us/" className="text-white/80 hover:text-electric no-underline">Privacy Policy</a></li>
              <li><a href="/faqs/" className="text-white/80 hover:text-electric no-underline">FAQs</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white mb-4">Let&rsquo;s talk!</h3>
            <p className="text-white/80 text-sm mb-4">Reach out and elevate your career journey today.</p>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <a href="https://wa.me/233531113454" className="inline-flex items-center gap-2 text-white no-underline hover:text-electric" rel="noopener" target="_blank">
                  <span aria-hidden="true">WhatsApp</span>
                  <span className="text-white/80">+233 531 113 454</span>
                </a>
              </li>
              <li>
                <a href="mailto:elevatewithnll@gmail.com" className="inline-flex items-center gap-2 text-white no-underline hover:text-electric break-all">
                  <span aria-hidden="true">Email</span>
                  <span className="text-white/80">elevatewithnll@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-white/60">
          <p>Copyright &copy; {new Date().getFullYear()} Elevate Career Hub</p>
          <ul className="flex items-center gap-4">
            <li><a href="/contact-us/" className="text-white/60 hover:text-white no-underline">Privacy Policy</a></li>
            <li><a href="/contact-us/" className="text-white/60 hover:text-white no-underline">Terms &amp; Services</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
