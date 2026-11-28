import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { api, errorMessage, isAuthError } from '../api';
import { ErrorBanner, SectionHeader, dateOnly } from '../ui';
import { cedis, channelLabel, METHOD_LABELS } from '../ops-api';
import type { FinanceResponse } from '../ops-api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const today = () => new Date().toISOString().slice(0, 10);

export const inputCls = 'h-10 w-full rounded-lg border border-[#c8d6e5] bg-white px-3 text-sm outline-none focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20';
export const btnPrimary = 'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-[#0077B6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#005f92] disabled:opacity-50';
export const btnGhost = 'inline-flex min-h-[36px] items-center justify-center gap-2 rounded-lg border border-[#c8d6e5] bg-white px-3 py-1.5 text-sm font-semibold text-[#102548] transition hover:border-[#0077B6] hover:text-[#0077B6] disabled:opacity-50';

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold text-[#26334d]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[#64718a]">{hint}</span>}
    </label>
  );
}

type Sub = 'sales' | 'spend' | 'goals';

export function FinanceTab({ refreshKey, onAuthError }: { refreshKey: number; onAuthError: () => void }) {
  const [year, setYear] = useState(() => Math.max(2027, new Date().getUTCFullYear()));
  const [data, setData] = useState<FinanceResponse | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sub, setSub] = useState<Sub>('sales');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api<FinanceResponse>(`/api/admin-finance.php?year=${year}`)
      .then((res) => { if (!cancelled) { setData(res); setError(''); } })
      .catch((e) => {
        if (cancelled) return;
        if (isAuthError(e)) return onAuthError();
        setError(errorMessage(e, 'Could not load finance data'));
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, refreshKey, reload]);

  async function post(body: Record<string, unknown>, ok: string) {
    setError('');
    setNotice('');
    try {
      const res = await api<{ ok: boolean; workRemoved?: number; workKept?: number }>('/api/admin-finance.php', { method: 'POST', body: JSON.stringify(body) });
      let msg = ok;
      if (typeof res.workRemoved === 'number' && (res.workRemoved || res.workKept)) {
        msg += ` ${res.workRemoved} untouched work item(s) removed${res.workKept ? `, ${res.workKept} kept because work had started` : ''}.`;
      }
      setNotice(msg);
      setReload((r) => r + 1);
      return true;
    } catch (e) {
      if (isAuthError(e)) onAuthError();
      setError(errorMessage(e, 'Save failed'));
      return false;
    }
  }

  return (
    <>
      <ErrorBanner message={error} />
      {notice && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</div>}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="tablist">
          {([['sales', 'Offline sales'], ['spend', 'Marketing spend'], ['goals', 'Goals']] as [Sub, string][]).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={sub === id} onClick={() => setSub(id)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${sub === id ? 'bg-[#102548] text-white' : 'bg-white text-[#102548] hover:bg-[#e7f4ff]'}`}>{label}</button>
          ))}
        </div>
        <select aria-label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-10 rounded-lg border border-[#c8d6e5] bg-white px-3 text-sm">
          {[year + 1, year, year - 1, year - 2].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {data && sub === 'sales' && <SalesPanel data={data} post={post} />}
      {data && sub === 'spend' && <SpendPanel data={data} post={post} />}
      {data && sub === 'goals' && <GoalsPanel key={data.year} data={data} post={post} />}
    </>
  );
}

type Post = (body: Record<string, unknown>, ok: string) => Promise<boolean>;

function SalesPanel({ data, post }: { data: FinanceResponse; post: Post }) {
  const blank = { email: '', name: '', phone: '', serviceId: '', itemName: '', amountCedis: '', method: 'momo', channel: 'whatsapp', date: today(), reference: '', notes: '', createWork: true };
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const total = data.sales.reduce((s, x) => s + x.amountPesewas, 0);
  const servicesByCat = useMemo(() => {
    const map: Record<string, typeof data.services> = {};
    for (const s of data.services) (map[s.category] ||= []).push(s);
    return map;
  }, [data.services]);

  function pickService(id: string) {
    const svc = data.services.find((s) => s.id === id);
    setF((x) => ({ ...x, serviceId: id, itemName: svc ? svc.name : x.itemName, amountCedis: svc ? String(svc.amountPesewas / 100) : x.amountCedis }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await post({ action: 'sale', ...f, amountCedis: Number(f.amountCedis) }, `Sale recorded for ${f.email}.${f.createWork ? ' Work items were added to the board.' : ''}`);
    setBusy(false);
    if (ok) setF({ ...blank, method: f.method, channel: f.channel, date: f.date });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <section className="h-fit rounded-lg border border-white bg-white p-5 shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
        <h2 className="mb-1 text-lg font-extrabold text-[#102548]">Record an offline sale</h2>
        <p className="mb-4 text-sm text-[#64718a]">MoMo, bank transfer, cash or any deal closed outside Paystack. It counts toward the goal and creates the client's work items.</p>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Client email *"><input required type="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Phone"><input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          </div>
          <Field label="Service" hint="Pick from the catalogue, or leave blank and describe a custom deal below.">
            <select className={inputCls} value={f.serviceId} onChange={(e) => pickService(e.target.value)}>
              <option value="">Custom / other</option>
              {Object.entries(servicesByCat).map(([cat, list]) => (
                <optgroup key={cat} label={cat.replace(/_/g, ' ')}>
                  {list.map((s) => <option key={s.id} value={s.id}>{s.name} ({cedis(s.amountPesewas)})</option>)}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Item description *"><input required className={inputCls} value={f.itemName} onChange={(e) => setF({ ...f, itemName: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (GH₵) *"><input required type="number" min="0.01" step="0.01" className={inputCls} value={f.amountCedis} onChange={(e) => setF({ ...f, amountCedis: e.target.value })} /></Field>
            <Field label="Date paid"><input type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Method">
              <select className={inputCls} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
                {data.methods.map((m) => <option key={m} value={m}>{METHOD_LABELS[m] || m}</option>)}
              </select>
            </Field>
            <Field label="Came from">
              <select className={inputCls} value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })}>
                {data.channels.map((c) => <option key={c} value={c}>{channelLabel(c)}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Transaction reference"><input className={inputCls} value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} placeholder="MoMo ID, bank ref..." /></Field>
          <Field label="Notes"><textarea className={`${inputCls} h-16 py-2`} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm text-[#26334d]"><input type="checkbox" checked={f.createWork} onChange={(e) => setF({ ...f, createWork: e.target.checked })} />Create work items on the board</label>
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Saving...' : 'Record sale'}</button>
        </form>
      </section>
      <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
        <SectionHeader title={`Offline sales ${data.year}`} subtitle={`${data.sales.length} sales · ${cedis(total)}`} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-[#f6f8fb] text-left text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">
              <tr><th className="px-5 py-3">Date</th><th className="px-3 py-3">Client</th><th className="px-3 py-3">Item</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Method</th><th className="px-3 py-3">Channel</th><th className="px-3 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f6]">
              {data.sales.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-[#64718a]">No offline sales recorded for {data.year}.</td></tr>}
              {data.sales.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3 whitespace-nowrap text-[#64718a]">{dateOnly(s.occurredAt)}</td>
                  <td className="px-3 py-3"><strong className="text-[#102548]">{s.clientName || s.clientEmail}</strong><br /><span className="text-xs text-[#64718a]">{s.clientEmail}</span></td>
                  <td className="px-3 py-3">{s.itemName}{s.reference && <span className="block text-xs text-[#64718a]">Ref {s.reference}</span>}</td>
                  <td className="px-3 py-3 font-bold">{cedis(s.amountPesewas)}</td>
                  <td className="px-3 py-3">{METHOD_LABELS[s.method] || s.method}</td>
                  <td className="px-3 py-3">{channelLabel(s.channel)}</td>
                  <td className="px-3 py-3 text-right">
                    <button type="button" aria-label="Delete sale" className="text-[#64718a] hover:text-red-700" onClick={() => {
                      if (window.confirm(`Delete this ${cedis(s.amountPesewas)} sale? Work items it created that have not started will also be removed.`)) post({ action: 'sale_delete', id: s.id }, 'Sale deleted.');
                    }}><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SpendPanel({ data, post }: { data: FinanceResponse; post: Post }) {
  const blank = { date: today(), channel: 'meta', campaign: '', amountCedis: '', notes: '' };
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const byChannel = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of data.spend) m[s.channel] = (m[s.channel] || 0) + s.amountPesewas;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [data.spend]);
  const total = data.spend.reduce((s, x) => s + x.amountPesewas, 0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await post({ action: 'spend', ...f, amountCedis: Number(f.amountCedis) }, 'Spend recorded.');
    setBusy(false);
    if (ok) setF({ ...blank, channel: f.channel, date: f.date });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <div className="space-y-6">
        <section className="rounded-lg border border-white bg-white p-5 shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
          <h2 className="mb-1 text-lg font-extrabold text-[#102548]">Log marketing spend</h2>
          <p className="mb-4 text-sm text-[#64718a]">Ad spend, influencer fees, boosted posts, event costs. Log per campaign or a monthly total per channel; CAC and ROAS on the Growth tab use it.</p>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date"><input type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
              <Field label="Amount (GH₵) *"><input required type="number" min="0.01" step="0.01" className={inputCls} value={f.amountCedis} onChange={(e) => setF({ ...f, amountCedis: e.target.value })} /></Field>
            </div>
            <Field label="Channel">
              <select className={inputCls} value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })}>
                {data.channels.filter((c) => c !== 'direct').map((c) => <option key={c} value={c}>{channelLabel(c)}</option>)}
              </select>
            </Field>
            <Field label="Campaign"><input className={inputCls} value={f.campaign} onChange={(e) => setF({ ...f, campaign: e.target.value })} placeholder="e.g. Jan CV promo" /></Field>
            <Field label="Notes"><input className={inputCls} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
            <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Saving...' : 'Log spend'}</button>
          </form>
        </section>
        <section className="rounded-lg border border-white bg-white p-5 shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
          <h3 className="mb-3 font-extrabold text-[#102548]">{data.year} by channel · {cedis(total)}</h3>
          {byChannel.length === 0 ? <p className="text-sm text-[#64718a]">Nothing logged yet.</p> : (
            <ul className="space-y-2 text-sm">{byChannel.map(([c, v]) => <li key={c} className="flex justify-between"><span>{channelLabel(c)}</span><strong>{cedis(v)}</strong></li>)}</ul>
          )}
        </section>
      </div>
      <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
        <SectionHeader title={`Spend log ${data.year}`} subtitle={`${data.spend.length} entries`} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-[#f6f8fb] text-left text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">
              <tr><th className="px-5 py-3">Date</th><th className="px-3 py-3">Channel</th><th className="px-3 py-3">Campaign</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">By</th><th className="px-3 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f6]">
              {data.spend.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-[#64718a]">No spend logged for {data.year}.</td></tr>}
              {data.spend.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3 whitespace-nowrap text-[#64718a]">{dateOnly(s.spentOn)}</td>
                  <td className="px-3 py-3">{channelLabel(s.channel)}</td>
                  <td className="px-3 py-3">{s.campaign || '–'}{s.notes && <span className="block text-xs text-[#64718a]">{s.notes}</span>}</td>
                  <td className="px-3 py-3 font-bold">{cedis(s.amountPesewas)}</td>
                  <td className="px-3 py-3 text-xs text-[#64718a]">{s.recordedBy}</td>
                  <td className="px-3 py-3 text-right">
                    <button type="button" aria-label="Delete spend entry" className="text-[#64718a] hover:text-red-700" onClick={() => { if (window.confirm('Delete this spend entry?')) post({ action: 'spend_delete', id: s.id }, 'Spend entry deleted.'); }}><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function GoalsPanel({ data, post }: { data: FinanceResponse; post: Post }) {
  const annual = data.goals.find((g) => g.period === String(data.year));
  const [revenue, setRevenue] = useState(annual ? String(annual.revenueTargetPesewas / 100) : '');
  const [clients, setClients] = useState(annual?.clientsTarget != null ? String(annual.clientsTarget) : '');
  const monthly = useMemo(() => {
    const m: Record<string, number> = {};
    for (const g of data.goals) if (g.period.length === 7) m[g.period] = g.revenueTargetPesewas;
    return m;
  }, [data.goals]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const defaultMonth = annual ? Math.round(annual.revenueTargetPesewas / 12) : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <section className="h-fit rounded-lg border border-white bg-white p-5 shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
        <h2 className="mb-1 text-lg font-extrabold text-[#102548]">{data.year} targets</h2>
        <p className="mb-4 text-sm text-[#64718a]">The Growth tab paces revenue against these. Months without an override get one twelfth of the annual target.</p>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); post({ action: 'goal', period: String(data.year), revenueCedis: Number(revenue), clientsTarget: clients === '' ? null : Number(clients) }, 'Annual target saved.'); }}>
          <Field label="Revenue target (GH₵)"><input type="number" min="0" className={inputCls} value={revenue} onChange={(e) => setRevenue(e.target.value)} /></Field>
          <Field label="New clients target" hint="Optional."><input type="number" min="0" className={inputCls} value={clients} onChange={(e) => setClients(e.target.value)} /></Field>
          <button type="submit" className={btnPrimary}>Save annual target</button>
        </form>
      </section>
      <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
        <SectionHeader title="Monthly targets" subtitle="Override for seasonality (e.g. intake season, January job push)" />
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {MONTHS.map((label, i) => {
            const period = `${data.year}-${String(i + 1).padStart(2, '0')}`;
            const current = monthly[period];
            const draft = drafts[period] ?? (current !== undefined ? String(current / 100) : '');
            return (
              <div key={period} className="rounded-lg border border-[#edf1f6] p-3">
                <p className="mb-1 text-sm font-bold text-[#102548]">{label}</p>
                <div className="flex gap-2">
                  <input type="number" min="0" aria-label={`${label} target in cedis`} placeholder={String(defaultMonth / 100)} className={inputCls} value={draft} onChange={(e) => setDrafts({ ...drafts, [period]: e.target.value })} />
                  <button type="button" className={btnGhost} onClick={() => draft === '' ? post({ action: 'goal_delete', period }, `${label} reset to default.`) : post({ action: 'goal', period, revenueCedis: Number(draft) }, `${label} target saved.`)}>Save</button>
                </div>
                <p className="mt-1 text-xs text-[#64718a]">{current !== undefined ? 'Override' : `Default ${cedis(defaultMonth)}`}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
