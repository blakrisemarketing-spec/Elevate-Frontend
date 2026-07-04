import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Eye, Send } from 'lucide-react';
import { api, errorMessage, isAuthError, LEAD_STATUSES } from '../api';
import type { BroadcastHistoryItem, BroadcastHistoryResponse, BroadcastPreviewResponse, BroadcastSendResponse } from '../api';
import { Badge, EmptyState, ErrorBanner, SearchBox, SectionHeader, dateShort } from '../ui';

function PanelCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
      <div className="flex flex-col gap-1 border-b border-[#edf1f6] px-5 py-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-extrabold text-[#102548]">{title}</h2>
        {subtitle && <p className="text-sm text-[#64718a]">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function MessagingTab({ refreshKey, onAuthError }: { refreshKey: number; onAuthError: () => void }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [previewBusy, setPreviewBusy] = useState(false);
  const [sendBusy, setSendBusy] = useState(false);
  const [preview, setPreview] = useState<BroadcastPreviewResponse | null>(null);
  const [result, setResult] = useState<BroadcastSendResponse | null>(null);
  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<BroadcastHistoryResponse>('/api/admin-broadcast.php');
        if (!cancelled) setHistory(res.history || []);
      } catch (e) {
        if (cancelled) return;
        if (isAuthError(e)) {
          onAuthError();
          return;
        }
        setError(errorMessage(e, 'Could not load broadcast history'));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, reloadKey]);

  async function runPreview() {
    setPreviewBusy(true);
    setError('');
    setResult(null);
    try {
      const res = await api<BroadcastPreviewResponse>('/api/admin-broadcast.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'preview', q: query.trim(), status }),
      });
      setPreview(res);
    } catch (e) {
      if (isAuthError(e)) {
        onAuthError();
        return;
      }
      setError(errorMessage(e, 'Could not preview recipients'));
    } finally {
      setPreviewBusy(false);
    }
  }

  async function sendBroadcast() {
    if (!preview) return;
    if (!subject.trim() || !body.trim()) return;
    if (!window.confirm(`Send this broadcast to ${preview.recipientCount.toLocaleString()} recipient(s)? Unsubscribed and suppressed leads are automatically skipped.`)) return;
    setSendBusy(true);
    setError('');
    try {
      const res = await api<BroadcastSendResponse>('/api/admin-broadcast.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'send', q: query.trim(), status, subject: subject.trim(), html: body }),
      });
      setResult(res);
      setPreview(null);
      setReloadKey((k) => k + 1);
    } catch (e) {
      if (isAuthError(e)) {
        onAuthError();
        return;
      }
      setError(errorMessage(e, 'Could not send the broadcast'));
    } finally {
      setSendBusy(false);
    }
  }

  const canSend = Boolean(preview) && subject.trim().length > 0 && body.trim().length > 0 && !sendBusy;

  return (
    <>
      <ErrorBanner message={error} />

      <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <PanelCard title="Compose broadcast" subtitle="Email a lead segment">
          <div className="grid gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">Segment</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SearchBox value={query} onChange={setQuery} placeholder="Filter leads (name, email...)" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-11 rounded-lg border border-[#c8d6e5] bg-white px-3 text-sm font-medium text-[#26334d] outline-none transition focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20"
                  aria-label="Filter by status"
                >
                  <option value="">All statuses</option>
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#c8d6e5] bg-white px-4 text-sm font-semibold text-[#102548] transition hover:border-[#0077B6] hover:text-[#0077B6] disabled:opacity-50"
                  onClick={runPreview}
                  disabled={previewBusy}
                >
                  <Eye className="h-4 w-4" /> {previewBusy ? 'Previewing...' : 'Preview recipients'}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]" htmlFor="broadcast-subject">Subject</label>
              <input
                id="broadcast-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-11 w-full rounded-lg border border-[#c8d6e5] bg-white px-3 text-sm outline-none transition focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20"
                placeholder="Subject line"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]" htmlFor="broadcast-body">Message (HTML allowed)</label>
              <textarea
                id="broadcast-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full rounded-lg border border-[#c8d6e5] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20"
                placeholder="<p>Hi there,</p>"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-[#102548] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#173661] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={sendBroadcast}
                disabled={!canSend}
              >
                <Send className="h-4 w-4" /> {sendBusy ? 'Sending...' : 'Send broadcast'}
              </button>
              {!preview && <span className="text-xs text-[#9aa5b7]">Preview recipients to enable sending.</span>}
            </div>
          </div>
        </PanelCard>

        <div className="grid content-start gap-6">
          <PanelCard title="Recipients" subtitle={preview ? undefined : 'Run a preview'}>
            {result ? (
              <div className="grid gap-2 text-sm">
                <p className="font-bold text-[#102548]">Broadcast sent</p>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="green">Sent {result.sent.toLocaleString()}</Badge>
                  {result.failed > 0 && <Badge tone="amber">Failed {result.failed.toLocaleString()}</Badge>}
                  <Badge>Skipped {result.skipped.toLocaleString()}</Badge>
                </div>
                <p className="text-xs text-[#9aa5b7]">{result.segmentEligible.toLocaleString()} eligible in segment · capped at {result.cap.toLocaleString()} per send.</p>
              </div>
            ) : !preview ? (
              <p className="text-sm text-[#64718a]">Preview a segment to see how many leads will receive this broadcast.</p>
            ) : (
              <div className="grid gap-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="blue">{preview.recipientCount.toLocaleString()} recipients</Badge>
                  <Badge>{preview.skipped.toLocaleString()} skipped</Badge>
                </div>
                <p className="text-xs text-[#9aa5b7]">Sending is capped at {preview.cap.toLocaleString()} per send.</p>
                {preview.sample.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">Sample</p>
                    <ul className="grid gap-1">
                      {preview.sample.map((r, i) => (
                        <li key={`${r.email}-${i}`} className="truncate text-[#26334d]">
                          <span className="font-semibold text-[#102548]">{r.name || 'Unknown'}</span>
                          <span className="text-[#64718a]"> · {r.email}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </PanelCard>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
        <SectionHeader title="Recent broadcasts" subtitle={`${history.length} sent`} />
        {history.length === 0 ? (
          <EmptyState icon={Send} title="No broadcasts yet" body="Broadcasts you send to lead segments will be logged here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead className="bg-[#f6f8fb] text-left text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">
                <tr>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Recipients</th>
                  <th className="px-5 py-3">Sent</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f6]">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-[#f9fbfd]">
                    <td className="px-5 py-4 font-semibold text-[#102548]">{h.subject || 'No subject'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-[#64718a]">{dateShort(h.createdAt)}</td>
                    <td className="px-5 py-4 text-[#26334d]">{h.recipientCount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-[#26334d]">{h.sentCount.toLocaleString()}</td>
                    <td className="px-5 py-4"><Badge tone={h.status === 'sent' ? 'green' : h.status === 'failed' ? 'amber' : 'neutral'}>{h.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
