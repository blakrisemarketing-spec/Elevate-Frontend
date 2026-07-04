import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChartColumn, GraduationCap, LayoutDashboard, LogOut, ReceiptText, RefreshCw, Send, UsersRound } from 'lucide-react';
import { api, ApiError } from './api';
import { NavButton } from './ui';
import type { Icon } from './ui';
import { LoginScreen } from './LoginScreen';
import { OverviewTab } from './tabs/OverviewTab';
import { LeadsTab } from './tabs/LeadsTab';
import { MessagingTab } from './tabs/MessagingTab';
import { PurchasesTab } from './tabs/PurchasesTab';
import { ScholarshipsTab } from './tabs/ScholarshipsTab';

type Tab = 'overview' | 'leads' | 'messaging' | 'purchases' | 'scholarships';

const tabs: Array<{ id: Tab; label: string; icon: Icon; description: string }> = [
  { id: 'overview', label: 'Overview', icon: ChartColumn, description: 'Pipeline and campaign health' },
  { id: 'leads', label: 'Leads', icon: UsersRound, description: 'Quiz submissions and CVs' },
  { id: 'messaging', label: 'Messaging', icon: Send, description: 'Broadcast to lead segments' },
  { id: 'purchases', label: 'Purchases', icon: ReceiptText, description: 'Verified Paystack ledger' },
  { id: 'scholarships', label: 'Scholarships', icon: GraduationCap, description: 'Runtime matching feed' },
];

function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api('/api/admin-stats.php')
      .then(() => setAuthed(true))
      .catch((e) => {
        // A 503 (or other non-auth failure) means the session may still be
        // valid; let the tabs surface the friendly error banner instead.
        if (e instanceof ApiError && e.status !== 401) setAuthed(true);
      });
  }, []);

  async function login(password: string) {
    setBusy(true);
    setError('');
    try {
      await api('/api/admin-login.php', { method: 'POST', body: JSON.stringify({ password }) });
      setAuthed(true);
      setRefreshKey((k) => k + 1);
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

  function onAuthError() {
    setAuthed(false);
  }

  if (!authed) {
    return <LoginScreen onSubmit={login} busy={busy} error={error} />;
  }

  const activeTab = tabs.find((x) => x.id === tab) || tabs[0];

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
              <NavButton key={item.id} label={item.label} description={item.description} icon={item.icon} active={tab === item.id} onClick={() => setTab(item.id)} />
            ))}
          </nav>

          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#9ed8ff]">System</p>
            <p className="text-sm leading-6 text-white/72">Leads and campaign data are stored securely in Supabase, so they persist across deploys.</p>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-5 sm:px-7 lg:px-10">
          <header className="mb-6 flex flex-col gap-4 rounded-lg border border-white bg-white/80 p-4 shadow-[0_12px_40px_rgba(16,37,72,0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#0077B6]">{activeTab.label}</p>
              <h1 className="text-2xl font-extrabold text-[#102548]">{activeTab.description}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-[#c8d6e5] bg-white px-4 py-2 text-sm font-semibold text-[#102548] transition hover:border-[#0077B6] hover:text-[#0077B6]" onClick={() => setRefreshKey((k) => k + 1)}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button type="button" className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-[#102548] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#173661]" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </header>

          {tab === 'overview' && <OverviewTab refreshKey={refreshKey} onAuthError={onAuthError} />}
          {tab === 'leads' && <LeadsTab refreshKey={refreshKey} onAuthError={onAuthError} />}
          {tab === 'messaging' && <MessagingTab refreshKey={refreshKey} onAuthError={onAuthError} />}
          {tab === 'purchases' && <PurchasesTab refreshKey={refreshKey} onAuthError={onAuthError} />}
          {tab === 'scholarships' && <ScholarshipsTab refreshKey={refreshKey} onAuthError={onAuthError} />}
        </section>
      </div>
    </main>
  );
}

const mount = document.getElementById('admin-root');
if (mount && !mount.dataset.adminMounted) {
  mount.dataset.adminMounted = 'true';
  createRoot(mount).render(<AdminApp />);
}
