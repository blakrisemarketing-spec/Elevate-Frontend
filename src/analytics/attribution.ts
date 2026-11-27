/**
 * Shared first-party attribution for the JS islands (checkout + match tool).
 *
 * Snapshots the UTM params, external referrer and landing path once per tab
 * session and reuses that snapshot at submit time. The server also falls back
 * to the 90-day cookies the .htaccess sets on any UTM landing or external
 * referral, which covers visitors who first arrived on a zero-JS page.
 * Failure-tolerant: never blocks a submission or a payment.
 */
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

export function readAttribution(): Record<string, string> {
  try {
    let stored: Record<string, string> = {};
    try {
      stored = JSON.parse(sessionStorage.getItem('ech_attr') || '{}');
    } catch {
      stored = {};
    }
    if (!stored || !stored.__set) {
      const params = new URLSearchParams(window.location.search);
      const fresh: Record<string, string> = { __set: '1' };
      for (const k of UTM_KEYS) {
        const v = params.get(k);
        if (v) fresh[k] = v.slice(0, 200);
      }
      fresh.referrer = (document.referrer || '').slice(0, 500);
      fresh.landing_path = (window.location.pathname || '').slice(0, 300);
      stored = fresh;
      try {
        sessionStorage.setItem('ech_attr', JSON.stringify(stored));
      } catch {
        /* private mode / storage full: attribution is best-effort */
      }
    }
    const { __set: _set, ...out } = stored;
    return out;
  } catch {
    return {};
  }
}
