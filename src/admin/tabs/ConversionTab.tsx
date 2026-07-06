import { useCallback, useEffect, useState } from 'react';
import { CircleCheck, KanbanSquare, Mail, MessageCircle, Phone, RefreshCw, StickyNote } from 'lucide-react';
import { api, errorMessage, isAuthError } from '../api';
import type { LeadItem, LeadsResponse, LeadStatus } from '../api';
import { ErrorBanner, SearchBox, answerText } from '../ui';
import { LeadDetailDrawer } from './LeadDetailDrawer';

const COLUMN_LIMIT = 100;

type ColumnKey = 'unconverted' | 'contacted' | 'converted' | 'lost';

type ColumnConfig = {
  key: ColumnKey;
  label: string;
  tone: 'blue' | 'amber' | 'green' | 'gray';
};

const COLUMNS: ColumnConfig[] = [
  { key: 'unconverted', label: 'Unconverted', tone: 'blue' },
  { key: 'contacted', label: 'Contacted', tone: 'amber' },
  { key: 'converted', label: 'Converted', tone: 'green' },
  { key: 'lost', label: 'Lost', tone: 'gray' },
];

const headerTone: Record<ColumnConfig['tone'], string> = {
  blue: 'bg-[#e7f4ff] text-[#0077B6]',
  amber: 'bg-amber-100 text-amber-800',
  green: 'bg-emerald-100 text-emerald-700',
  gray: 'bg-[#edf2f7] text-[#64718a]',
};

const countTone: Record<ColumnConfig['tone'], string> = {
  blue: 'bg-[#0077B6] text-white',
  amber: 'bg-amber-500 text-white',
  green: 'bg-emerald-600 text-white',
  gray: 'bg-[#64718a] text-white',
};

type ColumnData = { items: LeadItem[]; total: number };

type BoardState = Record<ColumnKey, ColumnData>;

const emptyBoard: BoardState = {
  unconverted: { items: [], total: 0 },
  contacted: { items: [], total: 0 },
  converted: { items: [], total: 0 },
  lost: { items: [], total: 0 },
};

async function fetchColumn(status: LeadStatus): Promise<LeadsResponse> {
  const params = new URLSearchParams();
  params.set('status', status);
  params.set('limit', String(COLUMN_LIMIT));
  return api<LeadsResponse>(`/api/admin-leads.php?${params.toString()}`);
}

function sortByCreatedDesc(items: LeadItem[]): LeadItem[] {
  return [...items].sort((a, b) => String(b.createdAt || b.ts || '').localeCompare(String(a.createdAt || a.ts || '')));
}

function matchesQuery(lead: LeadItem, q: string): boolean {
  if (!q) return true;
  const goal = answerText(lead.answers?.reason);
  const haystack = [lead.name, lead.email, lead.phone, lead.phoneNormalized, goal, lead.lastNote]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export function ConversionTab({ refreshKey, onAuthError }: { refreshKey: number; onAuthError: () => void }) {
  const [board, setBoard] = useState<BoardState>(emptyBoard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [openUid, setOpenUid] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [moving, setMoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [newRes, contactedRes, interestedRes, convertedRes, lostRes] = await Promise.all([
        fetchColumn('new'),
        fetchColumn('contacted'),
        fetchColumn('interested'),
        fetchColumn('converted'),
        fetchColumn('lost'),
      ]);
      const contactedItems = sortByCreatedDesc([...(contactedRes.items || []), ...(interestedRes.items || [])]);
      setBoard({
        unconverted: { items: newRes.items || [], total: newRes.total || 0 },
        contacted: { items: contactedItems, total: (contactedRes.total || 0) + (interestedRes.total || 0) },
        converted: { items: convertedRes.items || [], total: convertedRes.total || 0 },
        lost: { items: lostRes.items || [], total: lostRes.total || 0 },
      });
    } catch (e) {
      if (isAuthError(e)) {
        onAuthError();
        return;
      }
      setError(errorMessage(e, 'Could not load the pipeline'));
    } finally {
      setLoading(false);
    }
  }, [onAuthError]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, reloadKey]);

  function refetch() {
    setReloadKey((k) => k + 1);
  }

  async function moveLead(uid: string, status: LeadStatus) {
    setMoving(uid);
    setError('');
    try {
      await api('/api/admin-lead.php', { method: 'POST', body: JSON.stringify({ uid, action: 'status', status }) });
      refetch();
    } catch (e) {
      if (isAuthError(e)) {
        onAuthError();
        return;
      }
      setError(errorMessage(e, 'Could not move the lead'));
    } finally {
      setMoving(null);
    }
  }

  const q = query.trim().toLowerCase();

  return (
    <>
      <ErrorBanner message={error} />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[#102548]">Lead conversion</h2>
          <p className="text-sm text-[#64718a]">Work the pipeline. Call, log the outcome, and move each lead along.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <SearchBox value={query} onChange={setQuery} placeholder="Search name, phone, goal..." />
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#c8d6e5] bg-white px-4 text-sm font-semibold text-[#102548] transition hover:border-[#0077B6] hover:text-[#0077B6]"
            onClick={refetch}
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-full gap-4">
          {COLUMNS.map((col) => {
            const data = board[col.key];
            const filtered = data.items.filter((l) => matchesQuery(l, q));
            return (
              <div key={col.key} className="flex min-h-[240px] w-[300px] shrink-0 flex-col rounded-lg border border-white bg-[#f6f8fb] shadow-[0_10px_30px_rgba(16,37,72,0.06)]">
                <div className={`flex items-center justify-between rounded-t-lg px-4 py-3 ${headerTone[col.tone]}`}>
                  <span className="text-sm font-extrabold">{col.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${countTone[col.tone]}`}>{data.total.toLocaleString()}</span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-3">
                  {loading && data.items.length === 0 ? (
                    <p className="px-1 py-6 text-center text-xs text-[#9aa5b7]">Loading...</p>
                  ) : filtered.length === 0 ? (
                    <p className="px-1 py-6 text-center text-xs text-[#9aa5b7]">
                      {q ? 'No matching leads.' : 'No leads here yet.'}
                    </p>
                  ) : (
                    filtered.map((lead) => (
                      <LeadCard
                        key={lead.uid}
                        lead={lead}
                        column={col.key}
                        moving={moving === lead.uid}
                        onMove={moveLead}
                        onOpen={() => setOpenUid(lead.uid)}
                      />
                    ))
                  )}
                  {!loading && !q && data.total > data.items.length && (
                    <p className="px-1 pt-1 text-center text-xs text-[#9aa5b7]">
                      +{(data.total - data.items.length).toLocaleString()} more. Use the Leads tab to see all.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {openUid && (
        <LeadDetailDrawer
          uid={openUid}
          onClose={() => {
            setOpenUid(null);
            refetch();
          }}
          onAuthError={onAuthError}
          onLeadPatch={() => refetch()}
        />
      )}
    </>
  );
}

type MoveButton = { label: string; status: LeadStatus; kind: 'primary' | 'danger' | 'neutral' };

function moveButtonsFor(column: ColumnKey): MoveButton[] {
  switch (column) {
    case 'unconverted':
      return [
        { label: 'Contacted', status: 'contacted', kind: 'primary' },
        { label: 'Lost', status: 'lost', kind: 'danger' },
      ];
    case 'contacted':
      return [
        { label: 'Converted', status: 'converted', kind: 'primary' },
        { label: 'Lost', status: 'lost', kind: 'danger' },
      ];
    case 'lost':
      return [{ label: 'Reopen', status: 'new', kind: 'neutral' }];
    default:
      return [];
  }
}

const moveButtonClass: Record<MoveButton['kind'], string> = {
  primary: 'border-[#0077B6] text-[#0077B6] hover:bg-[#0077B6] hover:text-white',
  danger: 'border-[#e3b3b3] text-red-600 hover:bg-red-600 hover:text-white',
  neutral: 'border-[#c8d6e5] text-[#102548] hover:border-[#0077B6] hover:text-[#0077B6]',
};

function LeadCard({
  lead,
  column,
  moving,
  onMove,
  onOpen,
}: {
  lead: LeadItem;
  column: ColumnKey;
  moving: boolean;
  onMove: (uid: string, status: LeadStatus) => void;
  onOpen: () => void;
}) {
  const goal = answerText(lead.answers?.reason);
  const phone = lead.phoneNormalized || lead.phone || '';
  const waDigits = phone.replace(/\D/g, '');
  const buttons = moveButtonsFor(column);
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer rounded-lg border border-[#e2e8f2] bg-white p-3 text-left shadow-[0_2px_8px_rgba(16,37,72,0.04)] transition hover:border-[#0077B6] hover:shadow-[0_8px_24px_rgba(16,37,72,0.12)]"
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <strong className="min-w-0 break-words text-sm font-bold text-[#102548]">{lead.name || 'Unknown'}</strong>
        {column === 'converted' && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            <CircleCheck className="h-3 w-3" /> Customer
          </span>
        )}
      </div>

      {goal && (
        <span className="mb-2 inline-block rounded-full bg-[#eef4fa] px-2 py-0.5 text-[11px] font-semibold text-[#0077B6]">{goal}</span>
      )}

      <div className="mb-2">
        <p className="font-mono text-sm font-bold text-[#26334d]">{phone || 'No phone'}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {phone && (
            <a
              href={`tel:${phone}`}
              onClick={stop}
              className="inline-flex items-center gap-1 rounded-md border border-[#c8d6e5] px-2 py-1 text-[11px] font-bold text-[#0077B6] no-underline transition hover:border-[#0077B6]"
            >
              <Phone className="h-3 w-3" /> Call
            </a>
          )}
          {waDigits && (
            <a
              href={`https://wa.me/${waDigits}`}
              target="_blank"
              rel="noreferrer"
              onClick={stop}
              className="inline-flex items-center gap-1 rounded-md border border-[#c8d6e5] px-2 py-1 text-[11px] font-bold text-emerald-700 no-underline transition hover:border-emerald-600"
            >
              <MessageCircle className="h-3 w-3" /> WhatsApp
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              onClick={stop}
              className="inline-flex items-center gap-1 rounded-md border border-[#c8d6e5] px-2 py-1 text-[11px] font-bold text-[#64718a] no-underline transition hover:border-[#0077B6] hover:text-[#0077B6]"
            >
              <Mail className="h-3 w-3" /> Email
            </a>
          )}
        </div>
      </div>

      {lead.lastNote && (
        <p className="mb-2 border-l-2 border-[#dbe4f0] pl-2 text-xs italic leading-5 text-[#64718a]">"{lead.lastNote}"</p>
      )}

      {(lead.notesCount || 0) > 0 && (
        <p className="mb-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#9aa5b7]">
          <StickyNote className="h-3 w-3" /> {lead.notesCount} {lead.notesCount === 1 ? 'note' : 'notes'}
        </p>
      )}

      {buttons.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {buttons.map((b) => (
            <button
              key={b.status}
              type="button"
              disabled={moving}
              onClick={(e) => {
                stop(e);
                onMove(lead.uid, b.status);
              }}
              className={`inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50 ${moveButtonClass[b.kind]}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
