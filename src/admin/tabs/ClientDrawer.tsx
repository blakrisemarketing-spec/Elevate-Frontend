import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, Circle, Download, Eye, EyeOff, Mail, Trash2, Upload, X } from 'lucide-react';
import { api, ApiError, errorMessage, isAuthError } from '../api';
import { ErrorBanner, dateOnly, dateShort } from '../ui';
import { cedis, channelLabel, humanize, METHOD_LABELS, ROLE_LABELS, seesFinance, STATUS_LABELS } from '../ops-api';
import type { Application, ClientDetailResponse, Deliverable, Engagement, EngagementResponse, EngagementStatus, Role, TeamMember } from '../ops-api';
import { btnGhost, btnPrimary, Field, inputCls } from './FinanceTab';

type Section = 'work' | 'applications' | 'timeline' | 'profile';

type Props = {
  clientId: number;
  focusEngagementId?: number;
  team: TeamMember[];
  role?: Role;
  onClose: () => void;
  onChanged: () => void;
  onAuthError: () => void;
};

export function ClientDrawer({ clientId, focusEngagementId, team, role, onClose, onChanged, onAuthError }: Props) {
  const [data, setData] = useState<ClientDetailResponse | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [section, setSection] = useState<Section>('work');
  const [reload, setReload] = useState(0);
  const senior = seesFinance(role);

  useEffect(() => {
    let cancelled = false;
    api<ClientDetailResponse>(`/api/admin-clients.php?id=${clientId}`)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => {
        if (cancelled) return;
        if (isAuthError(e)) return onAuthError();
        setError(errorMessage(e, 'Could not load client'));
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, reload]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function refresh() {
    setReload((r) => r + 1);
    onChanged();
  }

  async function call<T>(url: string, body: Record<string, unknown>, ok?: string): Promise<T | null> {
    setError('');
    try {
      const res = await api<T>(url, { method: 'POST', body: JSON.stringify(body) });
      if (ok) setNotice(ok);
      refresh();
      return res;
    } catch (e) {
      if (isAuthError(e)) onAuthError();
      setError(errorMessage(e, 'Save failed'));
      return null;
    }
  }

  const c = data?.client;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Client file">
      <div className="absolute inset-0 bg-[#102548]/50" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col overflow-y-auto bg-[#f6f8fb] shadow-[0_24px_80px_rgba(16,37,72,0.35)]">
        <div className="sticky top-0 z-10 border-b border-[#edf1f6] bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0077B6]">Client file</p>
              <h2 className="truncate text-xl font-extrabold text-[#102548]">{c ? (c.name || c.email) : 'Loading...'}</h2>
              {c && <p className="truncate text-sm text-[#64718a]">{c.email}{c.phone ? ` · ${c.phone}` : ''} · {channelLabel(c.acquisitionChannel)}</p>}
            </div>
            <button type="button" aria-label="Close" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-[#c8d6e5] text-[#102548] hover:border-[#0077B6]"><X className="h-4 w-4" /></button>
          </div>
          {c && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-2.5 py-1 font-semibold ${c.hasPassword || c.hasGoogle ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                {c.hasPassword || c.hasGoogle ? `Portal active${c.lastLoginAt ? `, last seen ${dateOnly(c.lastLoginAt)}` : ''}` : 'Portal not set up yet'}
              </span>
              <button type="button" className={btnGhost} onClick={async () => {
                const res = await call<{ ok: boolean; sent: boolean }>('/api/admin-clients.php', { action: 'invite', id: c.id });
                if (res) setNotice(res.sent ? `Portal link emailed to ${c.email}.` : 'Email is not configured on this server; the link was logged instead.');
              }}><Mail className="h-4 w-4" />Email portal link</button>
            </div>
          )}
          <nav className="mt-3 flex gap-1" aria-label="Client sections">
            {(['work', 'applications', 'timeline', 'profile'] as Section[]).map((s) => (
              <button key={s} type="button" onClick={() => setSection(s)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${section === s ? 'bg-[#102548] text-white' : 'text-[#102548] hover:bg-[#e7f4ff]'}`}>
                {{ work: `Work${data ? ` (${data.engagements.length})` : ''}`, applications: `Applications${data ? ` (${data.applications.length})` : ''}`, timeline: 'Timeline', profile: senior ? 'Profile & payments' : 'Profile' }[s]}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-4 p-5">
          <ErrorBanner message={error} />
          {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</div>}
          {data && section === 'work' && (
            <>
              {data.engagements.length === 0 && <p className="rounded-lg bg-white p-5 text-sm text-[#64718a]">No work items yet. They are created automatically when this client pays, or add one from the Work board.</p>}
              {data.engagements.map((e) => (
                <EngagementCard key={e.id} eng={e} files={data.deliverables.filter((d) => d.engagementId === e.id)} team={team} senior={senior}
                  defaultOpen={focusEngagementId ? e.id === focusEngagementId : data.engagements.length === 1}
                  call={call} onUploaded={refresh} onAuthError={onAuthError} setError={setError} />
              ))}
            </>
          )}
          {data && section === 'applications' && <ApplicationsPanel data={data} call={call} />}
          {data && section === 'timeline' && <TimelinePanel data={data} call={call} />}
          {data && section === 'profile' && <ProfilePanel data={data} senior={senior} call={call} />}
        </div>
      </aside>
    </div>
  );
}

type Call = <T>(url: string, body: Record<string, unknown>, ok?: string) => Promise<T | null>;

function EngagementCard({ eng, files, team, senior, defaultOpen, call, onUploaded, onAuthError, setError }: {
  eng: Engagement; files: Deliverable[]; team: TeamMember[]; senior: boolean; defaultOpen: boolean;
  call: Call; onUploaded: () => void; onAuthError: () => void; setError: (s: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [message, setMessage] = useState(eng.clientMessage);
  const [uploading, setUploading] = useState(false);
  const update = (patch: Record<string, unknown>, ok?: string) => call<EngagementResponse>('/api/admin-work.php', { action: 'update', id: eng.id, ...patch }, ok);

  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set('engagementId', String(eng.id));
    setUploading(true);
    try {
      const res = await fetch('/api/admin-deliverables.php', { method: 'POST', body: fd, credentials: 'same-origin' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new ApiError(json.message || 'Upload failed', res.status);
      form.reset();
      onUploaded();
    } catch (err) {
      if (isAuthError(err)) onAuthError();
      setError(errorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-lg border border-white bg-white shadow-[0_10px_30px_rgba(16,37,72,0.07)]">
      <button type="button" className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div className="min-w-0">
          <p className="truncate font-bold text-[#102548]">{eng.title}</p>
          <p className="text-xs text-[#64718a]">{STATUS_LABELS[eng.status]} · {eng.stepsDone}/{eng.stepsTotal} steps · {eng.ownerName || 'Unassigned'}{eng.dueOn ? ` · due ${dateOnly(eng.dueOn)}` : ''}</p>
        </div>
        {eng.overdue && <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">Overdue</span>}
      </button>
      {open && (
        <div className="space-y-4 border-t border-[#edf1f6] px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Status">
              <select className={inputCls} value={eng.status} onChange={(e) => update({ status: e.target.value as EngagementStatus }, 'Status updated.')}>
                {(Object.keys(STATUS_LABELS) as EngagementStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </Field>
            <Field label="Owner">
              <select className={inputCls} disabled={!senior} value={eng.ownerId ?? ''} onChange={(e) => update({ ownerId: e.target.value ? Number(e.target.value) : null }, 'Owner updated.')}>
                <option value="">Unassigned</option>
                {team.map((t) => <option key={t.id} value={t.id}>{t.name || t.email} ({ROLE_LABELS[t.role]})</option>)}
              </select>
            </Field>
            <Field label="Due">
              <input type="date" className={inputCls} value={eng.dueOn ?? ''} onChange={(e) => update({ dueOn: e.target.value }, 'Due date updated.')} />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-[#26334d]">Steps <span className="font-normal text-[#64718a]">(the client sees these)</span></p>
            <ul className="space-y-1">
              {eng.steps.map((s) => (
                <li key={s.id}>
                  <button type="button" className="flex w-full items-center gap-2 rounded px-1 py-1 text-left text-sm hover:bg-[#f6f8fb]" onClick={() => call('/api/admin-work.php', { action: 'step', stepId: s.id, done: !s.done })}>
                    {s.done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="h-4 w-4 shrink-0 text-[#9aa5b7]" />}
                    <span className={s.done ? 'text-[#64718a] line-through' : 'text-[#26334d]'}>{s.label}</span>
                    {s.done && s.doneAt && <span className="ml-auto text-xs text-[#9aa5b7]">{dateOnly(s.doneAt)}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <Field label="Message to client" hint="Shown on this item in the client's portal and posted to their timeline.">
            <div className="flex gap-2">
              <textarea className={`${inputCls} h-16 py-2`} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. First draft is in, please review by Friday." />
              <button type="button" className={btnGhost} disabled={message === eng.clientMessage} onClick={() => update({ clientMessage: message }, 'Message saved.')}>Save</button>
            </div>
          </Field>

          <div>
            <p className="mb-2 text-sm font-semibold text-[#26334d]">Files</p>
            {files.length === 0 && <p className="mb-2 text-sm text-[#64718a]">No files yet.</p>}
            <ul className="mb-3 divide-y divide-[#edf1f6] rounded-lg border border-[#edf1f6]">
              {files.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#102548]">{d.title} <span className="font-normal text-[#64718a]">v{d.version}</span></p>
                    <p className="text-xs text-[#64718a]">{d.fileName} · {Math.round(d.sizeBytes / 1024)} KB · {dateShort(d.createdAt)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${d.clientVisible ? 'bg-emerald-100 text-emerald-700' : 'bg-[#edf2f7] text-[#64718a]'}`}>{d.clientVisible ? 'Shared' : 'Internal'}</span>
                  <button type="button" aria-label={d.clientVisible ? 'Hide from client' : 'Share with client'} title={d.clientVisible ? 'Hide from client' : 'Share with client (emails them)'} className="text-[#64718a] hover:text-[#0077B6]" onClick={() => call('/api/admin-deliverables.php', { action: 'visible', id: d.id, visible: !d.clientVisible }, d.clientVisible ? 'File hidden from client.' : 'File shared; the client was emailed.')}>
                    {d.clientVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <a aria-label="Download" className="text-[#64718a] hover:text-[#0077B6]" href={`/api/admin-deliverables.php?id=${d.id}`}><Download className="h-4 w-4" /></a>
                  <button type="button" aria-label="Delete file" className="text-[#64718a] hover:text-red-700" onClick={() => { if (window.confirm(`Delete ${d.fileName}? This cannot be undone.`)) call('/api/admin-deliverables.php', { action: 'delete', id: d.id }, 'File deleted.'); }}><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
            <form onSubmit={upload} className="grid gap-2 rounded-lg bg-[#f6f8fb] p-3 sm:grid-cols-[1fr_1fr_auto]">
              <input name="file" type="file" required aria-label="File" className="text-sm" accept=".pdf,.doc,.docx,.odt,.rtf,.txt,.pptx,.xlsx,.png,.jpg,.jpeg" />
              <input name="title" className={inputCls} placeholder="Title, e.g. Final CV" aria-label="File title" />
              <button type="submit" disabled={uploading} className={btnPrimary}><Upload className="h-4 w-4" />{uploading ? 'Uploading...' : 'Upload'}</button>
              <label className="flex items-center gap-2 text-sm text-[#26334d] sm:col-span-3"><input type="checkbox" name="clientVisible" value="1" />Share with client now (emails them)</label>
            </form>
          </div>

          {senior && (
            <div className="flex justify-end">
              <button type="button" className="text-sm font-semibold text-red-700 hover:underline" onClick={() => { if (window.confirm(`Delete "${eng.title}" and its files? This cannot be undone.`)) call('/api/admin-work.php', { action: 'delete', id: eng.id }, 'Work item deleted.'); }}>Delete work item</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ApplicationsPanel({ data, call }: { data: ClientDetailResponse; call: Call }) {
  const [kind, setKind] = useState<'school' | 'job'>(data.applications.some((a) => a.kind === 'job') && !data.applications.some((a) => a.kind === 'school') ? 'job' : 'school');
  const blank = { organization: '', title: '', location: '', url: '', deadline: '', clientNotes: '' };
  const [f, setF] = useState(blank);
  const list = data.applications.filter((a) => a.kind === kind);
  const statuses = kind === 'job' ? data.jobStatuses : data.schoolStatuses;
  const engagementOptions = data.engagements.filter((e) => ['applications', 'job_search', 'school_selection'].includes(e.family));

  return (
    <>
      <div className="flex gap-2">
        {(['school', 'job'] as const).map((k) => (
          <button key={k} type="button" onClick={() => setKind(k)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${kind === k ? 'bg-[#0077B6] text-white' : 'bg-white text-[#102548]'}`}>
            {k === 'school' ? 'Grad school' : 'Job search'} ({data.applications.filter((a) => a.kind === k).length})
          </button>
        ))}
      </div>
      <form className="grid gap-3 rounded-lg bg-white p-4 shadow-[0_10px_30px_rgba(16,37,72,0.07)] sm:grid-cols-2" onSubmit={async (e) => {
        e.preventDefault();
        const res = await call('/api/admin-clients.php', { action: 'app_create', clientId: data.client.id, kind, ...f, engagementId: engagementOptions.find((x) => x.family === (kind === 'job' ? 'job_search' : 'applications'))?.id ?? null }, kind === 'job' ? 'Job added.' : 'School added.');
        if (res) setF(blank);
      }}>
        <Field label={kind === 'job' ? 'Company *' : 'School *'}><input required className={inputCls} value={f.organization} onChange={(e) => setF({ ...f, organization: e.target.value })} /></Field>
        <Field label={kind === 'job' ? 'Role' : 'Programme'}><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Location"><input className={inputCls} value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></Field>
        <Field label="Deadline"><input type="date" className={inputCls} value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></Field>
        <Field label="Link"><input type="url" className={inputCls} value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://" /></Field>
        <Field label="Note for client"><input className={inputCls} value={f.clientNotes} onChange={(e) => setF({ ...f, clientNotes: e.target.value })} /></Field>
        <div className="sm:col-span-2"><button type="submit" className={btnPrimary}>Add {kind === 'job' ? 'job' : 'school'}</button></div>
      </form>
      {list.length === 0 && <p className="rounded-lg bg-white p-5 text-sm text-[#64718a]">Nothing tracked yet. Everything added here shows in the client's portal with its status.</p>}
      {list.map((a) => <ApplicationRow key={a.id} app={a} statuses={statuses} call={call} />)}
    </>
  );
}

function ApplicationRow({ app, statuses, call }: { app: Application; statuses: string[]; call: Call }) {
  const [notes, setNotes] = useState(app.clientNotes);
  const [internal, setInternal] = useState(app.internalNotes || '');
  return (
    <div className="rounded-lg bg-white p-4 shadow-[0_10px_30px_rgba(16,37,72,0.07)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-[#102548]">{app.organization}{app.title && <span className="font-normal text-[#26334d]">, {app.title}</span>}</p>
          <p className="text-xs text-[#64718a]">{[app.location, app.deadline ? `deadline ${dateOnly(app.deadline)}` : '', `updated ${dateOnly(app.statusUpdatedAt)}`].filter(Boolean).join(' · ')}</p>
          {app.url && <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#0077B6] hover:underline">Open link</a>}
        </div>
        <div className="flex items-center gap-2">
          <select aria-label="Application status" className={`${inputCls} w-40`} value={app.status} onChange={(e) => call('/api/admin-clients.php', { action: 'app_update', id: app.id, status: e.target.value }, 'Status updated; the client sees it in their portal.')}>
            {statuses.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
          </select>
          <button type="button" aria-label="Delete application" className="text-[#64718a] hover:text-red-700" onClick={() => { if (window.confirm(`Remove ${app.organization}?`)) call('/api/admin-clients.php', { action: 'app_delete', id: app.id }, 'Removed.'); }}><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input aria-label="Note for client" className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note for client" />
        <input aria-label="Internal note" className={inputCls} value={internal} onChange={(e) => setInternal(e.target.value)} placeholder="Internal note (team only)" />
      </div>
      {(notes !== app.clientNotes || internal !== (app.internalNotes || '')) && (
        <button type="button" className={`${btnGhost} mt-2`} onClick={() => call('/api/admin-clients.php', { action: 'app_update', id: app.id, clientNotes: notes, internalNotes: internal }, 'Notes saved.')}>Save notes</button>
      )}
    </div>
  );
}

function TimelinePanel({ data, call }: { data: ClientDetailResponse; call: Call }) {
  const [text, setText] = useState('');
  const [visible, setVisible] = useState(false);
  return (
    <>
      <form className="space-y-2 rounded-lg bg-white p-4 shadow-[0_10px_30px_rgba(16,37,72,0.07)]" onSubmit={async (e) => {
        e.preventDefault();
        if (await call('/api/admin-clients.php', { action: 'note', clientId: data.client.id, body: text, clientVisible: visible }, visible ? 'Update posted to the client portal.' : 'Note saved.')) setText('');
      }}>
        <textarea required className={`${inputCls} h-20 py-2`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Call notes, decisions, a reply to the client..." aria-label="Note" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm text-[#26334d]"><input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />Post to client portal (otherwise internal)</label>
          <button type="submit" className={btnPrimary}>{visible ? 'Post update' : 'Save note'}</button>
        </div>
      </form>
      <ol className="space-y-2">
        {data.activity.map((a) => (
          <li key={a.id} className={`rounded-lg p-3 text-sm ${a.kind === 'client_message' ? 'border border-[#0077B6]/30 bg-[#e7f4ff]' : 'bg-white'}`}>
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-[#64718a]">
              <span className="font-semibold text-[#26334d]">{a.kind === 'client_message' ? `${a.actorName || 'Client'} (client)` : a.actorName || 'System'}</span>
              <span>{dateShort(a.createdAt)}</span>
              <span className={`rounded-full px-2 py-0.5 ${a.clientVisible ? 'bg-emerald-100 text-emerald-700' : 'bg-[#edf2f7]'}`}>{a.clientVisible ? 'Client sees this' : 'Internal'}</span>
            </div>
            <p className="whitespace-pre-wrap text-[#26334d]">{a.summary}</p>
          </li>
        ))}
        {data.activity.length === 0 && <li className="rounded-lg bg-white p-5 text-sm text-[#64718a]">No activity yet.</li>}
      </ol>
    </>
  );
}

function ProfilePanel({ data, senior, call }: { data: ClientDetailResponse; senior: boolean; call: Call }) {
  const c = data.client;
  const [f, setF] = useState({ name: c.name, phone: c.phone, notes: c.notes, acquisitionChannel: c.acquisitionChannel, portalEnabled: c.portalEnabled });
  const total = (data.revenue || []).reduce((s, r) => s + r.amountPesewas, 0);
  return (
    <>
      <form className="grid gap-3 rounded-lg bg-white p-4 shadow-[0_10px_30px_rgba(16,37,72,0.07)] sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); call('/api/admin-clients.php', { action: 'update', id: c.id, ...f }, 'Profile saved.'); }}>
        <Field label="Name"><input disabled={!senior} className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Phone"><input disabled={!senior} className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Acquisition channel">
          <select disabled={!senior} className={inputCls} value={f.acquisitionChannel} onChange={(e) => setF({ ...f, acquisitionChannel: e.target.value })}>
            {data.channels.map((ch) => <option key={ch} value={ch}>{channelLabel(ch)}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-[#26334d]"><input disabled={!senior} type="checkbox" checked={f.portalEnabled} onChange={(e) => setF({ ...f, portalEnabled: e.target.checked })} />Portal access enabled</label>
        <div className="sm:col-span-2"><Field label="Internal notes"><textarea disabled={!senior} className={`${inputCls} h-24 py-2`} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field></div>
        {senior && <div className="sm:col-span-2"><button type="submit" className={btnPrimary}>Save profile</button></div>}
      </form>
      {data.lead && (
        <div className="rounded-lg bg-white p-4 text-sm shadow-[0_10px_30px_rgba(16,37,72,0.07)]">
          <p className="font-bold text-[#102548]">Grad School Match lead</p>
          <p className="text-[#64718a]">Submitted {dateOnly(data.lead.createdAt)} · {humanize(data.lead.status)}{data.lead.utmSource ? ` · ${data.lead.utmSource}${data.lead.utmCampaign ? ` / ${data.lead.utmCampaign}` : ''}` : ''}</p>
        </div>
      )}
      {senior && data.revenue && (
        <div className="overflow-hidden rounded-lg bg-white shadow-[0_10px_30px_rgba(16,37,72,0.07)]">
          <p className="border-b border-[#edf1f6] px-4 py-3 font-bold text-[#102548]">Payments · {cedis(total)} lifetime</p>
          <ul className="divide-y divide-[#edf1f6] text-sm">
            {data.revenue.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2">
                <span><strong className="text-[#102548]">{r.itemName}</strong><span className="block text-xs text-[#64718a]">{dateOnly(r.occurredAt)} · {METHOD_LABELS[r.method] || r.method} · {channelLabel(r.channel)}</span></span>
                <strong>{cedis(r.amountPesewas)}</strong>
              </li>
            ))}
            {data.revenue.length === 0 && <li className="px-4 py-3 text-[#64718a]">No payments recorded.</li>}
          </ul>
        </div>
      )}
    </>
  );
}
