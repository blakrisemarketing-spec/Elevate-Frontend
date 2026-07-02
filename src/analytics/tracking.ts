type TrackingPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: string, payload: TrackingPayload = {}): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', event, clean(payload));
  }
}

export function trackMeta(event: string, payload: TrackingPayload = {}): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('track', event, clean(payload));
}

function clean(payload: TrackingPayload): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(payload).filter((entry): entry is [string, string | number | boolean] => entry[1] !== null && entry[1] !== undefined),
  );
}

