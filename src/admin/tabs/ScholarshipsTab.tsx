import { useEffect, useMemo, useRef, useState } from 'react';
import { readSheet } from 'read-excel-file/browser';
import { Database, GraduationCap, UploadCloud } from 'lucide-react';
import { api, errorMessage, isAuthError } from '../api';
import type { Scholarship, ScholarshipsResponse } from '../api';
import { Badge, EmptyState, ErrorBanner, SearchBox, SectionHeader } from '../ui';
import { normalizeScholarshipRow, parseCsv, rowsToObjects } from '../scholarship-import';

export function ScholarshipsTab({ refreshKey, onAuthError }: { refreshKey: number; onAuthError: () => void }) {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [importPreview, setImportPreview] = useState<Scholarship[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError('');
      try {
        const res = await api<ScholarshipsResponse>('/api/admin-scholarships.php');
        if (!cancelled) setScholarships(res.scholarships || []);
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

  const current = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = importPreview.length ? importPreview : scholarships;
    if (!needle) return list;
    return list.filter((s) => [s.name, s.region, s.fundingType, s.blurb]
      .some((x) => String(x || '').toLowerCase().includes(needle)));
  }, [importPreview, query, scholarships]);

  const previewCount = importPreview.length;

  return (
    <>
      <ErrorBanner message={error} />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchBox value={query} onChange={setQuery} placeholder="Search scholarships" />
        <p className="whitespace-nowrap text-sm text-[#64718a]">{busy ? 'Syncing data...' : 'Data loaded from private PHP endpoints'}</p>
      </div>

      <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
        <SectionHeader title="Scholarship database" subtitle={previewCount ? `${previewCount} staged records ready to save` : `${current.length} visible records`} />
        <div className="border-b border-[#edf1f6] p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <button type="button" onClick={() => fileInput.current?.click()} className="flex min-h-[118px] w-full items-center gap-4 rounded-lg border border-dashed border-[#9ab5cf] bg-[#f7fbff] px-5 py-4 text-left transition hover:border-[#0077B6] hover:bg-[#eef8ff]">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-white text-[#0077B6] shadow-sm"><UploadCloud className="h-6 w-6" /></span>
              <span>
                <span className="block font-bold text-[#102548]">Upload reviewed CSV or XLSX</span>
                <span className="block text-sm text-[#64718a]">The preview appears below before it replaces the runtime scholarship feed.</span>
              </span>
            </button>
            <input ref={fileInput} type="file" accept=".csv,.xlsx,.xls" onChange={(e) => onFile(e.target.files?.[0] || null)} className="sr-only" />
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {previewCount > 0 && <button type="button" className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#c8d6e5] bg-white px-4 py-2 text-sm font-semibold text-[#102548] hover:border-[#0077B6]" onClick={() => setImportPreview([])}>Clear preview</button>}
              {previewCount > 0 && <button type="button" className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-[#102548] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173661]" disabled={busy} onClick={saveScholarships}><Database className="h-4 w-4" /> Save {previewCount}</button>}
            </div>
          </div>
        </div>
        {current.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No scholarships in this view" body="Upload a reviewed sheet or clear the search filter to see records." />
        ) : (
          <div className="grid divide-y divide-[#edf1f6]">
            {current.slice(0, 40).map((s) => (
              <div key={s.id} className="p-5 hover:bg-[#f9fbfd]">
                <div className="mb-2 flex flex-wrap gap-2 text-xs font-bold">
                  <Badge>{s.region}</Badge>
                  <Badge tone="blue">{s.fundingType}</Badge>
                  {s.genderEligibility && s.genderEligibility !== 'any' && <Badge tone="amber">{s.genderEligibility} only</Badge>}
                </div>
                <h3 className="font-bold text-[#102548]">{s.name}</h3>
                <p className="mt-1 max-w-4xl text-sm leading-6 text-[#64718a]">{s.blurb}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
