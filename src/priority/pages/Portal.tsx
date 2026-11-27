/**
 * Client portal shell.
 *
 * Static and data-free: the portal island (src/portal/portal-client.tsx)
 * mounts here and fetches everything from session-checked PHP endpoints that
 * only ever return the signed-in client's own records.
 */
export function PortalPage() {
  return (
    <main id="portal-root" className="min-h-screen bg-canvas">
      <div className="container-site py-10">
        <div className="max-w-xl mx-auto">
          <p className="eyebrow text-primary mb-3">Elevate Career Hub</p>
          <h1 className="text-display-lg text-navy mb-4">Client portal</h1>
          <p className="text-ink-muted leading-relaxed">Loading your portal...</p>
          <noscript>
            <p className="text-ink-muted leading-relaxed mt-4">The client portal needs JavaScript. Please enable it, or message us on WhatsApp at +233 53 111 3454.</p>
          </noscript>
        </div>
      </div>
    </main>
  );
}
