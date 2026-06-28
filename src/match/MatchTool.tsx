/**
 * Grad School Match, interactive tool.
 *
 * A React island: rendered to static HTML at build time as a no-JS fallback
 * (the intro screen), then client-rendered into #match-root by
 * src/match/match-client.tsx for full interactivity. The rest of the page stays
 * zero-JS.
 *
 * Flow: intro -> quiz (one tap per step) -> teaser + optional extras (CV /
 * LinkedIn / portfolio) -> contact form -> full report. Matching runs entirely
 * in the browser; the form POST persists the lead and emails the report
 * instantly. The report is fully automated and goal-driven (optimistic copy
 * built from the visitor's "reason" + destination).
 *
 * Keep the initial (intro) render free of browser globals so it is SSR-safe.
 * Brand voice: the Insider Friend, warm and a little funny. No em dashes.
 */
import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { QUESTIONS, matchProfile, motivationFor } from './match-data';
import type { Answers, MatchQuestion, Tier } from './match-data';

const LEAD_ENDPOINT = '/api/quiz-lead.php';
const BOOTCAMP_URL = '/get-into-grad-school-bootcamp/#tickets';
const WHATSAPP_BASE = 'https://wa.me/233531113454';
const MAX_CV_BYTES = 5 * 1024 * 1024;
const CV_EXT = ['pdf', 'doc', 'docx'];

const PHONE_CODES = [
  { code: '+233', label: 'Ghana (+233)' },
  { code: '+234', label: 'Nigeria (+234)' },
  { code: '+254', label: 'Kenya (+254)' },
  { code: '+27', label: 'South Africa (+27)' },
  { code: '+256', label: 'Uganda (+256)' },
  { code: '+255', label: 'Tanzania (+255)' },
  { code: '+250', label: 'Rwanda (+250)' },
  { code: '+44', label: 'United Kingdom (+44)' },
  { code: '+1', label: 'US / Canada (+1)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+49', label: 'Germany (+49)' },
];

const NEXT_STEP: Record<string, { title: string; body: string }> = {
  funding: {
    title: 'Funding is your real blocker, and it is the most solvable one.',
    body: 'Session 7 is a full deep dive on scholarships, and you walk away with the 50+ Scholarships Pack you can act on right away.',
  },
  essays: {
    title: 'Your essays are what is holding you back.',
    body: 'Session 4 takes you through personal statements and scholarship essays step by step, using the narrative strategy that makes committees stop and read.',
  },
  'school-selection': {
    title: 'Picking the right schools is where you are stuck.',
    body: 'Session 1 helps you build a smart, fundable school list so you stop applying on guesswork.',
  },
  'low-gpa': {
    title: 'Your grades are not the end of your story.',
    body: 'The bootcamp shows you how to position your profile so admissions committees look past the number and see your potential.',
  },
  visa: {
    title: 'The whole moving process is weighing on you.',
    body: 'Session 8 walks through document prep and the visa interview so you arrive on campus ready and confident.',
  },
  start: {
    title: 'You are not sure where to start, and that is completely normal.',
    body: 'The bootcamp takes you from school selection all the way to your visa, one clear step at a time.',
  },
};

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

type Phase = 'intro' | 'quiz' | 'extras' | 'form' | 'done';

export function MatchTool() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  // Optional extras (Tier 2)
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState('');

  // Contact form (Tier 1)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState('+233');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState(''); // honeypot, must stay empty
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailed, setEmailed] = useState(false);

  const total = QUESTIONS.length;
  const result = useMemo(() => matchProfile(answers), [answers]);

  function answer(q: MatchQuestion, value: string) {
    if (q.type === 'single') {
      setAnswers((a) => ({ ...a, [q.id]: value }));
      // If this choice asks for a "tell us" note, stay put and reveal the box.
      if (q.specify && value === q.specify.value) return;
      window.setTimeout(() => goNext(), 140);
    } else {
      setAnswers((a) => {
        const current = Array.isArray(a[q.id]) ? (a[q.id] as string[]) : [];
        const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
        return { ...a, [q.id]: next };
      });
    }
  }

  function isAnswered(q: MatchQuestion): boolean {
    const v = answers[q.id];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  }

  function goNext() {
    if (qIndex < total - 1) setQIndex(qIndex + 1);
    else setPhase('extras');
  }

  function goBack() {
    if (qIndex === 0) {
      setPhase('intro');
      return;
    }
    setQIndex((i) => Math.max(0, i - 1));
  }

  function onCvChange(file: File | null) {
    setCvError('');
    if (!file) { setCvFile(null); return; }
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!CV_EXT.includes(ext)) { setCvFile(null); setCvError('Please upload a PDF, DOC, or DOCX file.'); return; }
    if (file.size > MAX_CV_BYTES) { setCvFile(null); setCvError('That file is over 5 MB. Pop in a smaller version.'); return; }
    setCvFile(file);
  }

  function e164(): string {
    const national = phoneNumber.replace(/\D/g, '').replace(/^0+/, '');
    return `${phoneCode}${national}`;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    if (company.trim() !== '') return; // bot
    if (name.trim().length < 2) { setFormError('Pop your name in so we know who we are cheering for.'); return; }
    if (!isEmail(email.trim())) { setFormError('We need a valid email to send your report to.'); return; }
    if (phoneNumber.replace(/\D/g, '').length < 7) { setFormError('Add your WhatsApp number so we can reach you.'); return; }
    if (!consent) { setFormError('Tick the box and we will send your report right over.'); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('email', email.trim());
      fd.append('phone', e164());
      fd.append('consent', 'yes');
      fd.append('answers', JSON.stringify(answers));
      fd.append('pathwayIds', result.pathways.map((p) => p.id).join(','));
      fd.append('scholarshipIds', result.scholarships.map((s) => s.id).join(','));
      fd.append('pathwayTiers', result.pathways.map((p) => p.tier).join(','));
      fd.append('scholarshipTiers', result.scholarships.map((s) => s.tier).join(','));
      if (linkedin.trim()) fd.append('linkedin', linkedin.trim());
      if (portfolio.trim()) fd.append('portfolio', portfolio.trim());
      if (cvFile) fd.append('cv', cvFile);
      fd.append('company', company);

      const res = await fetch(LEAD_ENDPOINT, { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      setEmailed(Boolean(res.ok && data && data.ok));
    } catch {
      setEmailed(false);
    } finally {
      setSubmitting(false);
      setPhase('done'); // always reveal the report once they have given details
    }
  }

  // ── Intro (also the SSR / no-JS fallback) ─────────────────────────────────
  if (phase === 'intro') {
    return (
      <Shell>
        <p className="eyebrow text-primary mb-3">Free grad school match</p>
        <h2 className="text-headline-lg mb-4">See the programs and scholarships you actually qualify for</h2>
        <p className="text-ink-muted leading-relaxed mb-8">
          Two minutes of tapping. No essays, no judgment, no "we will get back to you in 6 to 8 weeks." Just a
          straight answer on where you stand, and a report you keep.
        </p>
        <button type="button" className="btn-primary" onClick={() => { setQIndex(0); setPhase('quiz'); }}>
          Find my matches
        </button>
        <p className="text-xs text-ink-muted mt-4">100% free. No payment. We will not spam you, we hate that too.</p>
        <noscript>
          <p className="text-ink-muted mt-6">
            This tool needs JavaScript. In the meantime, see the{' '}
            <a href="/get-into-grad-school-bootcamp/">Get Into Grad School Bootcamp</a>.
          </p>
        </noscript>
      </Shell>
    );
  }

  // ── Quiz ──────────────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const q = QUESTIONS[qIndex];
    const pct = Math.round((qIndex / total) * 100);
    const selectedValue = Array.isArray(answers[q.id]) ? undefined : (answers[q.id] as string | undefined);
    const showSpecify = Boolean(q.specify && selectedValue === q.specify.value);
    return (
      <Shell>
        <Progress section={q.section} step={qIndex + 1} total={total} pct={pct} />
        <h2 className="text-headline-md text-navy mt-6 mb-1">{q.prompt}</h2>
        {q.help ? <p className="text-sm text-ink-muted mb-5">{q.help}</p> : <div className="mb-5" />}

        <div className="flex flex-col gap-3">
          {q.options.map((opt) => {
            const selected = Array.isArray(answers[q.id])
              ? (answers[q.id] as string[]).includes(opt.value)
              : answers[q.id] === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => answer(q, opt.value)}
                aria-pressed={selected}
                className={`text-left rounded-xl border-2 px-5 py-4 transition-colors ${
                  selected
                    ? 'border-primary bg-surface-tint text-navy font-semibold'
                    : 'border-ink/15 bg-white text-ink hover:border-primary/50'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {showSpecify && q.specify && (
          <div className="mt-4">
            <label htmlFor={`${q.id}-other`} className="block text-sm font-semibold text-navy mb-1">{q.specify.placeholder}</label>
            <input
              id={`${q.id}-other`}
              type="text"
              autoFocus
              value={(answers[`${q.id}_other`] as string) || ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [`${q.id}_other`]: e.target.value }))}
              className="input"
              placeholder="e.g. Architecture, Public Health, Data Science"
            />
          </div>
        )}

        <div className="flex items-center justify-between mt-7">
          <button type="button" onClick={goBack} className="text-sm text-ink-muted hover:text-navy underline underline-offset-4">
            Back
          </button>
          {(q.type === 'multi' || showSpecify) && (
            <button type="button" onClick={goNext} disabled={!isAnswered(q)} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
              Continue
            </button>
          )}
        </div>
      </Shell>
    );
  }

  // ── Extras: teaser + optional supercharge (its own step before the form) ──
  if (phase === 'extras') {
    return (
      <Shell>
        <div className="text-center mb-7">
          <p className="eyebrow text-primary mb-2">Plot twist</p>
          <h2 className="text-headline-lg mb-3">
            You qualify for{' '}
            <span className="text-primary">{result.pathways.length} {result.pathways.length === 1 ? 'pathway' : 'pathways'}</span>{' '}
            and{' '}
            <span className="text-primary">{result.scholarships.length} {result.scholarships.length === 1 ? 'scholarship' : 'scholarships'}</span>
          </h2>
          <p className="text-ink-muted">More than you thought, right? One quick optional step, then your full report.</p>
        </div>

        {/* Locked preview */}
        <ul className="grid gap-2 mb-8" aria-hidden="true">
          {result.pathways.slice(0, 3).map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-lg border border-ink/10 bg-white px-4 py-3">
              <LockIcon />
              <span className="blur-sm select-none text-ink">{p.name}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-2xl border-2 border-primary/20 bg-surface-tint/40 p-5 sm:p-6">
          <h3 className="text-title-lg text-navy">Want a scarily tailored report? (optional)</h3>
          <p className="text-sm text-ink-muted mt-1 mb-5">
            Drop your CV and links and a real human on our team will tailor your report and send personalized feedback.
            Not your vibe right now? Totally fine, skip it and your matches are still ready.
          </p>
          <Field label="Upload your CV" htmlFor="m-cv" help="PDF, DOC, or DOCX, up to 5 MB. You get a free review with it.">
            <input id="m-cv" type="file" accept=".pdf,.doc,.docx"
              onChange={(e) => onCvChange(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
              className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-white file:font-semibold" />
            {cvFile && <p className="text-xs text-primary mt-1">Got it: {cvFile.name}</p>}
            {cvError && <p className="text-xs text-red-600 mt-1">{cvError}</p>}
          </Field>
          <Field label="LinkedIn profile" htmlFor="m-linkedin">
            <input id="m-linkedin" type="url" inputMode="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)}
              className="input" placeholder="https://linkedin.com/in/you" />
          </Field>
          <Field label="Portfolio or website" htmlFor="m-portfolio">
            <input id="m-portfolio" type="url" inputMode="url" value={portfolio} onChange={(e) => setPortfolio(e.target.value)}
              className="input" placeholder="https://" />
          </Field>
        </div>

        <button type="button" className="btn-primary w-full mt-7" onClick={() => setPhase('form')}>
          Continue to my report
        </button>
        <p className="text-center text-xs text-ink-muted mt-3">All optional. Skip it and keep moving if you like.</p>
        <button type="button" onClick={() => { setPhase('quiz'); setQIndex(total - 1); }} className="block mx-auto mt-3 text-sm text-ink-muted hover:text-navy underline underline-offset-4">
          Back
        </button>
      </Shell>
    );
  }

  // ── Form: contact details + instant, automated delivery ───────────────────
  if (phase === 'form') {
    return (
      <Shell>
        <div className="text-center mb-6">
          <p className="eyebrow text-primary mb-2">Last step, promise</p>
          <h2 className="text-headline-lg mb-3">Where do we send the goods?</h2>
          <p className="text-ink-muted">
            Hit the button and your full report is built automatically from your answers and lands in your inbox in
            seconds. No humans in the loop, no waiting around.
          </p>
        </div>

        <form onSubmit={submit} noValidate className="text-left">
          <Field label="Full name" htmlFor="m-name">
            <input id="m-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="input" required />
          </Field>
          <Field label="Email" htmlFor="m-email" help="This is where your report lands, so double-check it.">
            <input id="m-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
          </Field>
          <Field label="WhatsApp number" htmlFor="m-phone" help="For your report and the odd scholarship tip. No spam, ever.">
            <div className="flex gap-2">
              <select aria-label="Country code" value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} className="input w-auto shrink-0">
                {PHONE_CODES.map((c) => <option key={c.code + c.label} value={c.code}>{c.label}</option>)}
              </select>
              <input id="m-phone" type="tel" inputMode="tel" autoComplete="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="input flex-1" placeholder="24 123 4567" required />
            </div>
          </Field>

          {/* Honeypot, visually hidden */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 'auto', height: 0, overflow: 'hidden' }}>
            <label>Company<input type="text" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} /></label>
          </div>

          <label className="flex items-start gap-3 text-sm text-ink-muted mb-5">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-primary shrink-0" />
            <span>
              Send me my report and the occasional scholarship tip by email and WhatsApp, and store anything I upload. See our{' '}
              <a href="/privacy-policy/" target="_blank" rel="noopener">privacy policy</a>.
            </span>
          </label>

          {formError && <p className="text-sm text-red-600 mb-3" role="alert">{formError}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? 'Building your report…' : 'Email me my report'}
          </button>
          <button type="button" onClick={() => setPhase('extras')} className="block mx-auto mt-3 text-sm text-ink-muted hover:text-navy underline underline-offset-4">
            Back
          </button>
        </form>
      </Shell>
    );
  }

  // ── Done: the full, goal-driven report ────────────────────────────────────
  const blocker = (Array.isArray(answers.blocker) ? answers.blocker[0] : answers.blocker) || 'start';
  const step = NEXT_STEP[blocker] || NEXT_STEP.start;
  const motivation = motivationFor(answers);
  const topMatch = result.pathways[0];
  const waUrl = `${WHATSAPP_BASE}?text=${encodeURIComponent(
    `Hi Elevate, I just did the Grad School Match. My top match is ${topMatch ? topMatch.name : 'a funded program'} and I'd love help getting into the bootcamp.`,
  )}`;

  return (
    <Shell wide>
      <div className="text-center mb-8">
        <p className="eyebrow text-primary mb-2">Your match report</p>
        <h2 className="text-headline-lg mb-3">{motivation.headline}</h2>
        <p className="text-ink-muted max-w-2xl mx-auto">{motivation.body}</p>
        <p className="text-sm text-primary mt-4">
          {emailed
            ? `Done. We just dropped a copy in your inbox (${email}), generated automatically so you did not have to wait on anyone.`
            : 'Here is your shortlist. Keep it close, your next move is at the bottom.'}
        </p>
      </div>

      <section className="mb-9">
        <h3 className="text-title-lg text-navy mb-4">Program pathways you qualify for</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {result.pathways.map((p) => (
            <div key={p.id} className="card">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-navy bg-surface-tint px-2.5 py-1 rounded-full">{p.category}</span>
                <TierBadge tier={p.tier} />
              </div>
              <h4 className="text-lg font-bold text-navy">{p.name}</h4>
              <p className="text-ink-muted text-sm leading-relaxed mt-1">{p.blurb}</p>
              <Reasons reasons={p.reasons} />
              {p.bootcampSession && <p className="text-xs text-primary mt-3">Covered in the bootcamp: {p.bootcampSession}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-9">
        <h3 className="text-title-lg text-navy mb-4">Scholarships worth targeting</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {result.scholarships.map((s) => (
            <div key={s.id} className="card">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-navy bg-surface-tint px-2.5 py-1 rounded-full">{s.region}</span>
                <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-primary bg-primary-50 px-2.5 py-1 rounded-full">{s.fundingType}</span>
                <TierBadge tier={s.tier} />
              </div>
              <h4 className="text-lg font-bold text-navy">{s.name}</h4>
              <p className="text-ink-muted text-sm leading-relaxed mt-1">{s.blurb}</p>
              <Reasons reasons={s.reasons} />
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-muted mt-4">Quick honesty note: the final yes on funding sits with each provider. Our job is to make your case impossible to ignore. "Worth a stretch" just means aim for it with a sharper application, that is exactly what the bootcamp builds.</p>
      </section>

      {/* Personalized next step → bootcamp */}
      <section className="bg-gradient-to-br from-primary to-navy text-white rounded-xl p-8 sm:p-10 text-center">
        <h3 className="text-headline-md text-white mb-2">{step.title}</h3>
        <p className="text-white/90 max-w-xl mx-auto mb-7">{step.body}</p>
        {cvFile && <p className="text-white/80 text-sm mb-6">Your CV is in. A real human on our team will review it and follow up with notes alongside your report.</p>}
        <div className="flex flex-wrap justify-center gap-4">
          <a href={BOOTCAMP_URL} className="btn-primary bg-electric text-navy hover:bg-electric-600">See the bootcamp and ticket options</a>
          <a href={waUrl} target="_blank" rel="noopener" className="btn-outline">Continue on WhatsApp</a>
        </div>
      </section>
    </Shell>
  );
}

// ── Small presentational helpers ────────────────────────────────────────────
function Shell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={`mx-auto w-full ${wide ? 'max-w-4xl' : 'max-w-xl'}`}>
      <div className="bg-white rounded-2xl shadow-card p-6 sm:p-9">{children}</div>
    </div>
  );
}

function Progress({ section, step, total, pct }: { section: string; step: number; total: number; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-ink-muted mb-2">
        <span className="uppercase tracking-[0.18em] text-primary">{section}</span>
        <span>{step} of {total}</span>
      </div>
      <div className="h-2 rounded-full bg-surface-muted overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(pct, 6)}%` }} />
      </div>
    </div>
  );
}

function Field({ label, htmlFor, help, children }: { label: string; htmlFor: string; help?: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-navy mb-1">{label}</label>
      {help && <p className="text-xs text-ink-muted mb-1.5">{help}</p>}
      {children}
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4 text-ink-muted shrink-0" fill="currentColor" aria-hidden="true">
      <path d="M5 9V7a5 5 0 0110 0v2h1a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7a1 1 0 011-1h1zm2 0h6V7a3 3 0 00-6 0v2z" />
    </svg>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  if (tier === 'strong') {
    return <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Strong match</span>;
  }
  return <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">Worth a stretch</span>;
}

function Reasons({ reasons }: { reasons: string[] }) {
  if (!reasons || reasons.length === 0) return null;
  return (
    <ul className="mt-3 space-y-1.5">
      {reasons.map((r, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-ink">
          <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 10l4 4 6-8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {r}
        </li>
      ))}
    </ul>
  );
}
