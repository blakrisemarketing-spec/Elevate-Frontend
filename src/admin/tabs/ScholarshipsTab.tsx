import { useEffect, useMemo, useRef, useState } from 'react';
import { readSheet } from 'read-excel-file/browser';
import { ArrowDown, ArrowUp, ChevronsUpDown, Database, GraduationCap, Pencil, Plus, UploadCloud } from 'lucide-react';
import { api, errorMessage, isAuthError } from '../api';
import type { Scholarship, ScholarshipsResponse } from '../api';
import { Badge, EmptyState, ErrorBanner, SearchBox, SectionHeader } from '../ui';
import { normalizeScholarshipRow, parseCsv, rowsToObjects } from '../scholarship-import';
import { ScholarshipEditorDrawer } from './ScholarshipEditorDrawer';
import type { AdminScholarship } from './ScholarshipEditorDrawer';

function summary(list?: string[]) {
  if (!list || list.length === 0) return '-';
  return list.join(', ');
}

const REGION_OPTIONS = ['uk', 'us', 'canada', 'europe', 'australia', 'new-zealand', 'asia', 'africa', 'any'];
const FIELD_OPTIONS = ['business', 'stem', 'health', 'social', 'law', 'arts', 'any'];
const DEGREE_OPTIONS = ['taught', 'research', 'mba', 'phd', 'any'];
const FUNDING_OPTIONS = ['full', 'partial', 'self-partly', 'flexible'];

type SortKey = 'name' | 'region' | 'fundingType' | 'weight' | 'active';
type SortDir = 'asc' | 'desc';

const selectClass =
  'h-11 rounded-lg border border-[#d3ddea] bg-white px-3 text-sm font-medium text-[#26334d] focus:border-[#0077B6] focus:outline-none';

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.06em] text-[#64718a]">
      {label}
      <select className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function SortHeader({ label, col, sortKey, sortDir, onSort, className }: { label: string; col: SortKey; sortKey: SortKey; sortDir: SortDir; onSort: (c: SortKey) => void; className?: string }) {
  const active = sortKey === col;
  const Icon = !active ? ChevronsUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th className={`px-5 py-3 ${className || ''}`}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.08em] transition hover:text-[#0077B6] ${active ? 'text-[#0077B6]' : 'text-[#64718a]'}`}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </button>
    </th>
  );
}

export function ScholarshipsTab({ refreshKey, onAuthError }: { refreshKey: number; onAuthError: () => void }) {
  const [scholarships, setScholarships] = useState<AdminScholarship[]>([]);
  const [importPreview, setImportPreview] = useState<Scholarship[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'off'>('all');
  const [regionFilter, setRegionFilter] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [degreeFilter, setDegreeFilter] = useState('');
  const [fundingFilter, setFundingFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<AdminScholarship | null>(null);
  const [adding, setAdding] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function onSort(col: SortKey) {
    if (col === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col);
      setSortDir(col === 'weight' ? 'desc' : 'asc'); // weight most useful high-first
    }
  }

  const filtersActive =
    statusFilter !== 'all' || regionFilter !== '' || fieldFilter !== '' || degreeFilter !== '' || fundingFilter !== '' || query.trim() !== '';

  function clearFilters() {
    setQuery('');
    setStatusFilter('all');
    setRegionFilter('');
    setFieldFilter('');
    setDegreeFilter('');
    setFundingFilter('');
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError('');
      try {
        const res = await api<ScholarshipsResponse>('/api/admin-scholarships.php');
        if (!cancelled) setScholarships((res.scholarships || []) as AdminScholarship[]);
      } catch (e) {
        if (cancelled) return;
        if (isAuthError(e)) {
          onAuthError();
          return;
        }
        setError(errorMessage(e, 'Could not load scholarships'));
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, reloadKey]);

  async function onFile(file: File | null) {
    if (!file) return;
    const rows = file.name.toLowerCase().endsWith('.csv')
      ? rowsToObjects(parseCsv(await file.text()))
      : rowsToObjects(await readSheet(file));
    const next = rows.map(normalizeScholarshipRow).filter((x): x is Scholarship => Boolean(x));
    setImportPreview(next);
  }

  async function saveScholarships() {
    if (!window.confirm(`Import ${importPreview.length} scholarship(s)? New ones are added and matching ids are updated. Nothing else in the engine changes.`)) return;
    setBusy(true);
    setError('');
    try {
      await api('/api/admin-scholarships.php', { method: 'POST', body: JSON.stringify({ scholarships: importPreview }) });
      setImportPreview([]);
      setReloadKey((k) => k + 1);
    } catch (err) {
      if (isAuthError(err)) {
        onAuthError();
        return;
      }
      setError(errorMessage(err, 'Import failed'));
    } finally {
      setBusy(false);
    }
  }

  function onSaved(saved: AdminScholarship) {
    setScholarships((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx === -1) return [...prev, saved];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
  }

  function onDeleted(id: string) {
    setScholarships((prev) => prev.filter((s) => s.id !== id));
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const dir = sortDir === 'asc' ? 1 : -1;
    return scholarships
      .filter((s) => {
        if (statusFilter === 'live' && s.active === false) return false;
        if (statusFilter === 'off' && s.active !== false) return false;
        if (regionFilter && !(s.regions || []).includes(regionFilter)) return false;
        if (fieldFilter && !(s.fields || []).includes(fieldFilter)) return false;
        if (degreeFilter && !(s.degrees || []).includes(degreeFilter)) return false;
        if (fundingFilter && !(s.funding || []).includes(fundingFilter)) return false;
        if (needle) {
          const hay = [s.name, s.region, s.fundingType, s.blurb, (s.tags || []).join(' ')].join(' ').toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortKey) {
          case 'weight':
            return ((a.weight || 0) - (b.weight || 0)) * dir;
          case 'active':
            return ((a.active === false ? 0 : 1) - (b.active === false ? 0 : 1)) * dir;
          case 'region':
            return (a.region || '').localeCompare(b.region || '') * dir;
          case 'fundingType':
            return (a.fundingType || '').localeCompare(b.fundingType || '') * dir;
          default:
            return a.name.localeCompare(b.name) * dir;
        }
      });
  }, [scholarships, query, statusFilter, regionFilter, fieldFilter, degreeFilter, fundingFilter, sortKey, sortDir]);

  const drawerOpen = adding || editing !== null;

  return (
    <>
      <ErrorBanner message={error} />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchBox value={query} onChange={setQuery} placeholder="Search by name, region, funding, tags" />
        <div className="flex items-center gap-3">
          <p className="whitespace-nowrap text-sm text-[#64718a]">
            {busy ? 'Syncing data...' : `${scholarships.length.toLocaleString()} scholarships in the engine`}
          </p>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setAdding(true);
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#102548] px-4 text-sm font-semibold text-white transition hover:bg-[#173661]"
          >
            <Plus className="h-4 w-4" /> Add scholarship
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#e2e8f2] bg-white px-4 py-3 shadow-[0_8px_28px_rgba(16,37,72,0.06)]">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.06em] text-[#64718a]">
          Status
          <select className={selectClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'live' | 'off')}>
            <option value="all">All</option>
            <option value="live">Live only</option>
            <option value="off">Off only</option>
          </select>
        </label>
        <FilterSelect label="Region" value={regionFilter} onChange={setRegionFilter} options={REGION_OPTIONS} />
        <FilterSelect label="Field" value={fieldFilter} onChange={setFieldFilter} options={FIELD_OPTIONS} />
        <FilterSelect label="Degree" value={degreeFilter} onChange={setDegreeFilter} options={DEGREE_OPTIONS} />
        <FilterSelect label="Funding" value={fundingFilter} onChange={setFundingFilter} options={FUNDING_OPTIONS} />
        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="ml-auto inline-flex h-9 items-center rounded-lg border border-[#d3ddea] bg-white px-3 text-sm font-semibold text-[#102548] transition hover:border-[#0077B6] hover:text-[#0077B6]"
          >
            Clear filters
          </button>
        )}
      </div>

      <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
        <SectionHeader
          title="Scholarship database"
          subtitle={
            filtersActive
              ? `${visible.length.toLocaleString()} of ${scholarships.length.toLocaleString()} match`
              : `${scholarships.length.toLocaleString()} records`
          }
        />
        {visible.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No scholarships in this view"
            body="Add a scholarship, clear the search filter, or import a reviewed sheet below."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full text-sm">
              <thead className="bg-[#f6f8fb] text-left">
                <tr>
                  <SortHeader label="Name" col="name" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Region" col="region" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Funding type" col="fundingType" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">Fields / Degrees</th>
                  <SortHeader label="Weight" col="weight" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Active" col="active" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <th className="px-5 py-3">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f6]">
                {visible.map((s) => {
                  const off = s.active === false;
                  return (
                    <tr
                      key={s.id}
                      className={`cursor-pointer hover:bg-[#f9fbfd] ${off ? 'opacity-55' : ''}`}
                      onClick={() => {
                        setAdding(false);
                        setEditing(s);
                      }}
                    >
                      <td className="px-5 py-4">
                        <strong className="text-[#102548]">{s.name}</strong>
                        <br />
                        <span className="font-mono text-xs text-[#9aa5b7]">{s.id}</span>
                      </td>
                      <td className="px-5 py-4 text-[#26334d]">{s.region || '-'}</td>
                      <td className="px-5 py-4 text-[#26334d]">{s.fundingType || '-'}</td>
                      <td className="px-5 py-4 text-xs text-[#64718a]">
                        <div>{summary(s.fields)}</div>
                        <div className="text-[#9aa5b7]">{summary(s.degrees)}</div>
                      </td>
                      <td className="px-5 py-4 text-[#26334d]">{s.weight ?? '-'}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold">
                          <Badge tone={off ? 'neutral' : 'green'}>{off ? 'Off' : 'Live'}</Badge>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0077B6]">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <details className="mt-6 overflow-hidden rounded-lg border border-[#e2e8f2] bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-bold text-[#102548] [&::-webkit-details-marker]:hidden">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef4fa] text-[#0077B6]">
            <UploadCloud className="h-5 w-5" />
          </span>
          Bulk import (CSV / XLSX)
          <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Adds to the engine
          </span>
        </summary>
        <div className="border-t border-[#edf1f6] p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex min-h-[110px] w-full items-center gap-4 rounded-lg border border-dashed border-[#9ab5cf] bg-[#f7fbff] px-5 py-4 text-left transition hover:border-[#0077B6] hover:bg-[#eef8ff]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-white text-[#0077B6] shadow-sm">
                <UploadCloud className="h-6 w-6" />
              </span>
              <span>
                <span className="block font-bold text-[#102548]">Upload reviewed CSV or XLSX</span>
                <span className="block text-sm text-[#64718a]">
                  Adds new scholarships and updates any with a matching id. Existing scholarships not in the file are left as-is.
                </span>
              </span>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
              className="sr-only"
            />
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {importPreview.length > 0 && (
                <button
                  type="button"
                  className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#c8d6e5] bg-white px-4 py-2 text-sm font-semibold text-[#102548] hover:border-[#0077B6]"
                  onClick={() => setImportPreview([])}
                >
                  Clear preview
                </button>
              )}
              {importPreview.length > 0 && (
                <button
                  type="button"
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-[#102548] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173661]"
                  disabled={busy}
                  onClick={saveScholarships}
                >
                  <Database className="h-4 w-4" /> Import {importPreview.length} into engine
                </button>
              )}
            </div>
          </div>

          {importPreview.length > 0 && (
            <div className="mt-4 grid divide-y divide-[#edf1f6] rounded-lg border border-[#edf1f6]">
              {importPreview.slice(0, 40).map((s) => (
                <div key={s.id} className="p-4">
                  <div className="mb-1 flex flex-wrap gap-2 text-xs font-bold">
                    <Badge>{s.region}</Badge>
                    <Badge tone="blue">{s.fundingType}</Badge>
                  </div>
                  <h3 className="font-bold text-[#102548]">{s.name}</h3>
                  <p className="mt-1 max-w-4xl text-sm leading-6 text-[#64718a]">{s.blurb}</p>
                </div>
              ))}
              {importPreview.length > 40 && (
                <p className="p-3 text-center text-xs text-[#64718a]">
                  and {importPreview.length - 40} more staged records
                </p>
              )}
            </div>
          )}
        </div>
      </details>

      {drawerOpen && (
        <ScholarshipEditorDrawer
          scholarship={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onAuthError={onAuthError}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}
    </>
  );
}
