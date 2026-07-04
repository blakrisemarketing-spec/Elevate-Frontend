import { useState } from 'react';
import type { FormEvent } from 'react';
import { Database, LayoutDashboard, ShieldCheck } from 'lucide-react';

export function LoginScreen({ onSubmit, busy, error }: { onSubmit: (email: string, password: string) => void; busy: boolean; error: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit(email, password);
  }

  return (
    <main className="min-h-screen bg-[#f4f6f9] text-[#172033]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(320px,440px)_1fr]">
        <section className="flex flex-col justify-between bg-[#102548] px-7 py-8 text-white sm:px-10">
          <div>
            <div className="mb-16 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#3FA9F5] text-[#102548]">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9ed8ff]">Elevate ops</p>
                <p className="text-sm text-white/70">Private workspace</p>
              </div>
            </div>
            <h1 className="mb-4 max-w-sm text-4xl font-extrabold leading-tight text-white sm:text-5xl">Admin dashboard</h1>
            <p className="max-w-sm text-base leading-7 text-white/72">
              Manage Grad School Match leads, CV uploads, scholarships, and verified purchases in one focused workspace.
            </p>
          </div>
          <div className="mt-12 grid gap-3 text-sm text-white/70">
            <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-[#3FA9F5]" /> Session protected by server-side PHP auth</div>
            <div className="flex items-center gap-3"><Database className="h-4 w-4 text-[#3FA9F5]" /> Leads stored securely in Supabase, safe across deploys</div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10">
          <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_24px_80px_rgba(16,37,72,0.12)]">
            <div className="mb-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0077B6]">Sign in</p>
              <h2 className="text-2xl font-extrabold text-[#102548]">Unlock admin tools</h2>
            </div>
            <label className="mb-2 block text-sm font-semibold text-[#26334d]" htmlFor="admin-email">Email</label>
            <input id="admin-email" className="input mb-4" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoFocus />
            <label className="mb-2 block text-sm font-semibold text-[#26334d]" htmlFor="admin-password">Password</label>
            <input id="admin-password" className="input mb-4" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            {error && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#102548] px-5 py-3 font-semibold text-white transition hover:bg-[#173661]" disabled={busy}>
              <ShieldCheck className="h-4 w-4" />
              {busy ? 'Checking password...' : 'Sign in'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
