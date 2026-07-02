/**
 * Admin ops shell.
 *
 * This static page intentionally contains no sensitive data. The dashboard
 * client fetches everything from authenticated PHP endpoints.
 */
export function AdminPage() {
  return (
    <main id="admin-root" className="min-h-screen bg-canvas">
      <div className="container-site py-10">
        <div className="max-w-3xl">
          <p className="eyebrow text-primary mb-3">Elevate ops</p>
          <h1 className="text-display-lg text-navy mb-4">Admin dashboard</h1>
          <p className="text-ink-muted leading-relaxed">
            Sign in to manage Grad School Match leads, CV uploads, scholarships, and purchase records.
          </p>
        </div>
        <div className="card mt-8">
          <p className="text-ink-muted">Loading admin tools...</p>
        </div>
      </div>
    </main>
  );
}
