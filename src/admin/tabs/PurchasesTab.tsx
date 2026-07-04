import { useEffect, useMemo, useState } from 'react';
import { ReceiptText } from 'lucide-react';
import { api, errorMessage, isAuthError } from '../api';
import type { Purchase, PurchasesResponse } from '../api';
import { EmptyState, ErrorBanner, SearchBox, SectionHeader, dateShort, money } from '../ui';

export function PurchasesTab({ refreshKey, onAuthError }: { refreshKey: number; onAuthError: () => void }) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError('');
      try {
        const res = await api<PurchasesResponse>('/api/admin-purchases.php');
        if (!cancelled) setPurchases(res.items || []);
      } catch (e) {
        if (cancelled) return;
        if (isAuthError(e)) {
          onAuthError();
          return;
        }
        setError(errorMessage(e, 'Could not load purchases'));
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return purchases;
    return purchases.filter((p) => [p.buyerName, p.buyerEmail, p.itemName, p.serviceId, p.reference]
      .some((x) => String(x || '').toLowerCase().includes(needle)));
  }, [purchases, query]);

  return (
    <>
      <ErrorBanner message={error} />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchBox value={query} onChange={setQuery} placeholder="Search purchases" />
        <p className="whitespace-nowrap text-sm text-[#64718a]">{busy ? 'Syncing data...' : 'Data loaded from private PHP endpoints'}</p>
      </div>

      <section className="overflow-hidden rounded-lg border border-white bg-white shadow-[0_16px_45px_rgba(16,37,72,0.08)]">
        <SectionHeader title="Verified purchases" subtitle={`${filtered.length} visible records`} />
        {filtered.length === 0 ? (
          <EmptyState icon={ReceiptText} title="No purchases yet" body="Verified Paystack orders will appear here after checkout confirmation." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-sm">
              <thead className="bg-[#f6f8fb] text-left text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]">
                <tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Buyer</th><th className="px-5 py-3">Item</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Reference</th></tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f6]">
                {filtered.map((p, i) => (
                  <tr key={`${p.reference}-${i}`} className="hover:bg-[#f9fbfd]">
                    <td className="px-5 py-4 whitespace-nowrap text-[#64718a]">{dateShort(p.ts)}</td>
                    <td className="px-5 py-4"><strong className="text-[#102548]">{p.buyerName || 'Unknown'}</strong><br /><span className="text-[#64718a]">{p.buyerEmail || 'No email'}</span></td>
                    <td className="px-5 py-4 text-[#26334d]">{p.itemName || p.serviceId || 'Unknown item'}</td>
                    <td className="px-5 py-4 font-bold text-[#102548]">{money(p.amountPesewas)}</td>
                    <td className="px-5 py-4 font-mono text-xs text-[#64718a]">{p.reference || 'No reference'}</td>
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
