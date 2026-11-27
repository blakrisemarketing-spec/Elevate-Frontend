import { useEffect, useMemo, useState } from 'react';
import { BadgePercent, Coins, Megaphone, Repeat, Target, TrendingUp, UsersRound } from 'lucide-react';
import { api, errorMessage, isAuthError } from '../api';
import { ErrorBanner, MetricCard, SectionHeader } from '../ui';
import { cedis, channelLabel, humanize, METHOD_LABELS, pct } from '../ops-api';
import type { GrowthMonth, GrowthResponse, GrowthStats } from '../ops-api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Validated (dataviz validator, light surface): brand blue + orange pass CVD and contrast.
const SERIES_PAYSTACK = '#0077B6';
const SERIES_OFFLINE = '#eb6834';
const orders = (n: number) => `${n} order${n === 1 ? '' : 's'}`;

/** How much of each month of `year` has elapsed, 0..1 per month. */
function elapsedByMonth(year: number, now = new Date()): number[] {
  return MONTHS.map((_, i) => {
    const start = Date.UTC(year, i, 1);
    const end = Date.UTC(year, i + 1, 1);
    const t = now.getTime();
    if (t <= start) return 0;
    if (t >= end) return 1;
    return (t - start) / (end - start);
  });
}

function pacing(stats: GrowthStats) {
  const elapsed = elapsedByMonth(stats.year);
  const targets = stats.goal.monthly || [];
  const expected = targets.reduce((sum, t, i) => sum + t * (elapsed[i] || 0), 0);
  const ytd = stats.totals.revenuePesewas;
  const goal = stats.goal.revenueTargetPesewas;
  const yearFraction = elapsed.reduce((a, b) => a + b, 0) / 12;
  const monthsLeft = 12 - elapsed.reduce((a, b) => a + b, 0);
  const remaining = Math.max(0, goal - ytd);
  return {
    ytd,
    goal,
    expected,
    gap: ytd - expected,
    projected: yearFraction > 0.02 ? Math.round(ytd / yearFraction) : null,
    requiredPerMonth: monthsLeft > 0.05 ? Math.round(remaining / monthsLeft) : remaining,
    progress: goal > 0 ? Math.min(1, ytd / goal) : 0,
    expectedProgress: goal > 0 ? Math.min(1, expected / goal) : 0,
    yearFraction,
  };
}

export function GrowthTab({ refreshKey, onAuthError }: { refreshKey: number; onAuthError: () => void }) {
  const [year, setYear] = useState(() => new Date().getUTCFullYear() < 2027 ? 2027 : new Date().getUTCFullYear());
  const [data, setData] = useState<GrowthResponse | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    setError('');
    api<GrowthResponse>(`/api/admin-growth.php?year=${year}`)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => {
        if (cancelled) return;
        if (isAuthError(e)) return onAuthError();
        setError(errorMessage(e, 'Could not load growth data'));
      })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, refreshKey]);

  const stats = data?.stats;
  const pace = useMemo(() => (stats ? pacing(stats) : null), [stats]);
  const years = useMemo(() => {
    const set = new Set<number>([...(stats?.availableYears || []), 2027, new Date().getUTCFullYear()]);
    return [...set].sort((a, b) => b - a);
  }, [stats]);

  return (
    <>
      <ErrorBanner message={error} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="growth-year" className="text-sm font-semibold text-[#26334d]">Year</label>
          <select id="growth-year" value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-10 rounded-lg border border-[#c8d6e5] bg-white px-3 text-sm">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <p className="text-sm text-[#64718a]">{busy ? 'Syncing data...' : 'Paystack + offline sales, live from Supabase'}</p>
      </div>

      {stats && pace && (
        <>
          <GoalPacing stats={stats} pace={pace} />
          <KpiRow stats={stats} />
          <MonthlyChart months={stats.monthly} />
          <div className="mb-6 grid gap-6 xl:grid-cols-2">
            <CategoryBars stats={stats} labels={data?.categories || {}} />
            <MethodMix stats={stats} />
          </div>
          <ChannelTable stats={stats} />
          <div className="mb-6 grid gap-6 xl:grid-cols-[3fr_2fr]">
            <TopProducts stats={stats} labels={data?.categories || {}} />
            <NextPurchases stats={stats} />
          </div>
        </>
      )}
    </>
  );
}

function GoalPacing({ stats, pace }: { stats: GrowthStats; pace: ReturnType<typeof pacing> }) {
  const ahead = pace.gap >= 0;
  return (
    <section className="mb-6 rounded-lg border border-white bg-white p-5 shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0077B6]">{stats.year} revenue goal</p>
          <p className="mt-1 text-4xl font-extrabold text-[#102548]">{cedis(pace.ytd)}</p>
          <p className="text-sm text-[#64718a]">of {cedis(pace.goal)} target · {pct(pace.ytd, pace.goal)} achieved</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-[#64718a]">Expected by today</p>
            <p className="text-lg font-extrabold text-[#102548]">{cedis(pace.expected)}</p>
          </div>
          <div>
            <p className="text-[#64718a]">{ahead ? 'Ahead of pace' : 'Behind pace'}</p>
            <p className={`text-lg font-extrabold ${ahead ? 'text-emerald-700' : 'text-red-700'}`}>{ahead ? '▲ ' : '▼ '}{cedis(Math.abs(pace.gap))}</p>
          </div>
          <div>
            <p className="text-[#64718a]">Needed per month from now</p>
            <p className="text-lg font-extrabold text-[#102548]">{cedis(pace.requiredPerMonth)}</p>
          </div>
        </div>
      </div>
      <div className="relative mt-5 h-4 rounded-full bg-[#edf2f7]" role="img" aria-label={`Progress ${pct(pace.ytd, pace.goal)} of goal; expected ${pct(pace.expected, pace.goal)} by today`}>
        <div className="h-4 rounded-full bg-[#0077B6]" style={{ width: `${pace.progress * 100}%` }} />
        {pace.expectedProgress > 0 && (
          <div className="absolute -top-1 h-6 w-[3px] rounded bg-[#102548]" style={{ left: `calc(${pace.expectedProgress * 100}% - 1px)` }} title="Where we should be today" />
        )}
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-[#64718a]">
        <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#0077B6]" />Revenue so far</span>
        <span><span className="mr-1 inline-block h-3 w-[3px] rounded bg-[#102548] align-middle" />Expected by today (monthly targets)</span>
        <span>{pace.projected !== null ? `At this pace, year-end lands near ${cedis(pace.projected)}` : 'Projection starts once the year is under way'}</span>
      </div>
    </section>
  );
}

function KpiRow({ stats }: { stats: GrowthStats }) {
  const t = stats.totals;
  const aov = t.orders ? Math.round(t.revenuePesewas / t.orders) : 0;
  const cac = t.newClients && t.spendPesewas ? Math.round(t.spendPesewas / t.newClients) : 0;
  const roas = t.spendPesewas ? (t.revenuePesewas / t.spendPesewas) : 0;
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <MetricCard label="Orders" value={t.orders} icon={Coins} accent="blue" detail={`AOV ${cedis(aov)}`} />
      <MetricCard label="New clients" value={t.newClients} icon={UsersRound} accent="green" detail={stats.goal.clientsTarget ? `goal ${stats.goal.clientsTarget}` : `${t.activeClients} active`} />
      <MetricCard label="Marketing spend" value={cedis(t.spendPesewas, true)} icon={Megaphone} accent="amber" detail={cac ? `CAC ${cedis(cac)}` : 'no CAC yet'} />
      <MetricCard label="Return on ad spend" value={roas ? `${roas.toFixed(1)}x` : '–'} icon={TrendingUp} accent="purple" detail="revenue ÷ spend" />
      <MetricCard label="Repeat clients" value={pct(t.repeatClients, t.clientsWithOrders)} icon={Repeat} accent="blue" detail={`${t.repeatClients} of ${t.clientsWithOrders}`} sub="all time" />
      <MetricCard label="Lead → client" value={pct(t.leadsConverted, t.leads)} icon={BadgePercent} accent="green" detail={`${t.leads} lead${t.leads === 1 ? "" : "s"}`} />
    </div>
  );
}

function MonthlyChart({ months }: { months: GrowthMonth[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const max = Math.max(1, ...months.map((m) => Math.max(m.revenue, m.target, m.prevYear)));
  const W = 760;
  const H = 260;
  const padL = 70;
  const padB = 28;
  const padT = 12;
  const plotH = H - padB - padT;
  const slot = (W - padL) / 12;
  const barW = Math.min(34, slot * 0.56);
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const h = hover !== null ? months[hover] : null;

  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
      <SectionHeader
        title="Revenue by month vs target"
        subtitle="Stacked: Paystack + offline"
        actions={<button type="button" className="text-sm font-semibold text-[#0077B6] hover:underline" onClick={() => setShowTable((s) => !s)}>{showTable ? 'Show chart' : 'Show table'}</button>}
      />
      <div className="flex flex-wrap gap-4 px-5 pt-4 text-xs text-[#26334d]">
        <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: SERIES_PAYSTACK }} />Paystack</span>
        <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: SERIES_OFFLINE }} />Offline (MoMo, bank, cash)</span>
        <span><span className="mr-1.5 inline-block h-[2px] w-4 align-middle bg-[#102548]" />Monthly target</span>
        <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full border-2 border-[#64718a] align-middle" />Same month last year</span>
      </div>
      {showTable ? (
        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">
              <tr><th className="py-2">Month</th><th>Paystack</th><th>Offline</th><th>Total</th><th>Target</th><th>Last year</th><th>Orders</th><th>New clients</th><th>Spend</th></tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f6]">
              {months.map((m) => (
                <tr key={m.m}><td className="py-2 font-semibold">{MONTHS[m.m - 1]}</td><td>{cedis(m.paystack)}</td><td>{cedis(m.offline)}</td><td className="font-bold">{cedis(m.revenue)}</td><td>{cedis(m.target)}</td><td>{cedis(m.prevYear)}</td><td>{m.orders}</td><td>{m.newClients}</td><td>{cedis(m.spend)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative px-3 pb-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Monthly revenue against target">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke="#edf1f6" strokeWidth={1} />
                <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#64718a">{cedis(t, true)}</text>
              </g>
            ))}
            {months.map((m, i) => {
              const cx = padL + slot * i + slot / 2;
              const x = cx - barW / 2;
              const yP = y(m.paystack);
              const yO = y(m.paystack + m.offline);
              const offlineH = Math.max(0, yP - yO - (m.paystack > 0 ? 2 : 0));
              return (
                <g key={m.m} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <rect x={padL + slot * i} y={padT} width={slot} height={plotH} fill={hover === i ? '#f3f7fb' : 'transparent'} />
                  {m.paystack > 0 && <rect x={x} y={yP} width={barW} height={y(0) - yP} rx={m.offline > 0 ? 0 : 4} fill={SERIES_PAYSTACK} />}
                  {m.offline > 0 && <rect x={x} y={yO} width={barW} height={offlineH} rx={4} fill={SERIES_OFFLINE} />}
                  {m.target > 0 && <line x1={x - 6} x2={x + barW + 6} y1={y(m.target)} y2={y(m.target)} stroke="#102548" strokeWidth={2} />}
                  {m.prevYear > 0 && <circle cx={cx} cy={y(m.prevYear)} r={4} fill="#fff" stroke="#64718a" strokeWidth={2} />}
                  <text x={cx} y={H - 8} textAnchor="middle" fontSize={11} fill="#64718a">{MONTHS[i]}</text>
                </g>
              );
            })}
          </svg>
          {h && (
            <div className="pointer-events-none absolute top-2 rounded-lg border border-[#e3e9f1] bg-white px-3 py-2 text-xs shadow-lg" style={{ left: `${Math.min(78, ((padL + slot * (hover as number)) / W) * 100 + 4)}%` }}>
              <p className="mb-1 font-bold text-[#102548]">{MONTHS[h.m - 1]}</p>
              <p className="text-[#26334d]">Total <strong>{cedis(h.revenue)}</strong> · target {cedis(h.target)}</p>
              <p className="text-[#26334d]">Paystack {cedis(h.paystack)} · offline {cedis(h.offline)}</p>
              <p className="text-[#64718a]">{orders(h.orders)} · {h.newClients} new client{h.newClients === 1 ? '' : 's'} · spend {cedis(h.spend)}</p>
              <p className="text-[#64718a]">Last year {cedis(h.prevYear)}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function HBar({ label, value, max, detail }: { label: string; value: number; max: number; detail: string }) {
  return (
    <div className="grid grid-cols-[minmax(110px,1fr)_2fr] items-center gap-3 py-1.5 text-sm" title={`${label}: ${cedis(value)} · ${detail}`}>
      <span className="truncate text-[#26334d]">{label}</span>
      <div className="flex items-center gap-2">
        <div className="h-3 rounded-r bg-[#0077B6]" style={{ width: `${Math.max(1, (value / Math.max(1, max)) * 100)}%`, minWidth: value > 0 ? 4 : 0 }} />
        <span className="whitespace-nowrap text-xs text-[#26334d]"><strong>{cedis(value, true)}</strong> · {detail}</span>
      </div>
    </div>
  );
}

function CategoryBars({ stats, labels }: { stats: GrowthStats; labels: Record<string, string> }) {
  const max = Math.max(0, ...stats.byCategory.map((c) => c.revenue));
  return (
    <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
      <SectionHeader title="Revenue by category" subtitle={`${stats.year}`} />
      <div className="px-5 py-4">
        {stats.byCategory.length === 0 ? <p className="text-sm text-[#64718a]">No sales recorded for {stats.year} yet.</p>
          : stats.byCategory.map((c) => (
            <HBar key={c.category} label={labels[c.category] || humanize(c.category)} value={c.revenue} max={max} detail={`${orders(c.orders)} · ${pct(c.revenue, stats.totals.revenuePesewas)}`} />
          ))}
      </div>
    </section>
  );
}

function MethodMix({ stats }: { stats: GrowthStats }) {
  const max = Math.max(0, ...stats.byMethod.map((c) => c.revenue));
  return (
    <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
      <SectionHeader title="How clients pay" subtitle="Revenue by payment method" />
      <div className="px-5 py-4">
        {stats.byMethod.length === 0 ? <p className="text-sm text-[#64718a]">No sales recorded for {stats.year} yet.</p>
          : stats.byMethod.map((c) => (
            <HBar key={c.method} label={METHOD_LABELS[c.method] || humanize(c.method)} value={c.revenue} max={max} detail={`${orders(c.orders)} · ${pct(c.revenue, stats.totals.revenuePesewas)}`} />
          ))}
      </div>
    </section>
  );
}

function ChannelTable({ stats }: { stats: GrowthStats }) {
  const rows = [...stats.byChannel].sort((a, b) => (b.revenue + b.spend) - (a.revenue + a.spend) || b.leads - a.leads);
  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
      <SectionHeader title="Acquisition channels" subtitle="Where new clients come from, and what they cost" />
      {rows.length === 0 ? <p className="px-5 py-6 text-sm text-[#64718a]">No leads, clients or spend for {stats.year} yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-[#f6f8fb] text-left text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">
              <tr>
                <th className="px-5 py-3">Channel</th><th className="px-3 py-3">Leads</th><th className="px-3 py-3">New clients</th>
                <th className="px-3 py-3">Spend</th><th className="px-3 py-3">CAC</th><th className="px-3 py-3" title="Revenue in the year from clients first acquired this year">New-client revenue</th>
                <th className="px-3 py-3">ROAS</th><th className="px-3 py-3" title="All revenue in the year from clients acquired through this channel at any time">All revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f6]">
              {rows.map((r) => {
                const cac = r.newClients && r.spend ? Math.round(r.spend / r.newClients) : null;
                const roas = r.spend ? r.revenue / r.spend : null;
                return (
                  <tr key={r.channel} className="hover:bg-[#f9fbfd]">
                    <td className="px-5 py-3 font-semibold text-[#102548]">{channelLabel(r.channel)}</td>
                    <td className="px-3 py-3">{r.leads}</td>
                    <td className="px-3 py-3">{r.newClients}</td>
                    <td className="px-3 py-3">{r.spend ? cedis(r.spend) : '–'}</td>
                    <td className="px-3 py-3">{cac !== null ? cedis(cac) : '–'}</td>
                    <td className="px-3 py-3">{cedis(r.revenue)}</td>
                    <td className={`px-3 py-3 font-bold ${roas === null ? 'text-[#64718a]' : roas >= 1 ? 'text-emerald-700' : 'text-red-700'}`}>{roas !== null ? `${roas.toFixed(1)}x` : '–'}</td>
                    <td className="px-3 py-3">{cedis(r.allRevenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="px-5 py-3 text-xs text-[#64718a]">Channel comes from UTM tags and referrers on the first touch we saw (quiz or checkout), or the channel picked when an offline sale is recorded. Tag every ad link with <code>utm_source</code> so it lands in the right row.</p>
        </div>
      )}
    </section>
  );
}

function TopProducts({ stats, labels }: { stats: GrowthStats; labels: Record<string, string> }) {
  return (
    <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
      <SectionHeader title="Top products and services" subtitle="By revenue" />
      {stats.byProduct.length === 0 ? <p className="px-5 py-6 text-sm text-[#64718a]">No sales recorded for {stats.year} yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-[#f6f8fb] text-left text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">
              <tr><th className="px-5 py-3">Item</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Orders</th><th className="px-3 py-3">Revenue</th><th className="px-3 py-3">Share</th></tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f6]">
              {stats.byProduct.map((p) => (
                <tr key={p.serviceId || p.name}>
                  <td className="px-5 py-3 font-semibold text-[#102548]">{p.name || p.serviceId}</td>
                  <td className="px-3 py-3 text-[#64718a]">{labels[p.category] || humanize(p.category)}</td>
                  <td className="px-3 py-3">{p.orders}</td>
                  <td className="px-3 py-3 font-bold">{cedis(p.revenue)}</td>
                  <td className="px-3 py-3">{pct(p.revenue, stats.totals.revenuePesewas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function NextPurchases({ stats }: { stats: GrowthStats }) {
  return (
    <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
      <SectionHeader title="What clients buy next" subtitle="All time" />
      <div className="px-5 py-4">
        {stats.pairs.length === 0 ? (
          <p className="text-sm leading-6 text-[#64718a]">No repeat purchases yet. As clients come back, the most common "bought X, then Y" paths show here, the best cue for upsell offers and bundles.</p>
        ) : (
          <ol className="space-y-3 text-sm">
            {stats.pairs.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-[#0077B6]" />
                <span><strong className="text-[#102548]">{p.from}</strong> <span className="text-[#64718a]">then</span> <strong className="text-[#102548]">{p.to}</strong> <span className="text-[#64718a]">({p.count}×)</span></span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
