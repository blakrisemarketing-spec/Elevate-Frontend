import { CATALOG, PRICE_REGIONS, formatCedis, formatPrice, resolvePrice } from '../../checkout/catalog';
import type { PriceRegion } from '../../checkout/catalog';

interface PriceProps {
  /** Catalog id, e.g. "career-cv-early". */
  id: string;
  /** Text after the amount, e.g. "Investment · Early Career". */
  suffix?: string;
  /**
   * Render the "charged as ₵600" line under converted prices. On for standalone
   * price displays; off inside button labels, where a second line would break
   * the layout. Never shown for GH, where display and charge are the same.
   */
  disclose?: boolean;
  className?: string;
}

/**
 * A regional price.
 *
 * Every region's price is emitted into the static HTML at build time, and CSS
 * (see `[data-price]` in priority/styles.css) reveals exactly one based on the
 * `data-region` attribute the checkout island sets on <html>. That is what
 * makes the swap flicker-free: there is no reflow and no JS on the paint path,
 * so a returning US visitor sees "$50" in the first frame rather than watching
 * "₵350" turn into it.
 *
 * With JS off, or before the region resolves, the GH price shows. That is also
 * what crawlers index, so the price in search results stays stable.
 *
 * Trade-off accepted: the whole regional ladder is visible in view-source.
 * It is discoverable with a VPN anyway, and a visible price JUMP on load reads
 * worse to a buyer than a comparison they have to go looking for.
 */
export function Price({ id, suffix, disclose = false, className }: PriceProps) {
  const item = CATALOG[id];
  if (!item) return null;

  const tail = suffix ? ` ${suffix}` : '';

  return (
    <span className={className} data-price={id}>
      {PRICE_REGIONS.map((region: PriceRegion) => {
        const price = resolvePrice(item, region);
        const shown = formatPrice(price.displayMinor, region);
        // Ghana is billed in the currency it is quoted in, so it needs no
        // disclosure. Everywhere else the buyer's statement will read cedis,
        // and saying so up front is the whole basis of showing a local price.
        const needsNote = disclose && region !== 'GH';
        return (
          <span key={region} data-r={region}>
            {shown}{tail}
            {needsNote && (
              <span className="price-note">charged as {formatCedis(price.chargePesewas)}</span>
            )}
          </span>
        );
      })}
    </span>
  );
}
