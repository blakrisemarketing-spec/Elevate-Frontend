import type { ComponentType, ReactNode } from 'react';
import { Search } from 'lucide-react';
import type { LeadStatus } from './api';

export type Icon = ComponentType<{ className?: string }>;

export function money(pesewas?: number) {
  if (!pesewas) return 'GHS 0';
  return `GHS ${(pesewas / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function dateShort(value?: string | null) {
  if (!value) return 'Not recorded';
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function dateOnly(value?: string | null) {
  if (!value) return 'Not recorded';
  return new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function answerText(v: unknown): string {
  if (Array.isArray(v)) return v.map(String).join(', ');
  return String(v ?? '');
}

export function NavButton({ label, description, icon, active, onClick }: { label: string; description: string; icon: Icon; active: boolean; onClick: () => void }) {
  const IconComp = icon;
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${active ? 'bg-white text-[#102548] shadow-lg shadow-black/10' : 'text-white/72 hover:bg-white/10 hover:text-white'}`}>
      <IconComp className="h-5 w-5 shrink-0" />
      <span>
        <span className="block text-sm font-bold">{label}</span>
        <span className={`block text-xs ${active ? 'text-[#5f6b80]' : 'text-white/45'}`}>{description}</span>
      </span>
    </button>
  );
}

export function MetricCard({ label, value, icon, accent, detail, sub }: { label: string; value: number | string; icon: Icon; accent: 'blue' | 'green' | 'amber' | 'purple'; detail: string; sub?: string }) {
  const IconComp = icon;
  const accentClass = {
    blue: 'bg-[#e7f4ff] text-[#0077B6]',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
  }[accent];
  return (
    <div className="rounded-lg border border-white bg-white p-4 shadow-[0_10px_30px_rgba(16,37,72,0.07)]">
      <div className="mb-5 flex items-center justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${accentClass}`}>
          <IconComp className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-[#f2f5f9] px-2.5 py-1 text-xs font-semibold text-[#64718a]">{detail}</span>
      </div>
      <div className="text-3xl font-extrabold text-[#102548]">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="text-sm font-medium text-[#64718a]">{label}</div>
      {sub && <div className="mt-1 text-xs text-[#9aa5b7]">{sub}</div>}
    </div>
  );
}

export function SectionHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-b border-[#edf1f6] px-5 py-4 md:flex-row md:items-center md:justify-between">
      <h2 className="text-lg font-extrabold text-[#102548]">{title}</h2>
      <div className="flex items-center gap-3">
        <p className="text-sm text-[#64718a]">{subtitle}</p>
        {actions}
      </div>
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'blue' | 'amber' | 'green' | 'purple' }) {
  const cls = {
    neutral: 'bg-[#edf2f7] text-[#26334d]',
    blue: 'bg-[#e7f4ff] text-[#0077B6]',
    amber: 'bg-amber-100 text-amber-800',
    green: 'bg-emerald-100 text-emerald-700',
    purple: 'bg-purple-100 text-purple-800',
  }[tone];
  return <span className={`rounded-full px-2.5 py-1 ${cls}`}>{children}</span>;
}

export function statusPillClass(status: LeadStatus): string {
  return {
    new: 'bg-[#e7f4ff] text-[#0077B6]',
    contacted: 'bg-amber-100 text-amber-800',
    interested: 'bg-purple-100 text-purple-800',
    converted: 'bg-emerald-100 text-emerald-700',
    lost: 'bg-[#edf2f7] text-[#64718a]',
  }[status];
}

export function StatusPill({ status }: { status?: LeadStatus }) {
  const s: LeadStatus = status || 'new';
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusPillClass(s)}`}>{s}</span>;
}

export function EmptyState({ icon, title, body }: { icon: Icon; title: string; body: string }) {
  const IconComp = icon;
  return (
    <div className="grid place-items-center px-5 py-14 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-[#eef4fa] text-[#0077B6]">
        <IconComp className="h-6 w-6" />
      </div>
      <h3 className="mb-1 font-bold text-[#102548]">{title}</h3>
      <p className="max-w-sm text-sm leading-6 text-[#64718a]">{body}</p>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{message}</div>;
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full md:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74819a]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-[#c8d6e5] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20"
        placeholder={placeholder}
      />
    </div>
  );
}
