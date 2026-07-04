import { useEffect, useRef, useState } from 'react';
import { Bookmark, Check, ChevronRight, Download, StickyNote, UsersRound, X } from 'lucide-react';
import { api, errorMessage, isAuthError, LEAD_STATUSES } from '../api';
import type { BulkStatusResponse, BulkSuppressResponse, LeadItem, LeadsResponse, LeadStatus, SavedView, ViewsResponse, ViewSaveResponse } from '../api';
import { Badge, EmptyState, ErrorBanner, SearchBox, SectionHeader, StatusPill, answerText, dateShort } from '../ui';
import { LeadDetailDrawer } from './LeadDetailDrawer';

const LIMIT = 50;

export function LeadsTab({ refreshKey, onAuthError }: { refreshKey: number; onAuthError: () => void }) {
  const [items, setItems] = useState<LeadItem[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('');
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [openUid, setOpenUid] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [views, setViews] = useState<SavedView[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const viewsMenu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (debounced) params.set('q', debounced);
        if (status) params.set('status', status);
        params.set('limit', String(LIMIT));
        params.set('offset', String(offset));
        const res = await api<LeadsResponse>(`/api/admin-leads.php?${params.toString()}`);
        if (!cancelled) {
          setItems(res.items || []);
          setTotal(res.total || 0);
          setSelected(new Set());
        }
      } catch (e) {
        if (cancelled) return;
        if (isAuthError(e)) {
          onAuthError();
          return;
        }
        setError(errorMessage(e, 'Could not load leads'));
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, status, offset, refreshKey, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<ViewsResponse>('/api/admin-views.php');
        if (!cancelled) setViews(res.views || []);
      } catch (e) {
        if (isAuthError(e)) onAuthError();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function patchLead(uid: string, patch: Partial<LeadItem>) {
    setItems((prev) => prev.map((l) => (l.uid === uid ? { ...l, ...patch } : l)));
  }

  function toggleOne(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  const allOnPageSelected = items.length > 0 && items.every((l) => selected.has(l.uid));
  function toggleAllOnPage() {
    setSelected((prev) => {
      if (allOnPageSelected) {
        const next = new Set(prev);
        items.forEach((l) => next.delete(l.uid));
        return next;
      }
      const next = new Set(prev);
      items.forEach((l) => next.add(l.uid));
      return next;
    });
  }

  async function runBulk(fn: () => Promise<void>) {
    setBulkBusy(true);
    setError('');
    try {
      await fn();
      setReloadKey((k) => k + 1);
    } catch (e) {
      if (isAuthError(e)) {
        onAuthError();
        return;
      }
      setError(errorMessage(e, 'Bulk action failed'));
    } finally {
      setBulkBusy(false);
    }
  }

  function bulkStatus(next: LeadStatus) {
    const uids = [...selected];
    if (uids.length === 0) return;
    void runBulk(async () => {
      await api<BulkStatusResponse>('/api/admin-leads-bulk.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'status', uids, status: next }),
      });
    });
  }

  function bulkSuppress(action: 'suppress' | 'unsuppress') {
    const uids = [...selected];
    if (uids.length === 0) return;
    void runBulk(async () => {
      await api<BulkSuppressResponse>('/api/admin-leads-bulk.php', {
        method: 'POST',
        body: JSON.stringify({ action, uids }),
      });
    });
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (debounced) params.set('q', debounced);
    if (status) params.set('status', status);
    window.location.href = `/api/admin-export.php?${params.toString()}`;
  }

  function applyView(view: SavedView) {
    setQuery(view.filter.q || '');
    setDebounced(view.filter.q || '');
    setStatus(view.filter.status || '');
    setOffset(0);
    if (viewsMenu.current) viewsMenu.current.open = false;
  }

  async function saveView() {
    const name = window.prompt('Name this view');
    if (!name || !name.trim()) return;
    setError('');
    try {
      const res = await api<ViewSaveResponse>('/api/admin-views.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'save', name: name.trim(), filter: { q: debounced, status } }),
      });
      setViews((prev) => [...prev, res.view]);
    } catch (e) {
      if (isAuthError(e)) {
        onAuthError();
        return;
      }
      setError(errorMessage(e, 'Could not save view'));
    }
  }

  async function deleteView(id: number) {
    setError('');
    try {
      await api('/api/admin-views.php', { method: 'POST', body: JSON.stringify({ action: 'delete', id }) });
      setViews((prev) => prev.filter((v) => v.id !== id));
    } catch (e) {
      if (isAuthError(e)) {
        onAuthError();
        return;
      }
      setError(errorMessage(e, 'Could not delete view'));
    }
  }

  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + LIMIT, total);
  const selectedCount = selected.size;

  return (
    <>
      <ErrorBanner message={error} />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBox value={query} onChange={setQuery} placeholder="Search leads" />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setOffset(0);
            }}
            className="h-11 rounded-lg border border-[#c8d6e5] bg-white px-3 text-sm font-medium text-[#26334d] outline-none transition focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <details ref={viewsMenu} className="relative">
            <summary className="inline-flex h-11 cursor-pointer list-none items-center gap-2 rounded-lg border border-[#c8d6e5] bg-white px-4 text-sm font-semibold text-[#102548] transition hover:border-[#0077B6] hover:text-[#0077B6] [&::-webkit-details-marker]:hidden">
              <Bookmark className="h-4 w-4" /> Views
            </summary>
            <div className="absolute left-0 z-20 mt-1 w-64 rounded-lg border border-[#e2e8f2] bg-white p-2 shadow-[0_16px_45px_rgba(16,37,72,0.16)]">
              {views.length === 0 ? (
                <p className="px-2 py-2 text-xs text-[#64718a]">No saved views yet.</p>
              ) : (
                <ul className="mb-1 grid gap-0.5">
                  {views.map((v) => (
                    <li key={v.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm font-medium text-[#26334d] transition hover:bg-[#f2f5f9]"
                        onClick={() => applyView(v)}
                      >
                        {v.name}
                      </button>
                      <button
                        type="button"
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[#9aa5b7] transition hover:bg-red-50 hover:text-red-600"
                        onClick={() => deleteView(v.id)}
                        aria-label={`Delete view ${v.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="w-full rounded-md border border-[#c8d6e5] px-2 py-1.5 text-sm font-semibold text-[#0077B6] transition hover:border-[#0077B6]"
                onClick={saveView}
              >
                Save current view
              </button>
            </div>
          </details>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#c8d6e5] bg-white px-4 text-sm font-semibold text-[#102548] transition hover:border-[#0077B6] hover:text-[#0077B6]"
            onClick={exportCsv}
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
        <p className="whitespace-nowrap text-sm text-[#64718a]">{busy ? 'Syncing data...' : `${total.toLocaleString()} matching leads`}</p>
      </div>

      {selectedCount > 0 && (
        <div className="sticky top-2 z-30 mb-4 flex flex-col gap-3 rounded-lg border border-[#3FA9F5] bg-[#102548] px-4 py-3 text-white shadow-[0_16px_45px_rgba(16,37,72,0.28)] md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-bold">{selectedCount} selected</p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              defaultValue=""
              disabled={bulkBusy}
              onChange={(e) => {
                if (e.target.value) bulkStatus(e.target.value as LeadStatus);
                e.target.value = '';
              }}
              className="h-9 rounded-lg border border-white/20 bg-white px-2 text-sm font-semibold text-[#26334d] outline-none disabled:opacity-50"
              aria-label="Set status for selected leads"
            >
              <option value="" disabled>Set status...</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
              onClick={() => bulkSuppress('suppress')}
              disabled={bulkBusy}
            >
              Pause emails
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
              onClick={() => bulkSuppress('unsuppress')}
              disabled={bulkBusy}
            >
              Resume emails
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold text-white/70 transition hover:text-white disabled:opacity-50"
              onClick={() => setSelected(new Set())}
              disabled={bulkBusy}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
        <SectionHeader title="Grad School Match leads" subtitle={total > 0 ? `Showing ${from} to ${to} of ${total.toLocaleString()}` : 'No matching records'} />
        {items.length === 0 ? (
          <EmptyState icon={UsersRound} title="No leads in this view" body="Submitted quiz leads will appear here with contact details, status, and CV links." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-sm">
              <thead className="bg-[#f6f8fb] text-left text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">
                <tr>
                  <th className="px-5 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-[#0077B6]"
                      checked={allOnPageSelected}
                      onChange={toggleAllOnPage}
                      aria-label="Select all leads on this page"
                    />
                  </th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Lead</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Goal</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Campaign</th>
                  <th className="px-5 py-3">Converted</th>
                  <th className="px-5 py-3">CV</th>
                  <th className="px-5 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f6]">
                {items.map((l) => (
                  <tr key={l.uid} className="cursor-pointer hover:bg-[#f9fbfd]" onClick={() => setOpenUid(l.uid)}>
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer accent-[#0077B6]"
                        checked={selected.has(l.uid)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleOne(l.uid)}
                        aria-label={`Select ${l.name || 'lead'}`}
                      />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-[#64718a]">{dateShort(l.createdAt || l.ts)}</td>
                    <td className="px-5 py-4">
                      <strong className="text-[#102548]">{l.name || 'Unknown'}</strong>
                      {(l.notesCount || 0) > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 align-middle text-xs font-semibold text-[#64718a]">
                          <StickyNote className="h-3.5 w-3.5" />
                          {l.notesCount}
                        </span>
                      )}
                      <br />
                      <span className="text-[#64718a]">{l.email || 'No email'}</span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-[#26334d]">{l.phoneNormalized || l.phone || 'No phone'}</td>
                    <td className="px-5 py-4 text-[#26334d]">{answerText(l.answers?.reason) || 'Not recorded'}</td>
                    <td className="px-5 py-4"><StatusPill status={l.status} /></td>
                    <td className="px-5 py-4">
                      {l.lastStep ? <span className="text-xs font-bold"><Badge tone="blue">{l.lastStep}</Badge></span> : <span className="text-[#9aa5b7]">None</span>}
                      {l.suppressed && <span className="ml-2 text-xs font-semibold text-[#9aa5b7]">suppressed</span>}
                    </td>
                    <td className="px-5 py-4">
                      {l.converted ? <Check className="h-4 w-4 text-emerald-600" aria-label="Converted" /> : <span className="text-[#9aa5b7]" aria-hidden="true"></span>}
                    </td>
                    <td className="px-5 py-4">
                      {l.cvFile ? (
                        <a
                          className="inline-flex items-center gap-2 rounded-lg border border-[#c8d6e5] px-3 py-2 text-xs font-bold text-[#0077B6] no-underline hover:border-[#0077B6]"
                          href={`/api/admin-cv.php?file=${encodeURIComponent(l.cvFile)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="h-3.5 w-3.5" /> Open CV
                        </a>
                      ) : (
                        <span className="text-[#9aa5b7]">None</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right"><ChevronRight className="h-4 w-4 text-[#9aa5b7]" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > LIMIT && (
          <div className="flex flex-col gap-3 border-t border-[#edf1f6] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#64718a]">Showing {from} to {to} of {total.toLocaleString()}</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[#c8d6e5] bg-white px-4 py-1.5 text-sm font-semibold text-[#102548] transition hover:border-[#0077B6] hover:text-[#0077B6] disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                disabled={busy || offset === 0}
              >
                Previous
              </button>
              <button
                type="button"
                className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[#c8d6e5] bg-white px-4 py-1.5 text-sm font-semibold text-[#102548] transition hover:border-[#0077B6] hover:text-[#0077B6] disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => setOffset(offset + LIMIT)}
                disabled={busy || offset + LIMIT >= total}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {openUid && <LeadDetailDrawer uid={openUid} onClose={() => setOpenUid(null)} onAuthError={onAuthError} onLeadPatch={patchLead} />}
    </>
  );
}
