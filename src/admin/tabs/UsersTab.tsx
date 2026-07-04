import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Copy, KeyRound, Plus, Trash2, UserCog, X } from 'lucide-react';
import { api, errorMessage, isAuthError } from '../api';
import type {
  ActiveUserResponse,
  AdminUser,
  AdminUsersResponse,
  CreateUserResponse,
  CurrentUser,
  ResetUserResponse,
} from '../api';
import { Badge, EmptyState, ErrorBanner, SearchBox, SectionHeader, dateShort } from '../ui';

type Props = { refreshKey: number; onAuthError: () => void; currentUser: CurrentUser | null };

/** A password shown once after a create/reset — never retrievable again. */
type OneTimeSecret = { email: string; password: string; generated: boolean };

const inputClass =
  'w-full rounded-lg border border-[#c8d6e5] bg-white px-3 py-2 text-sm text-[#26334d] outline-none transition focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20';
const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      {children}
    </div>
  );
}

/** Prominent, copyable one-time password panel. The plaintext is never shown again. */
function SecretPanel({ secret, onDismiss }: { secret: OneTimeSecret; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`Email: ${secret.email}\nPassword: ${secret.password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mb-4 rounded-lg border border-[#3FA9F5] bg-[#eef8ff] p-4 shadow-[0_10px_30px_rgba(16,37,72,0.10)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0077B6]">
            {secret.generated ? 'Generated password' : 'New password'}
          </p>
          <p className="text-sm font-bold text-[#102548]">Share this securely; it won't be shown again.</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#c8d6e5] bg-white text-[#64718a] transition hover:border-[#0077B6] hover:text-[#0077B6]"
          aria-label="Dismiss password"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-2 rounded-lg border border-[#cfe4f5] bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-20 shrink-0 text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">Email</span>
          <span className="min-w-0 truncate font-semibold text-[#102548]">{secret.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-20 shrink-0 text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">Password</span>
          <span className="min-w-0 flex-1 truncate font-mono text-[#102548]">{secret.password}</span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#102548] px-3 text-sm font-semibold text-white transition hover:bg-[#173661]"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddUserDrawer({
  onClose,
  onCreated,
  onAuthError,
}: {
  onClose: () => void;
  onCreated: (user: AdminUser, secret: OneTimeSecret) => void;
  onAuthError: () => void;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'generate' | 'set'>('generate');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function save() {
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (mode === 'set' && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body: { action: 'create'; email: string; name?: string; password?: string } = {
        action: 'create',
        email: email.trim(),
      };
      if (name.trim()) body.name = name.trim();
      if (mode === 'set') body.password = password;
      const res = await api<CreateUserResponse>('/api/admin-users.php', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      onCreated(res.user, { email: res.user.email, password: res.password, generated: res.generated });
      onClose();
    } catch (e) {
      if (isAuthError(e)) {
        onAuthError();
        return;
      }
      setError(errorMessage(e, 'Could not create this admin'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Add admin">
      <div className="absolute inset-0 bg-[#102548]/50" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-[0_24px_80px_rgba(16,37,72,0.35)]">
        <div className="sticky top-0 z-10 border-b border-[#edf1f6] bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-extrabold text-[#102548]">Add admin</h2>
              <p className="truncate text-sm text-[#64718a]">Create a new admin account</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#c8d6e5] text-[#64718a] transition hover:border-[#0077B6] hover:text-[#0077B6]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-5 pt-4">
          <ErrorBanner message={error} />
        </div>

        <div className="grid gap-4 px-5 pb-6">
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@elevatecareerhub.com"
              className={inputClass}
              autoFocus
            />
          </Field>
          <Field label="Name (optional)">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>

          <Field label="Password">
            <div className="grid gap-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#c8d6e5] bg-[#f9fbfd] px-4 py-3">
                <input
                  type="radio"
                  name="pw-mode"
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-[#0077B6]"
                  checked={mode === 'generate'}
                  onChange={() => setMode('generate')}
                />
                <span>
                  <span className="block text-sm font-bold text-[#102548]">Generate a password</span>
                  <span className="block text-xs text-[#64718a]">We create a strong password and show it once.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#c8d6e5] bg-[#f9fbfd] px-4 py-3">
                <input
                  type="radio"
                  name="pw-mode"
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-[#0077B6]"
                  checked={mode === 'set'}
                  onChange={() => setMode('set')}
                />
                <span className="w-full">
                  <span className="block text-sm font-bold text-[#102548]">Set a password</span>
                  <span className="mb-2 block text-xs text-[#64718a]">At least 8 characters.</span>
                  {mode === 'set' && (
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className={`${inputClass} font-mono`}
                      onClick={(e) => e.preventDefault()}
                    />
                  )}
                </span>
              </label>
            </div>
          </Field>
        </div>

        <div className="sticky bottom-0 mt-auto flex items-center justify-end gap-2 border-t border-[#edf1f6] bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c8d6e5] bg-white px-4 py-2 text-sm font-semibold text-[#102548] transition hover:border-[#0077B6] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-[#102548] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#173661] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> {saving ? 'Creating...' : 'Create admin'}
          </button>
        </div>
      </aside>
    </div>
  );
}

export function UsersTab({ refreshKey, onAuthError, currentUser }: Props) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [adding, setAdding] = useState(false);
  const [secret, setSecret] = useState<OneTimeSecret | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError('');
      try {
        const res = await api<AdminUsersResponse>('/api/admin-users.php');
        if (!cancelled) setUsers(res.users || []);
      } catch (e) {
        if (cancelled) return;
        if (isAuthError(e)) {
          onAuthError();
          return;
        }
        setError(errorMessage(e, 'Could not load admins'));
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, reloadKey]);

  function onCreated(user: AdminUser, made: OneTimeSecret) {
    setUsers((prev) => [...prev, user]);
    setSecret(made);
  }

  async function runAction(fn: () => Promise<void>) {
    setActionBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      if (isAuthError(e)) {
        onAuthError();
        return;
      }
      setError(errorMessage(e, 'Action failed'));
    } finally {
      setActionBusy(false);
    }
  }

  function resetPassword(u: AdminUser) {
    if (!window.confirm(`Reset the password for ${u.email}? The current password stops working immediately.`)) return;
    void runAction(async () => {
      const res = await api<ResetUserResponse>('/api/admin-users.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset', id: u.id }),
      });
      setSecret({ email: u.email, password: res.password, generated: res.generated });
    });
  }

  function toggleActive(u: AdminUser) {
    void runAction(async () => {
      const res = await api<ActiveUserResponse>('/api/admin-users.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'active', id: u.id, active: !u.active }),
      });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, active: res.active } : x)));
    });
  }

  function removeUser(u: AdminUser) {
    if (!window.confirm(`Remove ${u.email} as an admin?`)) return;
    void runAction(async () => {
      await api('/api/admin-users.php', { method: 'POST', body: JSON.stringify({ action: 'delete', id: u.id }) });
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      setReloadKey((k) => k + 1);
    });
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((u) => `${u.email} ${u.name}`.toLowerCase().includes(needle));
  }, [users, query]);

  return (
    <>
      <ErrorBanner message={error} />
      {secret && <SecretPanel secret={secret} onDismiss={() => setSecret(null)} />}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchBox value={query} onChange={setQuery} placeholder="Search by email or name" />
        <div className="flex items-center gap-3">
          <p className="whitespace-nowrap text-sm text-[#64718a]">
            {busy ? 'Syncing data...' : `${users.length.toLocaleString()} admin${users.length === 1 ? '' : 's'}`}
          </p>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#102548] px-4 text-sm font-semibold text-white transition hover:bg-[#173661]"
          >
            <Plus className="h-4 w-4" /> Add admin
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
        <SectionHeader
          title="Admin accounts"
          subtitle={query.trim() ? `${visible.length.toLocaleString()} of ${users.length.toLocaleString()} match` : `${users.length.toLocaleString()} accounts`}
        />
        {visible.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="No admins in this view"
            body="Add an admin to give a teammate access to this workspace."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-sm">
              <thead className="bg-[#f6f8fb] text-left text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">
                <tr>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Last login</th>
                  <th className="px-5 py-3 text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f6]">
                {visible.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className={u.active ? '' : 'opacity-60'}>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-[#102548]">{u.email}</span>
                        {isSelf && (
                          <span className="ml-2 align-middle text-xs font-bold">
                            <Badge tone="blue">you</Badge>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[#26334d]">{u.name || <span className="text-[#9aa5b7]">-</span>}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold">
                          <Badge tone={u.active ? 'green' : 'neutral'}>{u.active ? 'Active' : 'Inactive'}</Badge>
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-[#64718a]">
                        {u.lastLoginAt ? dateShort(u.lastLoginAt) : 'Never'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => resetPassword(u)}
                            disabled={actionBusy}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#c8d6e5] bg-white px-3 text-xs font-semibold text-[#102548] transition hover:border-[#0077B6] hover:text-[#0077B6] disabled:opacity-50"
                          >
                            <KeyRound className="h-3.5 w-3.5" /> Reset password
                          </button>
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => toggleActive(u)}
                              disabled={actionBusy}
                              className="inline-flex h-9 items-center justify-center rounded-lg border border-[#c8d6e5] bg-white px-3 text-xs font-semibold text-[#102548] transition hover:border-[#0077B6] hover:text-[#0077B6] disabled:opacity-50"
                            >
                              {u.active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => removeUser(u)}
                              disabled={actionBusy}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition hover:border-red-400 disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {adding && <AddUserDrawer onClose={() => setAdding(false)} onCreated={onCreated} onAuthError={onAuthError} />}
    </>
  );
}
