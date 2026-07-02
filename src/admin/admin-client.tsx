import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, FormEvent, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { readSheet } from 'read-excel-file/browser';
import { Database, Download, FileText, GraduationCap, LayoutDashboard, LogOut, RefreshCw, ReceiptText, Search, ShieldCheck, UploadCloud, UsersRound } from 'lucide-react';
import type { Scholarship } from '../match/match-data';

type Lead = {
  ts?: string;
  name?: string;
  email?: string;
  phone?: string;
  phoneNormalized?: string;
  answers?: Record<string, unknown>;
  pathwayIds?: string[];
  scholarshipIds?: string[];
  cvFile?: string;
  cvMeta?: { originalName?: string; mime?: string; size?: number; uploadedAt?: string };
};
type Purchase = { ts?: string; reference?: string; serviceId?: string; itemName?: string; amountPesewas?: number; buyerName?: string; buyerEmail?: string; sessions?: string[] };
type Tab = 'leads' | 'scholarships' | 'purchases';
type Icon = ComponentType<{ className?: string }>;

const tabs: Array<{ id: Tab; label: string; icon: Icon; description: string }> = [
  { id: 'leads', label: 'Leads', icon: UsersRound, description: 'Quiz submissions and CVs' },
  { id: 'scholarships', label: 'Scholarships', icon: GraduationCap, description: 'Runtime matching feed' },
  { id: 'purchases', label: 'Purchases', icon: ReceiptText, description: 'Verified Paystack ledger' },
];

const regionMap: Record<string, string[]> = {
  uk: ['uk'],
  usa: ['us'],
  us: ['us'],
  canada: ['canada'],
  europe: ['europe'],
  oceania: ['australia', 'new-zealand'],
  asia: ['asia'],
  'africa/global': ['africa', 'any'],
  africa: ['africa'],
};

function money(pesewas?: number) {
  if (!pesewas) return 'GHS 0';
  return `GHS ${(pesewas / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function slug(s: string) {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function splitList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((x) => x.trim()).filter(Boolean);
  return String(v || '').split(/[,;/]/).map((x) => x.trim()).filter(Boolean);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted && ch === '"' && next === '"') {
      cell += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (!quoted && ch === ',') {
      row.push(cell);
      cell = '';
    } else if (!quoted && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

function rowsToObjects(rows: unknown[][]): Record<string, unknown>[] {
  const [headerRow, ...body] = rows;
  const headers = (headerRow || []).map((x) => String(x || '').trim());
  return body
    .filter((row) => row.some((x) => String(x || '').trim() !== ''))
    .map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])));
}

function degreesFrom(v: unknown): Scholarship['degrees'] {
  const s = String(v || '').toLowerCase();
  const out = new Set<string>();
  if (/mba|business/.test(s)) out.add('mba');
  if (/phd|doctoral|doctorate/.test(s)) out.add('phd');
  if (/research|postgraduate diploma/.test(s)) out.add('research');
  if (/master|graduate|postgraduate|msc|ma|mba/.test(s)) out.add('taught');
  if (out.size === 0) out.add('any');
  return [...out] as Scholarship['degrees'];
}

function fundingFrom(v: unknown): string[] {
  const s = String(v || '').toLowerCase();
  if (/fully|full|stipend|salary/.test(s)) return ['full'];
  if (/partial|half|tuition|grant|loan|varies|funded/.test(s)) return ['partial', 'self-partly'];
  return ['flexible'];
}

function genderFrom(v: unknown, name: string): Scholarship['genderEligibility'] {
  const s = `${String(v || '')} ${name}`.toLowerCase();
  return /women only|female|fort[eé]|aauw|owsd/.test(s) ? 'female' : 'any';
}

function fieldsFrom(row: Record<string, unknown>) {
  const s = Object.values(row).join(' ').toLowerCase();
  const fields = new Set<string>();
  if (/business|mba|finance|management|econom/.test(s)) fields.add('business');
  if (/stem|science|engineering|math|technology|data|ictp|aims/.test(s)) fields.add('stem');
  if (/health|medicine|wellcome|medical/.test(s)) fields.add('health');
  if (/social|development|policy|peace|humanities/.test(s)) fields.add('social');
  if (/law|legal/.test(s)) fields.add('law');
  if (/arts|design/.test(s)) fields.add('arts');
  return fields.size ? [...fields] : ['any'];
}

function normalizeScholarshipRow(row: Record<string, unknown>): Scholarship | null {
  const name = String(row.Scholarship || row.name || row.Name || '').trim();
  if (!name) return null;
  const regionRaw = String(row.Region || row.region || 'Multiple').trim();
  const coverage = String(row.Coverage || row.fundingType || row['Funding Type'] || 'Varies').trim();
  const notes = String(row['Eligible Region / Notes'] || row.notes || row.Notes || '').trim();
  const host = String(row['Host / Funder'] || row.host || '').trim();
  const mappedRegions = regionMap[regionRaw.toLowerCase()] || ['any'];
  const genderEligibility = genderFrom(row['Gender-based?'] || row.genderEligibility, name);
  return {
    id: slug(String(row.id || name)),
    name,
    region: regionRaw || 'Multiple',
    fundingType: coverage,
    blurb: String(row.blurb || `${coverage} support from ${host || 'the funder'} for ${notes || 'eligible graduate applicants'}.`).slice(0, 500),
    regions: mappedRegions,
    fields: fieldsFrom(row) as Scholarship['fields'],
    degrees: degreesFrom(row['Degree Level'] || row.degrees),
    minClass: '2:1',
    idealExp: /mid-career|professional|experience|mba/i.test(notes + host + name) ? 'some' : 'any',
    funding: fundingFrom(coverage),
    tags: [
      /africa|african/i.test(notes + regionRaw) ? 'africa' : '',
      /develop/i.test(notes + name) ? 'development' : '',
      genderEligibility === 'female' ? 'women' : '',
    ].filter(Boolean),
    weight: 50,
    genderEligibility,
  };
}

async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

function dateShort(value?: string) {
  if (!value) return 'Not recorded';
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function AdminApp() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('leads');
  const [query, setQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [importPreview, setImportPreview] = useState<Scholarship[]>([]);
  const [busy, setBusy] = useState(false);

  async function loadAll(options: { quiet?: boolean } = {}) {
    setBusy(true);
    if (!options.quiet) setError('');
    try {
      const [leadData, purchaseData, scholarshipData] = await Promise.all([
        api<{ items: Lead[] }>('/api/admin-leads.php'),
        api<{ items: Purchase[] }>('/api/admin-purchases.php'),
        api<{ scholarships: Scholarship[] }>('/api/admin-scholarships.php'),
      ]);
      setLeads(leadData.items || []);
      setPurchases(purchaseData.items || []);
      setScholarships(scholarshipData.scholarships || []);
      setAuthed(true);
    } catch (e) {
      if (!options.quiet) setError(e instanceof Error ? e.message : 'Could not load admin data');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll({ quiet: true }).catch(() => undefined);
  }, []);

  async function login(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/admin-login.php', { method: 'POST', body: JSON.stringify({ password }) });
      setPassword('');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await api('/api/admin-logout.php', { method: 'POST', body: '{}' }).catch(() => undefined);
    setAuthed(false);
  }

  async function onFile(file: File | null) {
    if (!file) return;
    const rows = file.name.toLowerCase().endsWith('.csv')
      ? rowsToObjects(parseCsv(await file.text()))
      : rowsToObjects(await readSheet(file));
    const next = rows.map(normalizeScholarshipRow).filter((x): x is Scholarship => Boolean(x));
    setImportPreview(next);
  }

  async function saveScholarships() {
    setBusy(true);
    setError('');
    try {
      await api('/api/admin-scholarships.php', { method: 'POST', body: JSON.stringify({ scholarships: importPreview }) });
      setImportPreview([]);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  }

  const stats = useMemo(() => ({
    cvCount: leads.filter((l) => l.cvFile).length,
    scholarshipCount: scholarships.length,
    purchaseCount: purchases.length,
  }), [leads, purchases, scholarships]);
  const activeTab = tabs.find((x) => x.id === tab) || tabs[0];
  const filteredLeads = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return leads;
    return leads.filter((lead) => [lead.name, lead.email, lead.phone, lead.phoneNormalized, String(lead.answers?.reason || '')]
      .some((x) => String(x || '').toLowerCase().includes(needle)));
  }, [leads, query]);
  const filteredScholarships = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = importPreview.length ? importPreview : scholarships;
    if (!needle) return list;
    return list.filter((s) => [s.name, s.region, s.fundingType, s.blurb]
      .some((x) => String(x || '').toLowerCase().includes(needle)));
  }, [importPreview, query, scholarships]);
  const filteredPurchases = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return purchases;
    return purchases.filter((p) => [p.buyerName, p.buyerEmail, p.itemName, p.serviceId, p.reference]
      .some((x) => String(x || '').toLowerCase().includes(needle)));
  }, [purchases, query]);

  if (!authed) {
    return (
      <main className="min-h-screen bg-[#f4f6f9] text-[#172033]">
        <div className="grid min-h-screen lg:grid-cols-[minmax(320px,440px)_1fr]">
          <section className="flex flex-col justify-between bg-[#102548] px-7 py-8 text-white sm:px-10">
            <div>
              <div className="mb-16 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#3FA9F5] text-[#102548]">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9ed8ff]">Elevate ops</p>
                  <p className="text-sm text-white/70">Private workspace</p>
                </div>
              </div>
              <h1 className="mb-4 max-w-sm text-4xl font-extrabold leading-tight text-white sm:text-5xl">Admin dashboard</h1>
              <p className="max-w-sm text-base leading-7 text-white/72">
                Manage Grad School Match leads, CV uploads, scholarships, and verified purchases in one focused workspace.
              </p>
            </div>
            <div className="mt-12 grid gap-3 text-sm text-white/70">
              <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-[#3FA9F5]" /> Session protected by server-side PHP auth</div>
              <div className="flex items-center gap-3"><Database className="h-4 w-4 text-[#3FA9F5]" /> Private files stay under protected API storage</div>
            </div>
          </section>

          <section className="flex items-center justify-center px-5 py-10">
            <form onSubmit={login} className="w-full max-w-md rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_24px_80px_rgba(16,37,72,0.12)]">
              <div className="mb-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0077B6]">Sign in</p>
                <h2 className="text-2xl font-extrabold text-[#102548]">Unlock admin tools</h2>
              </div>
              <label className="mb-2 block text-sm font-semibold text-[#26334d]" htmlFor="admin-password">Admin password</label>
              <input id="admin-password" className="input mb-4" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus />
              {error && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <button className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#102548] px-5 py-3 font-semibold text-white transition hover:bg-[#173661]" disabled={busy}>
                <ShieldCheck className="h-4 w-4" />
                {busy ? 'Checking password...' : 'Sign in'}
              </button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef3f8] text-[#172033]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="bg-[#102548] px-5 py-5 text-white lg:sticky lg:top-0 lg:h-screen">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#3FA9F5] text-[#102548]">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9ed8ff]">Elevate ops</p>
              <p className="text-sm text-white/65">Admin workspace</p>
            </div>
          </div>

          <nav className="space-y-2" aria-label="Admin sections">
            {tabs.map((item) => (
              <NavButton key={item.id} item={item} active={tab === item.id} onClick={() => setTab(item.id)} />
            ))}
          </nav>

          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#9ed8ff]">System</p>
            <p className="text-sm leading-6 text-white/72">Runtime data is stored privately under PHP-managed files.</p>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-5 sm:px-7 lg:px-10">
          <header className="mb-6 flex flex-col gap-4 rounded-lg border border-white bg-white/80 p-4 shadow-[0_12px_40px_rgba(16,37,72,0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#0077B6]">{activeTab.label}</p>
              <h1 className="text-2xl font-extrabold text-[#102548]">{activeTab.description}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-[#c8d6e5] bg-white px-4 py-2 text-sm font-semibold text-[#102548] transition hover:border-[#0077B6] hover:text-[#0077B6]" onClick={() => loadAll()} disabled={busy}>
                <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button type="button" className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-[#102548] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#173661]" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </header>

          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <MetricCard label="Leads" value={leads.length} icon={UsersRound} accent="blue" detail={`${stats.cvCount} with CVs`} />
            <MetricCard label="Scholarships" value={stats.scholarshipCount} icon={GraduationCap} accent="green" detail={importPreview.length ? `${importPreview.length} staged` : 'Live runtime feed'} />
            <MetricCard label="Purchases" value={stats.purchaseCount} icon={ReceiptText} accent="amber" detail="Verified ledger" />
          </div>

          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74819a]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 w-full rounded-lg border border-[#c8d6e5] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20"
                placeholder={`Search ${activeTab.label.toLowerCase()}`}
              />
            </div>
            <p className="text-sm text-[#64718a]">{busy ? 'Syncing data...' : 'Data loaded from private PHP endpoints'}</p>
          </div>

          {tab === 'leads' && <Leads leads={filteredLeads} />}
          {tab === 'scholarships' && <Scholarships current={filteredScholarships} previewCount={importPreview.length} onFile={onFile} onSave={saveScholarships} onClear={() => setImportPreview([])} busy={busy} />}
          {tab === 'purchases' && <Purchases purchases={filteredPurchases} />}
        </section>
      </div>
    </main>
  );
}

function NavButton({ item, active, onClick }: { item: { id: Tab; label: string; icon: Icon; description: string }; active: boolean; onClick: () => void }) {
  const IconComp = item.icon;
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${active ? 'bg-white text-[#102548] shadow-lg shadow-black/10' : 'text-white/72 hover:bg-white/10 hover:text-white'}`}>
      <IconComp className="h-5 w-5 shrink-0" />
      <span>
        <span className="block text-sm font-bold">{item.label}</span>
        <span className={`block text-xs ${active ? 'text-[#5f6b80]' : 'text-white/45'}`}>{item.description}</span>
      </span>
    </button>
  );
}

function MetricCard({ label, value, icon, accent, detail }: { label: string; value: number; icon: Icon; accent: 'blue' | 'green' | 'amber'; detail: string }) {
  const IconComp = icon;
  const accentClass = {
    blue: 'bg-[#e7f4ff] text-[#0077B6]',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  }[accent];
  return (
    <div className="rounded-lg border border-white bg-white p-4 shadow-[0_10px_30px_rgba(16,37,72,0.07)]">
      <div className="mb-5 flex items-center justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${accentClass}`}>
          <IconComp className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-[#f2f5f9] px-2.5 py-1 text-xs font-semibold text-[#64718a]">{detail}</span>
      </div>
      <div className="text-3xl font-extrabold text-[#102548]">{value.toLocaleString()}</div>
      <div className="text-sm font-medium text-[#64718a]">{label}</div>
    </div>
  );
}

function Leads({ leads }: { leads: Lead[] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
      <SectionHeader title="Grad School Match leads" subtitle={`${leads.length} visible records`} />
      {leads.length === 0 ? <EmptyState icon={UsersRound} title="No leads yet" body="Submitted quiz leads will appear here with contact details and CV links." /> : (
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="bg-[#f6f8fb] text-left text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">
              <tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Lead</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Goal</th><th className="px-5 py-3">CV</th></tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f6]">
              {leads.map((l, i) => (
                <tr key={`${l.ts}-${i}`} className="hover:bg-[#f9fbfd]">
                  <td className="px-5 py-4 whitespace-nowrap text-[#64718a]">{dateShort(l.ts)}</td>
                  <td className="px-5 py-4"><strong className="text-[#102548]">{l.name || 'Unknown'}</strong><br /><span className="text-[#64718a]">{l.email || 'No email'}</span></td>
                  <td className="px-5 py-4 font-mono text-xs text-[#26334d]">{l.phoneNormalized || l.phone || 'No phone'}</td>
                  <td className="px-5 py-4 text-[#26334d]">{String(l.answers?.reason || 'Not recorded')}</td>
                  <td className="px-5 py-4">{l.cvFile ? <a className="inline-flex items-center gap-2 rounded-lg border border-[#c8d6e5] px-3 py-2 text-xs font-bold text-[#0077B6] no-underline hover:border-[#0077B6]" href={`/api/admin-cv.php?file=${encodeURIComponent(l.cvFile)}`} target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5" /> Open CV</a> : <span className="text-[#9aa5b7]">None</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Scholarships({ current, previewCount, onFile, onSave, onClear, busy }: { current: Scholarship[]; previewCount: number; onFile: (f: File | null) => void; onSave: () => void; onClear: () => void; busy: boolean }) {
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
      <SectionHeader title="Scholarship database" subtitle={previewCount ? `${previewCount} staged records ready to save` : `${current.length} visible records`} />
      <div className="border-b border-[#edf1f6] p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <button type="button" onClick={() => fileInput.current?.click()} className="flex min-h-[118px] w-full items-center gap-4 rounded-lg border border-dashed border-[#9ab5cf] bg-[#f7fbff] px-5 py-4 text-left transition hover:border-[#0077B6] hover:bg-[#eef8ff]">
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-white text-[#0077B6] shadow-sm"><UploadCloud className="h-6 w-6" /></span>
            <span>
              <span className="block font-bold text-[#102548]">Upload reviewed CSV or XLSX</span>
              <span className="block text-sm text-[#64718a]">The preview appears below before it replaces the runtime scholarship feed.</span>
            </span>
          </button>
          <input ref={fileInput} type="file" accept=".csv,.xlsx,.xls" onChange={(e) => onFile(e.target.files?.[0] || null)} className="sr-only" />
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {previewCount > 0 && <button type="button" className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#c8d6e5] bg-white px-4 py-2 text-sm font-semibold text-[#102548] hover:border-[#0077B6]" onClick={onClear}>Clear preview</button>}
            {previewCount > 0 && <button type="button" className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-[#102548] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173661]" disabled={busy} onClick={onSave}><Database className="h-4 w-4" /> Save {previewCount}</button>}
          </div>
        </div>
      </div>
      {current.length === 0 ? <EmptyState icon={GraduationCap} title="No scholarships in this view" body="Upload a reviewed sheet or clear the search filter to see records." /> : (
        <div className="grid divide-y divide-[#edf1f6]">
          {current.slice(0, 40).map((s) => (
            <div key={s.id} className="p-5 hover:bg-[#f9fbfd]">
              <div className="mb-2 flex flex-wrap gap-2 text-xs font-bold">
                <Badge>{s.region}</Badge>
                <Badge tone="blue">{s.fundingType}</Badge>
                {s.genderEligibility && s.genderEligibility !== 'any' && <Badge tone="amber">{s.genderEligibility} only</Badge>}
              </div>
              <h3 className="font-bold text-[#102548]">{s.name}</h3>
              <p className="mt-1 max-w-4xl text-sm leading-6 text-[#64718a]">{s.blurb}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Purchases({ purchases }: { purchases: Purchase[] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
      <SectionHeader title="Verified purchases" subtitle={`${purchases.length} visible records`} />
      {purchases.length === 0 ? <EmptyState icon={ReceiptText} title="No purchases yet" body="Verified Paystack orders will appear here after checkout confirmation." /> : (
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="bg-[#f6f8fb] text-left text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">
              <tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Buyer</th><th className="px-5 py-3">Item</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Reference</th></tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f6]">
              {purchases.map((p, i) => (
                <tr key={`${p.reference}-${i}`} className="hover:bg-[#f9fbfd]">
                  <td className="px-5 py-4 whitespace-nowrap text-[#64718a]">{dateShort(p.ts)}</td>
                  <td className="px-5 py-4"><strong className="text-[#102548]">{p.buyerName || 'Unknown'}</strong><br /><span className="text-[#64718a]">{p.buyerEmail || 'No email'}</span></td>
                  <td className="px-5 py-4 text-[#26334d]">{p.itemName || p.serviceId || 'Unknown item'}</td>
                  <td className="px-5 py-4 font-bold text-[#102548]">{money(p.amountPesewas)}</td>
                  <td className="px-5 py-4 font-mono text-xs text-[#64718a]">{p.reference || 'No reference'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-2 border-b border-[#edf1f6] px-5 py-4 md:flex-row md:items-center md:justify-between">
      <h2 className="text-lg font-extrabold text-[#102548]">{title}</h2>
      <p className="text-sm text-[#64718a]">{subtitle}</p>
    </div>
  );
}

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'blue' | 'amber' }) {
  const cls = {
    neutral: 'bg-[#edf2f7] text-[#26334d]',
    blue: 'bg-[#e7f4ff] text-[#0077B6]',
    amber: 'bg-amber-100 text-amber-800',
  }[tone];
  return <span className={`rounded-full px-2.5 py-1 ${cls}`}>{children}</span>;
}

function EmptyState({ icon, title, body }: { icon: Icon; title: string; body: string }) {
  const IconComp = icon;
  return (
    <div className="grid place-items-center px-5 py-14 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-[#eef4fa] text-[#0077B6]">
        <IconComp className="h-6 w-6" />
      </div>
      <h3 className="mb-1 font-bold text-[#102548]">{title}</h3>
      <p className="max-w-sm text-sm leading-6 text-[#64718a]">{body}</p>
    </div>
  );
}

const mount = document.getElementById('admin-root');
if (mount && !mount.dataset.adminMounted) {
  mount.dataset.adminMounted = 'true';
  createRoot(mount).render(<AdminApp />);
}
