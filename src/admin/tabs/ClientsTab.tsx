import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Contact, Plus } from 'lucide-react';
import { api, errorMessage, isAuthError } from '../api';
import { EmptyState, ErrorBanner, SearchBox, SectionHeader, dateOnly } from '../ui';
import { cedis, channelLabel, seesFinance } from '../ops-api';
import type { Client, ClientsResponse, Role, TeamMember, WorkResponse } from '../ops-api';
import { ClientDrawer } from './ClientDrawer';
import { btnGhost, btnPrimary, Field, inputCls } from './FinanceTab';

export function ClientsTab({ refreshKey, onAuthError, role }: { refreshKey: number; onAuthError: () => void; role?: Role }) {
  const senior = seesFinance(role);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Client[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      api<ClientsResponse>(`/api/admin-clients.php?q=${encodeURIComponent(query)}&offset=${offset}&limit=50`)
        .then((res) => {
          if (cancelled) return;
          setItems((prev) => (offset === 0 ? res.items : [...prev, ...res.items]));
          setHasMore(res.hasMore);
          setChannels(res.channels);
          setError('');
        })
        .catch((e) => {
          if (cancelled) return;
          if (isAuthError(e)) return onAuthError();
          setError(errorMessage(e, 'Could not load clients'));
        });
    }, query ? 250 : 0);
    return () => { cancelled = true; window.clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, offset, refreshKey, reload]);

  useEffect(() => {
    api<WorkResponse>('/api/admin-work.php?owner=me').then((res) => setTeam(res.team)).catch(() => undefined);
  }, []);

  return (
    <>
      <ErrorBanner message={error} />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchBox value={query} onChange={(v) => { setQuery(v); setOffset(0); }} placeholder="Search name, email or phone" />
        {senior && <button type="button" className={btnPrimary} onClick={() => setAdding((a) => !a)}><Plus className="h-4 w-4" />New client</button>}
      </div>
      {adding && <NewClient channels={channels} onCreated={(id) => { setAdding(false); setOffset(0); setReload((r) => r + 1); setOpenId(id); }} onError={setError} />}

      <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
        <SectionHeader title="Clients" subtitle={senior ? 'Everyone who has bought from Elevate' : 'Clients with work assigned to you'} />
        {items.length === 0 ? (
          <EmptyState icon={Contact} title="No clients yet" body="Buyers become clients automatically on a verified Paystack payment or a recorded offline sale." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[#f6f8fb] text-left text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">
                <tr><th className="px-5 py-3">Client</th><th className="px-3 py-3">Channel</th><th className="px-3 py-3">Open work</th>{senior && <th className="px-3 py-3">Lifetime revenue</th>}<th className="px-3 py-3">Portal</th><th className="px-3 py-3">Since</th></tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f6]">
                {items.map((c) => (
                  <tr key={c.id} className="cursor-pointer hover:bg-[#f9fbfd]" onClick={() => setOpenId(c.id)}>
                    <td className="px-5 py-3"><strong className="text-[#102548]">{c.name || 'No name'}</strong><br /><span className="text-[#64718a]">{c.email}</span></td>
                    <td className="px-3 py-3">{channelLabel(c.acquisitionChannel)}</td>
                    <td className="px-3 py-3">{c.openWork ? <span className="rounded-full bg-[#e7f4ff] px-2.5 py-1 text-xs font-bold text-[#0077B6]">{c.openWork} open</span> : <span className="text-[#9aa5b7]">None</span>}</td>
                    {senior && <td className="px-3 py-3 font-bold">{cedis(c.revenuePesewas || 0)}</td>}
                    <td className="px-3 py-3 text-xs">{c.hasPassword || c.hasGoogle ? <span className="text-emerald-700">Active</span> : <span className="text-[#64718a]">Not set up</span>}</td>
                    <td className="px-3 py-3 text-[#64718a]">{dateOnly(c.firstPurchaseAt || c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && <div className="p-4 text-center"><button type="button" className={btnGhost} onClick={() => setOffset((o) => o + 50)}>Load more</button></div>}
          </div>
        )}
      </section>

      {openId !== null && (
        <ClientDrawer clientId={openId} team={team} role={role} onClose={() => setOpenId(null)}
          onChanged={() => { setOffset(0); setReload((r) => r + 1); }} onAuthError={onAuthError} />
      )}
    </>
  );
}

function NewClient({ channels, onCreated, onError }: { channels: string[]; onCreated: (id: number) => void; onError: (s: string) => void }) {
  const [f, setF] = useState({ email: '', name: '', phone: '', channel: 'direct' });
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await api<{ ok: boolean; client: Client }>('/api/admin-clients.php', { method: 'POST', body: JSON.stringify({ action: 'create', ...f }) });
      onCreated(res.client.id);
    } catch (err) {
      onError(errorMessage(err, 'Could not create client'));
    }
  }
  return (
    <form onSubmit={submit} className="mb-6 grid gap-3 rounded-lg border border-white bg-white p-4 shadow-[0_16px_45px_rgba(16,37,72,0.08)] md:grid-cols-4">
      <Field label="Email *"><input required type="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      <Field label="Name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Phone"><input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
      <Field label="Came from">
        <select className={inputCls} value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })}>
          {channels.map((c) => <option key={c} value={c}>{channelLabel(c)}</option>)}
        </select>
      </Field>
      <div className="md:col-span-4"><button type="submit" className={btnPrimary}>Create client</button></div>
    </form>
  );
}
