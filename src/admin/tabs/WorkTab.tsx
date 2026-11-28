import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AlarmClock, CheckCheck, ClipboardList, Plus, RefreshCw, Timer, UserX } from 'lucide-react';
import { api, errorMessage, isAuthError } from '../api';
import { ErrorBanner, MetricCard, SearchBox, dateOnly } from '../ui';
import { BOARD_COLUMNS, seesFinance, STATUS_LABELS } from '../ops-api';
import type { Client, Engagement, Role, WorkResponse } from '../ops-api';
import { ClientDrawer } from './ClientDrawer';
import { btnGhost, btnPrimary, Field, inputCls } from './FinanceTab';

export function WorkTab({ refreshKey, onAuthError, role }: { refreshKey: number; onAuthError: () => void; role?: Role }) {
  const senior = seesFinance(role);
  const [owner, setOwner] = useState(senior ? 'all' : 'me');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<WorkResponse | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState<{ clientId: number; engagementId?: number } | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ owner });
    api<WorkResponse>(`/api/admin-work.php?${params}`)
      .then((res) => { if (!cancelled) { setData(res); setError(''); } })
      .catch((e) => {
        if (cancelled) return;
        if (isAuthError(e)) return onAuthError();
        setError(errorMessage(e, 'Could not load the work board'));
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, refreshKey, reload]);

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const all = data?.items || [];
    if (!needle) return all;
    return all.filter((e) => [e.title, e.client?.name, e.client?.email, e.ownerName].some((x) => String(x || '').toLowerCase().includes(needle)));
  }, [data, query]);

  async function sync() {
    setError('');
    try {
      const res = await api<{ ok: boolean; purchases: number; created: number }>('/api/admin-work.php', { method: 'POST', body: JSON.stringify({ action: 'sync', days: 60 }) });
      setNotice(`Checked ${res.purchases} Paystack purchases from the last 60 days: ${res.created} new work item(s) created.`);
      setReload((r) => r + 1);
    } catch (e) {
      if (isAuthError(e)) onAuthError();
      setError(errorMessage(e, 'Sync failed'));
    }
  }

  const s = data?.summary;
  return (
    <>
      <ErrorBanner message={error} />
      {notice && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</div>}

      {s && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Open work items" value={Object.entries(s.byStatus).filter(([k]) => !['delivered', 'closed'].includes(k)).reduce((a, [, v]) => a + v, 0)} icon={ClipboardList} accent="blue" detail={`${s.byStatus.client_review || 0} with clients`} />
          <MetricCard label="Overdue" value={s.overdue} icon={AlarmClock} accent="amber" detail="past due date" />
          <MetricCard label="Unassigned" value={s.unassigned} icon={UserX} accent="purple" detail="need an owner" />
          <MetricCard label="Delivered (30 days)" value={s.deliveredLast30} icon={CheckCheck} accent="green" detail={s.avgTurnaroundDays != null ? `avg ${s.avgTurnaroundDays} days` : 'no turnaround yet'} />
        </div>
      )}

      {s && s.byOwner.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {s.byOwner.filter((o) => o.open > 0).map((o) => (
            <button key={String(o.ownerId)} type="button" onClick={() => setOwner(o.ownerId ? String(o.ownerId) : 'unassigned')} className="rounded-full border border-[#c8d6e5] bg-white px-3 py-1.5 text-xs font-semibold text-[#26334d] hover:border-[#0077B6]">
              <Timer className="mr-1 inline h-3.5 w-3.5" />{o.ownerId ? o.name : 'Unassigned'}: {o.open} open{o.overdue ? `, ${o.overdue} overdue` : ''}
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <SearchBox value={query} onChange={setQuery} placeholder="Search work, client or owner" />
          {senior && (
            <select aria-label="Owner filter" className="h-11 rounded-lg border border-[#c8d6e5] bg-white px-3 text-sm" value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="all">Everyone</option>
              <option value="me">My work</option>
              <option value="unassigned">Unassigned</option>
              {(data?.team || []).map((t) => <option key={t.id} value={String(t.id)}>{t.name || t.email}</option>)}
            </select>
          )}
        </div>
        {senior && (
          <div className="flex gap-2">
            <button type="button" className={btnGhost} onClick={sync} title="Create work items for recent Paystack purchases that do not have them yet"><RefreshCw className="h-4 w-4" />Sync purchases</button>
            <button type="button" className={btnPrimary} onClick={() => setAdding((a) => !a)}><Plus className="h-4 w-4" />Add work</button>
          </div>
        )}
      </div>

      {adding && data && <AddWork data={data} onDone={(clientId) => { setAdding(false); setReload((r) => r + 1); setOpen({ clientId }); }} onError={setError} onAuthError={onAuthError} />}

      <div className="flex gap-4 overflow-x-auto pb-4" role="list" aria-label="Work board columns">
        {BOARD_COLUMNS.map((col) => {
          const list = items.filter((e) => e.status === col);
          return (
            <section key={col} role="listitem" className="w-[260px] shrink-0 rounded-lg bg-[#e6edf5] p-3">
              <h3 className="mb-3 flex items-center justify-between text-sm font-extrabold text-[#102548]">
                {STATUS_LABELS[col]}<span className="rounded-full bg-white px-2 py-0.5 text-xs text-[#64718a]">{list.length}</span>
              </h3>
              <div className="space-y-2">
                {list.map((e) => <WorkCard key={e.id} eng={e} onOpen={() => e.client && setOpen({ clientId: e.client.id, engagementId: e.id })} />)}
                {list.length === 0 && <p className="px-1 text-xs text-[#64718a]">Nothing here.</p>}
              </div>
            </section>
          );
        })}
      </div>
      {col0Hint(data)}

      {open && data && (
        <ClientDrawer clientId={open.clientId} focusEngagementId={open.engagementId} team={data.team} role={role}
          onClose={() => setOpen(null)} onChanged={() => setReload((r) => r + 1)} onAuthError={onAuthError} />
      )}
    </>
  );
}

function col0Hint(data: WorkResponse | null) {
  if (!data || data.items.length > 0) return null;
  return <p className="mt-2 text-sm text-[#64718a]">New purchases (Paystack or offline sales) appear here automatically. Use “Sync purchases” once to pull in recent Paystack orders from before this board existed.</p>;
}

function WorkCard({ eng, onOpen }: { eng: Engagement; onOpen: () => void }) {
  const progress = eng.stepsTotal ? eng.stepsDone / eng.stepsTotal : 0;
  return (
    <button type="button" onClick={onOpen} className="block w-full rounded-lg border border-white bg-white p-3 text-left shadow-[0_6px_18px_rgba(16,37,72,0.08)] transition hover:border-[#0077B6]">
      <p className="text-sm font-bold leading-5 text-[#102548]">{eng.title}</p>
      <p className="mt-0.5 truncate text-xs text-[#64718a]">{eng.client?.name || eng.client?.email || 'Unknown client'}</p>
      <div className="mt-2 h-1.5 rounded-full bg-[#edf2f7]"><div className="h-1.5 rounded-full bg-[#0077B6]" style={{ width: `${progress * 100}%` }} /></div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-[#26334d]">{eng.ownerName || <span className="text-amber-700">Unassigned</span>}</span>
        {eng.dueOn && <span className={`shrink-0 ${eng.overdue ? 'font-bold text-red-700' : 'text-[#64718a]'}`}>{eng.overdue ? 'Overdue ' : 'Due '}{dateOnly(eng.dueOn)}</span>}
      </div>
    </button>
  );
}

function AddWork({ data, onDone, onError, onAuthError }: { data: WorkResponse; onDone: (clientId: number) => void; onError: (s: string) => void; onAuthError: () => void }) {
  const [f, setF] = useState({ email: '', name: '', title: '', family: 'custom', ownerId: '', dueOn: '' });
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    onError('');
    try {
      const found = await api<{ ok: boolean; items: Client[] }>(`/api/admin-clients.php?q=${encodeURIComponent(f.email.trim())}&limit=5`);
      let client = found.items.find((c) => c.email.toLowerCase() === f.email.trim().toLowerCase());
      if (!client) {
        const created = await api<{ ok: boolean; client: Client }>('/api/admin-clients.php', { method: 'POST', body: JSON.stringify({ action: 'create', email: f.email, name: f.name }) });
        client = created.client;
      }
      await api('/api/admin-work.php', { method: 'POST', body: JSON.stringify({ action: 'create', clientId: client.id, title: f.title, family: f.family, ownerId: f.ownerId ? Number(f.ownerId) : null, dueOn: f.dueOn }) });
      onDone(client.id);
    } catch (err) {
      if (isAuthError(err)) onAuthError();
      onError(errorMessage(err, 'Could not add work'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="mb-6 grid gap-3 rounded-lg border border-white bg-white p-4 shadow-[0_16px_45px_rgba(16,37,72,0.08)] md:grid-cols-3">
      <Field label="Client email *" hint="A new client record is created if needed."><input required type="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      <Field label="Client name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Work title *"><input required className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Extra cover letter (goodwill)" /></Field>
      <Field label="Type" hint="Sets the step checklist.">
        <select className={inputCls} value={f.family} onChange={(e) => setF({ ...f, family: e.target.value })}>
          {data.families.map((fam) => <option key={fam.id} value={fam.id}>{fam.label}</option>)}
        </select>
      </Field>
      <Field label="Owner">
        <select className={inputCls} value={f.ownerId} onChange={(e) => setF({ ...f, ownerId: e.target.value })}>
          <option value="">Unassigned</option>
          {data.team.map((t) => <option key={t.id} value={t.id}>{t.name || t.email}</option>)}
        </select>
      </Field>
      <Field label="Due"><input type="date" className={inputCls} value={f.dueOn} onChange={(e) => setF({ ...f, dueOn: e.target.value })} /></Field>
      <div className="md:col-span-3"><button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Adding...' : 'Add work item'}</button></div>
    </form>
  );
}
