/**
 * Client portal island (mounted on /portal/).
 *
 * Sign in with Google or email + password; set/reset password through a
 * one-time emailed link (#token=... in the URL fragment, so it never reaches a
 * server log or third party). Once signed in, the client sees their services
 * and progress, shared files, school / job applications, team updates, and can
 * message the team. Every byte comes from session-scoped PHP endpoints.
 */
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

type Work = {
  id: number; title: string; family: string; status: string; statusLabel: string; dueOn: string | null; message: string;
  consultant: string; steps: { label: string; done: boolean }[]; stepsDone: number; stepsTotal: number; createdAt: string; deliveredAt: string | null;
};
type FileItem = { id: number; engagementId: number; title: string; fileName: string; version: number; sizeBytes: number; createdAt: string };
type App = { id: number; kind: 'school' | 'job'; organization: string; title: string; location: string; url: string; deadline: string | null; status: string; clientNotes: string; statusUpdatedAt: string };
type Activity = { id: number; createdAt: string; kind: string; summary: string; fromClient: boolean };
type Me = {
  ok: boolean;
  client: { name: string; email: string; hasPassword: boolean; hasGoogle: boolean };
  work: Work[]; files: FileItem[]; applications: App[]; activity: Activity[];
  orders: { itemName: string; amountPesewas: number; occurredAt: string }[];
};

class HttpError extends Error {
  status: number;
  constructor(m: string, s: number) { super(m); this.status = s; }
}

async function call<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new HttpError(data.message || 'Something went wrong. Please try again.', res.status);
  return data as T;
}

const ERRORS: Record<string, string> = {
  no_account: 'We could not find an Elevate purchase under that Google email. Sign in with the email you paid with, or message us on WhatsApp.',
  google_unavailable: 'Google sign-in is not available right now. Use your email and password instead.',
  google_cancelled: 'Google sign-in was cancelled.',
  google_state: 'That sign-in attempt expired. Please try again.',
  google_failed: 'Google sign-in did not complete. Please try again.',
  google_mismatch: 'This email is linked to a different Google account.',
  disabled: 'Portal access is turned off for this account. Please contact us.',
  unavailable: 'The portal is unavailable right now. Please try again shortly.',
};

const fmtDate = (v?: string | null) => (v ? new Date(v.length === 10 ? `${v}T12:00:00Z` : v).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '');
const cedis = (p: number) => `GH₵${(p / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const human = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

const STATUS_TONE: Record<string, string> = {
  intake: 'bg-surface-tint text-primary-700',
  in_progress: 'bg-surface-tint text-primary-700',
  client_review: 'bg-amber-100 text-amber-900',
  revisions: 'bg-purple-100 text-purple-900',
  delivered: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-emerald-100 text-emerald-800',
  on_hold: 'bg-surface-muted text-ink-muted',
};
const APP_TONE: Record<string, string> = {
  offer: 'bg-emerald-100 text-emerald-800', accepted: 'bg-emerald-100 text-emerald-800',
  interview: 'bg-amber-100 text-amber-900', submitted: 'bg-surface-tint text-primary-700', applied: 'bg-surface-tint text-primary-700',
  rejected: 'bg-surface-muted text-ink-muted', withdrawn: 'bg-surface-muted text-ink-muted', waitlisted: 'bg-purple-100 text-purple-900',
};

function Pill({ tone, children }: { tone?: string; children: ReactNode }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${tone || 'bg-surface-muted text-ink-muted'}`}>{children}</span>;
}

function Banner({ kind, children }: { kind: 'error' | 'ok'; children: ReactNode }) {
  return <div role={kind === 'error' ? 'alert' : 'status'} className={`mb-4 rounded-lg border px-4 py-3 text-sm ${kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{children}</div>;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-navy text-white">
        <div className="container-site flex items-center justify-between py-4">
          <a href="/" className="wordmark text-xl text-white no-underline hover:no-underline">elevate</a>
          <span className="eyebrow text-white/70">Client portal</span>
        </div>
      </header>
      <main className="container-site py-8">{children}</main>
    </div>
  );
}

// ── Auth screens ────────────────────────────────────────────────────────

function readToken(): string {
  const m = window.location.hash.match(/token=([A-Za-z0-9_-]+)/);
  return m ? m[1] : '';
}

function AuthScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [token] = useState(readToken);
  const [mode, setMode] = useState<'login' | 'request' | 'set'>(token ? 'set' : 'login');
  const [urlError] = useState(() => new URLSearchParams(window.location.search).get('error') || '');

  useEffect(() => {
    // Strip the token / error from the address bar once read.
    if (window.location.hash || window.location.search) history.replaceState(null, '', '/portal/');
  }, []);

  return (
    <Shell>
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl text-navy">Welcome to your portal</h1>
        <p className="mb-6 mt-2 text-ink-muted">Track your services, download your documents and follow your applications.</p>
        {urlError && <Banner kind="error">{ERRORS[urlError] || 'Sign-in failed. Please try again.'}</Banner>}
        <div className="card">
          {mode === 'set' && <SetPassword token={token} onDone={onSignedIn} onRequest={() => setMode('request')} />}
          {mode === 'login' && <Login onDone={onSignedIn} onForgot={() => setMode('request')} />}
          {mode === 'request' && <RequestLink onBack={() => setMode('login')} />}
        </div>
        <p className="mt-6 text-center text-sm text-ink-muted">Need help? <a href="https://wa.me/233531113454">WhatsApp +233 53 111 3454</a></p>
      </div>
    </Shell>
  );
}

function GoogleButton() {
  return (
    <a href="/api/portal-google.php?start=1" className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white px-5 font-semibold text-ink no-underline hover:bg-canvas hover:no-underline">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
      Continue with Google
    </a>
  );
}

function Login({ onDone, onForgot }: { onDone: () => void; onForgot: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await call('/api/portal-login.php', { email, password });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <GoogleButton />
      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-ink-muted"><span className="h-px flex-1 bg-ink/10" />or<span className="h-px flex-1 bg-ink/10" /></div>
      {error && <Banner kind="error">{error}</Banner>}
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold text-ink">Email<input className="input mt-1" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block text-sm font-semibold text-ink">Password<input className="input mt-1" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <button type="button" className="mt-4 w-full text-center text-sm font-semibold text-primary hover:underline" onClick={onForgot}>First time here, or forgot your password?</button>
    </>
  );
}

function RequestLink({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await call<{ ok: boolean; message: string }>('/api/portal-password.php', { action: 'request', email });
      setMsg(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the link');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h2 className="mb-1 text-lg font-bold text-navy">Set or reset your password</h2>
      <p className="mb-4 text-sm text-ink-muted">Enter the email you used to pay. We will send you a one-time link.</p>
      {msg && <Banner kind="ok">{msg}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold text-ink">Email<input className="input mt-1" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Sending...' : 'Email me a link'}</button>
      </form>
      <button type="button" className="mt-4 w-full text-center text-sm font-semibold text-primary hover:underline" onClick={onBack}>Back to sign in</button>
    </>
  );
}

function SetPassword({ token, onDone, onRequest }: { token: string; onDone: () => void; onRequest: () => void }) {
  const [info, setInfo] = useState<{ email: string; name: string } | null>(null);
  const [invalid, setInvalid] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    call<{ ok: boolean; email: string; name: string }>('/api/portal-password.php', { action: 'check', token })
      .then(setInfo)
      .catch((e) => setInvalid(e instanceof Error ? e.message : 'This link is not valid.'));
  }, [token]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    setError('');
    try {
      await call('/api/portal-password.php', { action: 'set', token, password });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your password');
    } finally {
      setBusy(false);
    }
  }

  if (invalid) {
    return (
      <>
        <Banner kind="error">{invalid}</Banner>
        <button type="button" className="btn-primary w-full" onClick={onRequest}>Request a new link</button>
        <div className="mt-4"><GoogleButton /></div>
      </>
    );
  }
  if (!info) return <p className="text-ink-muted">Checking your link...</p>;
  return (
    <>
      <h2 className="mb-1 text-lg font-bold text-navy">Hi {info.name ? info.name.split(' ')[0] : 'there'}, choose a password</h2>
      <p className="mb-4 text-sm text-ink-muted">For {info.email}. You can also skip this and sign in with Google using the same email.</p>
      {error && <Banner kind="error">{error}</Banner>}
      <form onSubmit={submit} className="space-y-4">
        <input type="email" autoComplete="username" value={info.email} readOnly hidden />
        <label className="block text-sm font-semibold text-ink">New password<input className="input mt-1" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <label className="block text-sm font-semibold text-ink">Confirm password<input className="input mt-1" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
        <p className="text-xs text-ink-muted">At least 8 characters.</p>
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Saving...' : 'Save and open my portal'}</button>
      </form>
      <div className="mt-4"><GoogleButton /></div>
    </>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────

function Dashboard({ me, onSignOut, onReload }: { me: Me; onSignOut: () => void; onReload: () => void }) {
  const first = me.client.name ? me.client.name.split(' ')[0] : '';
  const active = me.work.filter((w) => !['delivered', 'closed'].includes(w.status));
  const done = me.work.filter((w) => ['delivered', 'closed'].includes(w.status));
  const review = me.work.filter((w) => w.status === 'client_review');
  const schools = me.applications.filter((a) => a.kind === 'school');
  const jobs = me.applications.filter((a) => a.kind === 'job');

  return (
    <Shell>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-primary">Your portal</p>
          <h1 className="font-display text-3xl text-navy sm:text-4xl">Hi{first ? ` ${first}` : ''}, here is where things stand</h1>
          <p className="mt-2 text-ink-muted">{active.length} in progress · {done.length} completed · {me.files.length} file{me.files.length === 1 ? '' : 's'}{me.applications.length ? ` · ${me.applications.length} application${me.applications.length === 1 ? '' : 's'} tracked` : ''}</p>
        </div>
        <button type="button" className="self-start text-sm font-semibold text-primary hover:underline sm:self-auto" onClick={onSignOut}>Sign out</button>
      </div>

      {review.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <p className="font-bold">Waiting on you</p>
          <p className="text-sm">{review.map((w) => w.title).join(', ')} {review.length === 1 ? 'is' : 'are'} ready for your review. Download the file below and send us any changes.</p>
        </div>
      )}

      {me.work.length === 0 && (
        <div className="card mb-6"><p className="text-ink-muted">Your services will appear here as soon as our team sets them up. If you paid recently, check back shortly or message us below.</p></div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {active.length > 0 && <h2 className="text-xl font-bold text-navy">In progress</h2>}
          {active.map((w) => <WorkCard key={w.id} work={w} files={me.files.filter((f) => f.engagementId === w.id)} />)}

          {me.applications.length > 0 && (
            <section className="card">
              <h2 className="mb-4 text-xl font-bold text-navy">Your applications</h2>
              {schools.length > 0 && <AppTable title="Schools" apps={schools} orgLabel="School" titleLabel="Programme" />}
              {jobs.length > 0 && <AppTable title="Jobs" apps={jobs} orgLabel="Company" titleLabel="Role" />}
            </section>
          )}

          {done.length > 0 && <h2 className="text-xl font-bold text-navy">Completed</h2>}
          {done.map((w) => <WorkCard key={w.id} work={w} files={me.files.filter((f) => f.engagementId === w.id)} compact />)}
        </div>

        <aside className="space-y-6">
          <MessageBox work={me.work} onSent={onReload} />
          <section className="card">
            <h2 className="mb-3 text-lg font-bold text-navy">Updates</h2>
            {me.activity.length === 0 ? <p className="text-sm text-ink-muted">No updates yet.</p> : (
              <ol className="space-y-3">
                {me.activity.slice(0, 20).map((a) => (
                  <li key={a.id} className={`border-l-2 pl-3 text-sm ${a.fromClient ? 'border-electric' : 'border-primary'}`}>
                    <p className="text-ink">{a.fromClient ? <strong>You: </strong> : null}{a.summary}</p>
                    <p className="text-xs text-ink-muted">{fmtDate(a.createdAt)}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
          {me.orders.length > 0 && (
            <section className="card">
              <h2 className="mb-3 text-lg font-bold text-navy">Your purchases</h2>
              <ul className="space-y-2 text-sm">
                {me.orders.map((o, i) => (
                  <li key={i} className="flex justify-between gap-3"><span>{o.itemName}<span className="block text-xs text-ink-muted">{fmtDate(o.occurredAt)}</span></span><strong className="whitespace-nowrap">{cedis(o.amountPesewas)}</strong></li>
                ))}
              </ul>
            </section>
          )}
          <section className="card text-sm text-ink-muted">
            <p>Signed in as <strong className="text-ink">{me.client.email}</strong></p>
            <p className="mt-1">{me.client.hasGoogle ? 'Google sign-in linked.' : 'You can also sign in with Google using this email.'}</p>
          </section>
        </aside>
      </div>
    </Shell>
  );
}

function WorkCard({ work, files, compact }: { work: Work; files: FileItem[]; compact?: boolean }) {
  const pct = work.stepsTotal ? Math.round((work.stepsDone / work.stepsTotal) * 100) : 0;
  return (
    <section className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-navy">{work.title}</h3>
          <p className="text-sm text-ink-muted">
            {work.consultant ? `With ${work.consultant} · ` : ''}
            {work.deliveredAt ? `Delivered ${fmtDate(work.deliveredAt)}` : work.dueOn ? `Target date ${fmtDate(work.dueOn)}` : `Started ${fmtDate(work.createdAt)}`}
          </p>
        </div>
        <Pill tone={STATUS_TONE[work.status]}>{work.statusLabel}</Pill>
      </div>
      {!compact && (
        <>
          <div className="mt-4 h-2 rounded-full bg-surface-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${work.title} progress`}>
            <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <ol className="mt-4 space-y-2">
            {work.steps.map((s, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span aria-hidden="true" className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${s.done ? 'bg-primary text-white' : 'border-2 border-ink/20 text-transparent'}`}>✓</span>
                <span className={s.done ? 'text-ink' : 'text-ink-muted'}>{s.label}<span className="sr-only">{s.done ? ' (done)' : ' (to do)'}</span></span>
              </li>
            ))}
          </ol>
        </>
      )}
      {work.message && <p className="mt-4 rounded-lg bg-surface-tint p-3 text-sm text-ink"><strong>From the team:</strong> {work.message}</p>}
      {files.length > 0 && (
        <ul className="mt-4 divide-y divide-ink/10 rounded-lg border border-ink/10">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="min-w-0"><strong className="block truncate text-ink">{f.title}</strong><span className="text-xs text-ink-muted">{f.fileName} · version {f.version} · {fmtDate(f.createdAt)}</span></span>
              <a href={`/api/portal-file.php?id=${f.id}`} className="btn-secondary min-h-[40px] shrink-0 px-4 py-2 text-sm">Download</a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AppTable({ title, apps, orgLabel, titleLabel }: { title: string; apps: App[]; orgLabel: string; titleLabel: string }) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-muted">{title}</h3>
      <ul className="divide-y divide-ink/10">
        {apps.map((a) => (
          <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="font-semibold text-ink"><span className="sr-only">{orgLabel}: </span>{a.organization}{a.title && <span className="font-normal text-ink-muted"><span className="sr-only">, {titleLabel}:</span> · {a.title}</span>}</p>
              <p className="text-xs text-ink-muted">{[a.location, a.deadline ? `Deadline ${fmtDate(a.deadline)}` : '', `Updated ${fmtDate(a.statusUpdatedAt)}`].filter(Boolean).join(' · ')}</p>
              {a.clientNotes && <p className="mt-1 text-sm text-ink">{a.clientNotes}</p>}
              {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold">View listing</a>}
            </div>
            <Pill tone={APP_TONE[a.status]}>{human(a.status)}</Pill>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MessageBox({ work, onSent }: { work: Work[]; onSent: () => void }) {
  const [text, setText] = useState('');
  const [engagementId, setEngagementId] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMsg('');
    try {
      await call('/api/portal-message.php', { body: text, engagementId: engagementId ? Number(engagementId) : null });
      setText('');
      setMsg('Sent. The team will reply here or by email.');
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card">
      <h2 className="mb-1 text-lg font-bold text-navy">Message the team</h2>
      <p className="mb-3 text-sm text-ink-muted">Questions, feedback on a draft, or a revision request.</p>
      {msg && <Banner kind="ok">{msg}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}
      <form onSubmit={submit} className="space-y-3">
        {work.length > 0 && (
          <select aria-label="About which service" className="input" value={engagementId} onChange={(e) => setEngagementId(e.target.value)}>
            <option value="">General question</option>
            {work.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
          </select>
        )}
        <textarea aria-label="Message" className="input h-28" required maxLength={3000} value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Sending...' : 'Send message'}</button>
      </form>
    </section>
  );
}

// ── App ─────────────────────────────────────────────────────────────────

function PortalApp() {
  const [state, setState] = useState<'loading' | 'auth' | 'ready' | 'error'>('loading');
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState('');

  function load() {
    // A setup link always shows the set-password screen, even if signed in.
    if (readToken()) {
      setState('auth');
      return;
    }
    call<Me>('/api/portal-me.php')
      .then((res) => { setMe(res); setState('ready'); })
      .catch((e) => {
        if (e instanceof HttpError && e.status === 401) setState('auth');
        else { setError(e instanceof Error ? e.message : 'The portal is unavailable.'); setState('error'); }
      });
  }

  useEffect(load, []);

  if (state === 'loading') return <Shell><p className="text-ink-muted">Loading your portal...</p></Shell>;
  if (state === 'error') return <Shell><Banner kind="error">{error}</Banner><button type="button" className="btn-primary" onClick={() => { setState('loading'); load(); }}>Try again</button></Shell>;
  if (state === 'auth' || !me) {
    return <AuthScreen onSignedIn={() => { history.replaceState(null, '', '/portal/'); setState('loading'); load(); }} />;
  }
  return (
    <Dashboard
      me={me}
      onReload={load}
      onSignOut={async () => {
        await call('/api/portal-logout.php', {}).catch(() => undefined);
        setMe(null);
        setState('auth');
      }}
    />
  );
}

const mount = document.getElementById('portal-root');
if (mount && !mount.dataset.portalMounted) {
  mount.dataset.portalMounted = 'true';
  createRoot(mount).render(<PortalApp />);
}
