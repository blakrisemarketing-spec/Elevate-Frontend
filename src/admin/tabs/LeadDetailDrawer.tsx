import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Download, ExternalLink, Link as LinkIcon, Mail, MessageCircle, Phone, Trash2, X } from 'lucide-react';
import { api, errorMessage, isAuthError, LEAD_STATUSES } from '../api';
import type { LeadDetailResponse, LeadItem, LeadNote, LeadStatus } from '../api';
import { Badge, ErrorBanner, answerText, dateShort, money } from '../ui';

type Props = {
  uid: string;
  onClose: () => void;
  onAuthError: () => void;
  onLeadPatch: (uid: string, patch: Partial<LeadItem>) => void;
};

function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-[#edf1f6] px-5 py-4">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#0077B6]">{title}</h3>
      {children}
    </section>
  );
}

function tierTone(tier?: string): 'green' | 'amber' | 'neutral' {
  if (tier === 'strong') return 'green';
  if (tier === 'stretch') return 'amber';
  return 'neutral';
}

const contactLinkClass = 'inline-flex items-center gap-2 rounded-lg border border-[#c8d6e5] px-3 py-2 text-xs font-bold text-[#0077B6] no-underline transition hover:border-[#0077B6]';

export function LeadDetailDrawer({ uid, onClose, onAuthError, onLeadPatch }: Props) {
  const [data, setData] = useState<LeadDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [suppressBusy, setSuppressBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setData(null);
    (async () => {
      try {
        const res = await api<LeadDetailResponse>(`/api/admin-lead.php?uid=${encodeURIComponent(uid)}`);
        if (!cancelled) setData(res);
      } catch (e) {
        if (cancelled) return;
        if (isAuthError(e)) {
          onAuthError();
          return;
        }
        setError(errorMessage(e, 'Could not load this lead'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function changeStatus(next: LeadStatus) {
    if (!data) return;
    const prev = data.lead.status;
    setData({ ...data, lead: { ...data.lead, status: next } });
    onLeadPatch(uid, { status: next });
    try {
      await api('/api/admin-lead.php', { method: 'POST', body: JSON.stringify({ uid, action: 'status', status: next }) });
    } catch (e) {
      if (isAuthError(e)) {
        onAuthError();
        return;
      }
      setData((cur) => (cur ? { ...cur, lead: { ...cur.lead, status: prev } } : cur));
      onLeadPatch(uid, { status: prev });
      setError(errorMessage(e, 'Could not update the status'));
    }
  }

  async function addNote() {
    if (!data || !noteBody.trim()) return;
    setSavingNote(true);
    setError('');
    try {
      const res = await api<{ ok: boolean; note: LeadNote }>('/api/admin-lead.php', {
        method: 'POST',
        body: JSON.stringify({ uid, action: 'note-add', body: noteBody.trim() }),
      });
      const nextNotes = [res.note, ...data.notes];
      setData({ ...data, notes: nextNotes });
      onLeadPatch(uid, { notesCount: nextNotes.length });
      setNoteBody('');
    } catch (e) {
      if (isAuthError(e)) {
        onAuthError();
        return;
      }
      setError(errorMessage(e, 'Could not save the note'));
    } finally {
      setSavingNote(false);
    }
  }

  async function deleteNote(noteId: LeadNote['id']) {
    if (!data) return;
    if (!window.confirm('Delete this note?')) return;
    setError('');
    try {
      await api('/api/admin-lead.php', { method: 'POST', body: JSON.stringify({ uid, action: 'note-delete', noteId }) });
      const nextNotes = data.notes.filter((n) => n.id !== noteId);
      setData({ ...data, notes: nextNotes });
      onLeadPatch(uid, { notesCount: nextNotes.length });
    } catch (e) {
      if (isAuthError(e)) {
        onAuthError();
        return;
      }
      setError(errorMessage(e, 'Could not delete the note'));
    }
  }

  async function toggleSuppression() {
    if (!data) return;
    const email = data.lead.email;
    if (!email) {
      setError('This lead has no email address on file.');
      return;
    }
    if (data.suppressed && data.suppressed.reason === 'unsubscribe' && !window.confirm('This lead unsubscribed themselves. Resume anyway?')) return;
    setSuppressBusy(true);
    setError('');
    try {
      const action = data.suppressed ? 'resume' : 'suppress';
      const res = await api<{ ok: boolean; suppressed: boolean }>('/api/admin-campaign.php', {
        method: 'POST',
        body: JSON.stringify({ action, email }),
      });
      const nowSuppressed = Boolean(res.suppressed);
      setData({ ...data, suppressed: nowSuppressed ? { email, reason: 'admin' } : null });
      onLeadPatch(uid, { suppressed: nowSuppressed });
    } catch (e) {
      if (isAuthError(e)) {
        onAuthError();
        return;
      }
      setError(errorMessage(e, 'Could not update email suppression'));
    } finally {
      setSuppressBusy(false);
    }
  }

  const lead = data?.lead;
  const waDigits = (lead?.phoneNormalized || lead?.phone || '').replace(/\D/g, '');
  const sortedNotes = data ? [...data.notes].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))) : [];
  const answers = lead?.answers || {};

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Lead details">
      <div className="absolute inset-0 bg-[#102548]/50" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto bg-white shadow-[0_24px_80px_rgba(16,37,72,0.35)]">
        <div className="sticky top-0 z-10 border-b border-[#edf1f6] bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-extrabold text-[#102548]">{lead?.name || 'Lead details'}</h2>
              <p className="truncate text-sm text-[#64718a]">
                {lead?.email || 'No email'}
                {lead?.phoneNormalized || lead?.phone ? ` · ${lead?.phoneNormalized || lead?.phone}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#c8d6e5] text-[#64718a] transition hover:border-[#0077B6] hover:text-[#0077B6]"
              aria-label="Close lead details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {lead && (
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]" htmlFor="lead-status">Status</label>
              <select
                id="lead-status"
                value={lead.status || 'new'}
                onChange={(e) => changeStatus(e.target.value as LeadStatus)}
                className="h-9 rounded-lg border border-[#c8d6e5] bg-white px-2 text-sm font-semibold text-[#26334d] outline-none transition focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20"
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="px-5 pt-4">
          <ErrorBanner message={error} />
        </div>

        {loading && <p className="px-5 py-8 text-center text-sm text-[#64718a]">Loading lead...</p>}

        {!loading && data && lead && (
          <>
            <DrawerSection title="Contact">
              <div className="flex flex-wrap gap-2">
                {lead.email && <a className={contactLinkClass} href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5" /> Email</a>}
                {(lead.phoneNormalized || lead.phone) && <a className={contactLinkClass} href={`tel:${lead.phoneNormalized || lead.phone}`}><Phone className="h-3.5 w-3.5" /> Call</a>}
                {waDigits && <a className={contactLinkClass} href={`https://wa.me/${waDigits}`} target="_blank" rel="noreferrer"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>}
                {lead.linkedin && <a className={contactLinkClass} href={lead.linkedin} target="_blank" rel="noreferrer"><LinkIcon className="h-3.5 w-3.5" /> LinkedIn</a>}
                {lead.portfolio && <a className={contactLinkClass} href={lead.portfolio} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /> Portfolio</a>}
                {(lead.cvUploaded || lead.cvFile) && lead.cvFile && (
                  <a className={contactLinkClass} href={`/api/admin-cv.php?file=${encodeURIComponent(lead.cvFile)}`} target="_blank" rel="noreferrer">
                    <Download className="h-3.5 w-3.5" /> Open CV
                  </a>
                )}
              </div>
            </DrawerSection>

            <DrawerSection title="Quiz answers">
              {Object.keys(answers).length === 0 ? (
                <p className="text-sm text-[#64718a]">No answers recorded.</p>
              ) : (
                <dl className="grid gap-2">
                  {Object.entries(answers).map(([key, value]) => (
                    <div key={key} className="grid gap-0.5 sm:grid-cols-[160px_1fr] sm:gap-3">
                      <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">{key.replace(/_/g, ' ')}</dt>
                      <dd className="text-sm text-[#26334d]">{answerText(value) || 'Not recorded'}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </DrawerSection>

            {(lead.utmSource || lead.utmMedium || lead.utmCampaign || lead.referrer) && (
              <DrawerSection title="Attribution">
                <dl className="grid gap-2">
                  {[
                    ['Source', lead.utmSource],
                    ['Medium', lead.utmMedium],
                    ['Campaign', lead.utmCampaign],
                    ['Referrer', lead.referrer],
                  ]
                    .filter(([, v]) => Boolean(v))
                    .map(([label, value]) => (
                      <div key={label} className="grid gap-0.5 sm:grid-cols-[160px_1fr] sm:gap-3">
                        <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">{label}</dt>
                        <dd className="break-words text-sm text-[#26334d]">{value}</dd>
                      </div>
                    ))}
                </dl>
              </DrawerSection>
            )}

            <DrawerSection title="Matches">
              {(lead.pathways?.length || 0) + (lead.scholarships?.length || 0) === 0 ? (
                <p className="text-sm text-[#64718a]">No matches recorded.</p>
              ) : (
                <div className="grid gap-4">
                  {(lead.pathways?.length || 0) > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-[#64718a]">Pathways</p>
                      <ul className="grid gap-2">
                        {(lead.pathways || []).map((p) => (
                          <li key={p.id} className="flex items-center justify-between gap-3 text-sm text-[#26334d]">
                            <span className="font-semibold text-[#102548]">{p.name}</span>
                            {p.tier && <span className="text-xs font-bold"><Badge tone={tierTone(p.tier)}>{p.tier}</Badge></span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(lead.scholarships?.length || 0) > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-[#64718a]">Scholarships</p>
                      <ul className="grid gap-2">
                        {(lead.scholarships || []).map((s) => (
                          <li key={s.id} className="flex items-center justify-between gap-3 text-sm text-[#26334d]">
                            <span className="font-semibold text-[#102548]">{s.name}</span>
                            {s.tier && <span className="text-xs font-bold"><Badge tone={tierTone(s.tier)}>{s.tier}</Badge></span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </DrawerSection>

            <DrawerSection title="Campaign timeline">
              {data.suppressed ? (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-sm font-medium text-amber-800">Emails paused: {data.suppressed.reason}</p>
                  <button
                    type="button"
                    className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-bold text-amber-800 transition hover:border-amber-500 disabled:opacity-50"
                    onClick={toggleSuppression}
                    disabled={suppressBusy}
                  >
                    {suppressBusy ? 'Resuming...' : 'Resume'}
                  </button>
                </div>
              ) : (
                data.campaignEnrolled && (
                  <div className="mb-3">
                    <button
                      type="button"
                      className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-[#c8d6e5] bg-white px-3 py-1 text-xs font-bold text-[#102548] transition hover:border-[#0077B6] hover:text-[#0077B6] disabled:opacity-50"
                      onClick={toggleSuppression}
                      disabled={suppressBusy}
                    >
                      {suppressBusy ? 'Pausing...' : 'Pause emails'}
                    </button>
                  </div>
                )
              )}
              {!data.campaignEnrolled ? (
                <p className="text-sm text-[#64718a]">Not enrolled in the email sequence.</p>
              ) : data.timeline.length === 0 ? (
                <p className="text-sm text-[#64718a]">No campaign steps recorded yet.</p>
              ) : (
                <ul className="grid gap-3">
                  {data.timeline.map((t) => (
                    <li key={t.step} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 text-base leading-none ${t.status === 'sent' ? 'text-emerald-600' : t.status === 'skipped' ? 'text-[#9aa5b7]' : 'text-[#c3ccda]'}`}
                        aria-hidden="true"
                      >
                        {t.status === 'sent' ? '✓' : t.status === 'skipped' ? '○' : '◌'}
                      </span>
                      <div>
                        <p className="text-sm font-bold uppercase text-[#102548]">{t.step}</p>
                        <p className="text-xs text-[#64718a]">
                          {t.status === 'sent' ? `Sent ${dateShort(t.sentAt)}` : t.status === 'skipped' ? 'Skipped' : `Due ${dateShort(t.dueAt)}`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </DrawerSection>

            <DrawerSection title="Purchases">
              {data.purchases.length === 0 ? (
                <p className="text-sm text-[#64718a]">No purchases yet.</p>
              ) : (
                <ul className="grid gap-2">
                  {data.purchases.map((p, i) => (
                    <li key={`${p.reference || 'purchase'}-${i}`} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-[#102548]">{p.itemName || p.serviceId || 'Unknown item'}</span>
                      <span className="whitespace-nowrap text-[#64718a]">{money(p.amountPesewas)} · {dateShort(p.ts)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </DrawerSection>

            <DrawerSection title="Notes">
              {sortedNotes.length === 0 ? (
                <p className="mb-3 text-sm text-[#64718a]">No notes yet.</p>
              ) : (
                <ul className="mb-4 grid gap-3">
                  {sortedNotes.map((n) => (
                    <li key={n.id} className="rounded-lg bg-[#f6f8fb] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-[#26334d]">{n.body}</p>
                        <button
                          type="button"
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[#9aa5b7] transition hover:bg-red-50 hover:text-red-600"
                          onClick={() => deleteNote(n.id)}
                          aria-label="Delete note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-[#9aa5b7]">{dateShort(n.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={3}
                placeholder="Add a note about this lead"
                className="mb-2 w-full rounded-lg border border-[#c8d6e5] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20"
              />
              <button
                type="button"
                className="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-[#102548] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#173661] disabled:opacity-50"
                onClick={addNote}
                disabled={savingNote || !noteBody.trim()}
              >
                {savingNote ? 'Saving...' : 'Add note'}
              </button>
            </DrawerSection>
          </>
        )}
      </aside>
    </div>
  );
}
