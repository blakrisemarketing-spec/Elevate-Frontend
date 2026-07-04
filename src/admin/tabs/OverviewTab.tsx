import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Database, ReceiptText, TrendingUp, UsersRound, Wallet } from 'lucide-react';
import { api, errorMessage, isAuthError, LEAD_STATUSES } from '../api';
import type { AdminStats, LegacyImportResponse, StatsResponse } from '../api';
import { ErrorBanner, MetricCard, dateShort, money, statusPillClass } from '../ui';

const FUNNEL_STEPS = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7'];
const CHART_DAYS = 90;

function chartDays(data: AdminStats['leadsOverTime']): { d: string; c: number }[] {
  const byDay = new Map(data.map((x) => [x.d, x.c]));
  const days: { d: string; c: number }[] = [];
  const today = new Date();
  for (let i = CHART_DAYS - 1; i >= 0; i -= 1) {
    const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    days.push({ d: key, c: byDay.get(key) || 0 });
  }
  return days;
}

function LeadsChart({ data }: { data: AdminStats['leadsOverTime'] }) {
  const days = chartDays(data);
  const max = Math.max(1, ...days.map((x) => x.c));
  const w = 900;
  const h = 140;
  const gap = 2;
  const bw = (w - gap * (days.length - 1)) / days.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-36 w-full" role="img" aria-label={`New leads per day, last ${CHART_DAYS} days`} preserveAspectRatio="none">
      {days.map((day, i) => {
        const barHeight = day.c === 0 ? 2 : Math.max(4, (day.c / max) * (h - 6));
        return (
          <rect key={day.d} x={i * (bw + gap)} y={h - barHeight} width={bw} height={barHeight} rx={1.5} fill={day.c === 0 ? '#e3eaf3' : '#0077B6'}>
            <title>{`${day.d}: ${day.c} lead${day.c === 1 ? '' : 's'}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

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

export function OverviewTab({ refreshKey, onAuthError }: { refreshKey: number; onAuthError: () => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<Record<string, unknown> | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError('');
      try {
        const res = await api<StatsResponse>('/api/admin-stats.php');
        if (!cancelled) setStats(res.stats);
      } catch (e) {
        if (cancelled) return;
        if (isAuthError(e)) {
          onAuthError();
          return;
        }
        setError(errorMessage(e, 'Could not load the overview stats'));
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, reloadKey]);

  async function runLegacyImport() {
    if (!window.confirm('Imports the old file-based leads/campaign/purchases data into the database. Safe to re-run.')) return;
    setImporting(true);
    setError('');
    try {
      const res = await api<LegacyImportResponse>('/api/admin-import-legacy.php', { method: 'POST', body: '{}' });
      setImportReport(res.report || {});
      setReloadKey((k) => k + 1);
    } catch (e) {
      if (isAuthError(e)) {
        onAuthError();
        return;
      }
      setError(errorMessage(e, 'Legacy import failed'));
    } finally {
      setImporting(false);
    }
  }

  if (!stats) {
    return (
      <>
        <ErrorBanner message={error} />
        <div className="rounded-lg border border-white bg-white p-8 text-center text-sm text-[#64718a] shadow-[0_10px_30px_rgba(16,37,72,0.07)]">
          {busy ? 'Loading overview...' : 'Overview stats are not available yet.'}
        </div>
      </>
    );
  }

  const conversionPct = stats.leadsRealTotal > 0 ? (stats.convertedLeads / stats.leadsRealTotal) * 100 : 0;
  const funnelRows = [
    { key: 'enrolled', label: 'Enrolled', count: stats.enrolled },
    ...FUNNEL_STEPS.filter((step) => step in (stats.funnel || {})).map((step) => ({ key: step, label: step, count: stats.funnel[step] || 0 })),
  ];
  const funnelMax = Math.max(1, stats.enrolled);
  const suppressionEntries = Object.entries(stats.suppressions || {});
  const sourceEntries = Object.entries(stats.leadsBySource || {}).sort((a, b) => b[1] - a[1]);
  const sourceMax = Math.max(1, ...sourceEntries.map(([, c]) => c));
  const sourceFunnel = stats.sourceFunnel || [];

  return (
    <>
      <ErrorBanner message={error} />

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total leads"
          value={stats.leadsRealTotal}
          icon={UsersRound}
          accent="blue"
          detail="Real people"
          sub={stats.leadsTotal !== stats.leadsRealTotal ? `${stats.leadsTotal.toLocaleString()} incl. suspected bots` : undefined}
        />
        <MetricCard
          label="Conversion rate"
          value={`${conversionPct.toFixed(1)}%`}
          icon={TrendingUp}
          accent="purple"
          detail={`${stats.convertedLeads.toLocaleString()} converted`}
        />
        <MetricCard label="Revenue from leads" value={money(stats.revenueFromLeadsPesewas)} icon={Wallet} accent="green" detail="Attributed to leads" />
        <MetricCard label="Total purchases" value={stats.purchasesTotal} icon={ReceiptText} accent="amber" detail={money(stats.revenueTotalPesewas)} />
      </div>

      <div className="mb-6">
        <PanelCard title="Leads over time" subtitle={`Last ${CHART_DAYS} days`}>
          <LeadsChart data={stats.leadsOverTime || []} />
        </PanelCard>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <PanelCard title="Pipeline" subtitle="Leads by status">
          <div className="flex flex-wrap gap-2">
            {LEAD_STATUSES.map((s) => (
              <span key={s} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold capitalize ${statusPillClass(s)}`}>
                {s}
                <span className="font-extrabold">{(stats.leadsByStatus?.[s] || 0).toLocaleString()}</span>
              </span>
            ))}
          </div>
        </PanelCard>

        <PanelCard title="Campaign funnel" subtitle={`${stats.enrolled.toLocaleString()} enrolled`}>
          {funnelRows.length === 1 && stats.enrolled === 0 ? (
            <p className="text-sm text-[#64718a]">No leads enrolled in the email sequence yet.</p>
          ) : (
            <div className="grid gap-3">
              {funnelRows.map((row) => {
                const pct = Math.min(100, Math.max(row.count > 0 ? 2 : 0, (row.count / funnelMax) * 100));
                return (
                  <div key={row.key}>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-[#64718a]">
                      <span className={row.key === 'enrolled' ? '' : 'uppercase'}>{row.label}</span>
                      <span>{row.count.toLocaleString()}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#edf2f7]">
                      <div className={`h-3 rounded-full ${row.key === 'enrolled' ? 'bg-[#102548]' : 'bg-[#0077B6]'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PanelCard>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <PanelCard title="Suppressions" subtitle="Paused emails by reason">
          {suppressionEntries.length === 0 ? (
            <p className="text-sm text-[#64718a]">No suppressed emails.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {suppressionEntries.map(([reason, count]) => (
                <span key={reason} className="inline-flex items-center gap-1.5 rounded-full bg-[#edf2f7] px-3 py-1.5 text-sm font-bold text-[#26334d]">
                  {reason}
                  <span className="font-extrabold">{Number(count).toLocaleString()}</span>
                </span>
              ))}
            </div>
          )}
        </PanelCard>

        <PanelCard title="Legacy data" subtitle={stats.legacyImportDoneAt ? 'Import complete' : 'One-time migration'}>
          {stats.legacyImportDoneAt ? (
            <p className="text-xs text-[#9aa5b7]">Legacy data imported {dateShort(stats.legacyImportDoneAt)}</p>
          ) : (
            <>
              <p className="mb-3 text-sm leading-6 text-[#64718a]">Import the old file-based leads, campaign, and purchases data into the database. Safe to re-run.</p>
              <button
                type="button"
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-[#102548] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#173661] disabled:opacity-50"
                onClick={runLegacyImport}
                disabled={importing}
              >
                <Database className={`h-4 w-4 ${importing ? 'animate-spin' : ''}`} />
                {importing ? 'Importing (this can take a few minutes)...' : 'Import legacy data'}
              </button>
            </>
          )}
          {importReport && (
            <div className="mt-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#0077B6]">Import report</p>
              <pre className="overflow-x-auto rounded-lg bg-[#f6f8fb] p-3 text-xs leading-5 text-[#26334d]">{JSON.stringify(importReport, null, 2)}</pre>
            </div>
          )}
        </PanelCard>
      </div>

      <div className="mb-6">
        <PanelCard title="Lead sources" subtitle="Where leads come from, and what they convert to">
          {sourceEntries.length === 0 ? (
            <p className="text-sm text-[#64718a]">No lead source data yet.</p>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="grid gap-3">
                {sourceEntries.map(([source, count]) => {
                  const pct = Math.min(100, Math.max(count > 0 ? 2 : 0, (count / sourceMax) * 100));
                  return (
                    <div key={source}>
                      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-[#64718a]">
                        <span>{source}</span>
                        <span>{count.toLocaleString()}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-[#edf2f7]">
                        <div className="h-3 rounded-full bg-[#0077B6]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {sourceFunnel.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">
                      <tr>
                        <th className="pb-2 pr-3">Source</th>
                        <th className="pb-2 pr-3 text-right">Leads</th>
                        <th className="pb-2 pr-3 text-right">Converted</th>
                        <th className="pb-2 pr-3 text-right">Conv.%</th>
                        <th className="pb-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf1f6]">
                      {sourceFunnel.map((row) => {
                        const conv = row.leads > 0 ? (row.converted / row.leads) * 100 : 0;
                        return (
                          <tr key={row.source}>
                            <td className="py-2 pr-3 font-semibold text-[#102548]">{row.source}</td>
                            <td className="py-2 pr-3 text-right text-[#26334d]">{row.leads.toLocaleString()}</td>
                            <td className="py-2 pr-3 text-right text-[#26334d]">{row.converted.toLocaleString()}</td>
                            <td className="py-2 pr-3 text-right text-[#26334d]">{conv.toFixed(1)}%</td>
                            <td className="py-2 text-right font-bold text-[#102548]">{money(row.revenuePesewas)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </PanelCard>
      </div>
    </>
  );
}
