/**
 * Checkout island, progressive enhancement for static pages.
 *
 * Buy buttons are plain static HTML:
 *   <button class="buy-btn" data-service-id="career-cv">Pay ₵350</button>
 *
 * This script (loaded only on pages that have buy buttons) wires them to the
 * Paystack Inline popup, then hands the reference to our serverless verify
 * function. The page itself stays static; this is the only JS it ships.
 *
 * Security: this file runs in the browser, so it only ever uses the PUBLIC
 * key and DISPLAY amounts. The serverless function re-verifies the real
 * charged amount against the server-side catalog before anything is fulfilled.
 */
import { CATALOG, CURRENCY, formatCedis } from './catalog';
import type { CatalogItem } from './catalog';
import { trackEvent, trackMeta } from '../analytics/tracking';

const PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
const PAYSTACK_SDK = 'https://js.paystack.co/v1/inline.js';
const VERIFY_ENDPOINT = '/api/verify-payment.php';
const CONFIRM_PATH = '/payment/confirmed/';

interface PaystackHandler { openIframe: () => void }
interface PaystackPop {
  setup: (opts: Record<string, unknown>) => PaystackHandler;
}
declare global {
  interface Window { PaystackPop?: PaystackPop }
}

let sdkPromise: Promise<void> | null = null;
function loadPaystackSdk(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PAYSTACK_SDK;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load the Paystack checkout. Check your connection and try again.'));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

interface BuyerDetails { name: string; email: string; sessions: string[]; amountPesewas: number }

/**
 * Accessible modal collecting name + email before opening Paystack. For
 * per-unit items (those with `item.sessions`), it also shows a checklist;
 * the buyer ticks one or more sessions and the total updates live
 * (amountPesewas × ticked). The server re-validates everything.
 */
function collectBuyerDetails(item: CatalogItem): Promise<BuyerDetails | null> {
  const sessions = item.sessions ?? [];
  const isMulti = sessions.length > 0;
  const unit = item.amountPesewas;
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-navy/60 px-4';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', `Checkout for ${item.name}`);

    const sessionsBlock = isMulti ? `
          <fieldset class="mb-4">
            <legend class="block text-sm font-semibold text-navy mb-1">Which sessions? <span class="font-normal text-ink-muted">(tick all you want)</span></legend>
            <div class="rounded-lg border border-ink/15 divide-y divide-ink/10 max-h-56 overflow-y-auto">
              ${sessions.map((s) => `
                <label class="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface">
                  <input type="checkbox" name="session" value="${esc(s)}" class="mt-1 h-4 w-4 accent-primary shrink-0" />
                  <span class="text-sm text-ink leading-snug">${esc(s)}</span>
                </label>`).join('')}
            </div>
          </fieldset>` : '';

    const payLine = isMulti
      ? `<p class="text-ink-muted text-sm mb-6">${formatCedis(unit)} per session. <span data-total class="font-semibold text-navy">No sessions selected yet.</span></p>`
      : `<p class="text-ink-muted text-sm mb-6">You'll pay <span class="font-semibold text-navy">${formatCedis(unit)}</span> securely via Paystack.</p>`;

    overlay.innerHTML = `
      <div class="bg-white rounded-2xl shadow-soft w-full max-w-md p-6 sm:p-8">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">Checkout</p>
        <h2 class="font-display italic font-bold text-navy text-2xl mb-1">${esc(item.name)}</h2>
        ${payLine}
        <form novalidate>
          <label class="block text-sm font-semibold text-navy mb-1" for="ck-name">Full name</label>
          <input id="ck-name" name="name" type="text" autocomplete="name" required
            class="w-full rounded-lg border border-ink/15 px-4 py-3 mb-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <label class="block text-sm font-semibold text-navy mb-1" for="ck-email">Email</label>
          <input id="ck-email" name="email" type="email" inputmode="email" autocomplete="email" required
            class="w-full rounded-lg border border-ink/15 px-4 py-3 mb-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          ${sessionsBlock}
          <p data-error class="text-error text-sm mb-3 min-h-[1.25rem]" role="alert"></p>
          <div class="flex gap-3">
            <button type="button" data-cancel class="btn-secondary flex-1">Cancel</button>
            <button type="submit" class="btn-primary flex-1">Continue to pay</button>
          </div>
          <p class="text-center text-xs text-ink-muted mt-4">Secured by Paystack · cards & mobile money</p>
        </form>
      </div>`;

    const cleanup = () => { document.removeEventListener('keydown', onKey); overlay.remove(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { cleanup(); resolve(null); } };
    document.addEventListener('keydown', onKey);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) { cleanup(); resolve(null); } });
    overlay.querySelector<HTMLButtonElement>('[data-cancel]')!.addEventListener('click', () => { cleanup(); resolve(null); });

    const checkedSessions = (): string[] =>
      Array.from(overlay.querySelectorAll<HTMLInputElement>('input[name="session"]:checked')).map((c) => c.value);

    if (isMulti) {
      const totalEl = overlay.querySelector<HTMLElement>('[data-total]')!;
      overlay.addEventListener('change', (e) => {
        if (!(e.target as HTMLElement).matches('input[name="session"]')) return;
        const n = checkedSessions().length;
        totalEl.textContent = n === 0
          ? 'No sessions selected yet.'
          : `Total: ${formatCedis(unit * n)} for ${n} session${n > 1 ? 's' : ''}.`;
      });
    }

    const form = overlay.querySelector('form')!;
    const errEl = overlay.querySelector<HTMLElement>('[data-error]')!;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (overlay.querySelector<HTMLInputElement>('#ck-name')!.value || '').trim();
      const email = (overlay.querySelector<HTMLInputElement>('#ck-email')!.value || '').trim();
      const picked = checkedSessions();
      if (name.length < 2) { errEl.textContent = 'Please enter your name.'; return; }
      if (!isEmail(email)) { errEl.textContent = 'Please enter a valid email address.'; return; }
      if (isMulti && picked.length === 0) { errEl.textContent = 'Please tick at least one session.'; return; }
      cleanup();
      resolve({ name, email, sessions: picked, amountPesewas: isMulti ? unit * picked.length : unit });
    });

    document.body.appendChild(overlay);
    overlay.querySelector<HTMLInputElement>('#ck-name')!.focus();
  });
}

function setButtonBusy(btn: HTMLButtonElement, busy: boolean): void {
  btn.disabled = busy;
  btn.dataset.busy = busy ? '1' : '';
  if (busy) {
    btn.dataset.label = btn.textContent || '';
    btn.textContent = 'Processing…';
  } else if (btn.dataset.label) {
    btn.textContent = btn.dataset.label;
  }
}

async function startCheckout(btn: HTMLButtonElement): Promise<void> {
  const id = btn.dataset.serviceId || '';
  const item = CATALOG[id];
  if (!item) { console.error(`[checkout] unknown service id: ${id}`); return; }
  trackEvent('checkout_started', {
    service_id: item.id,
    item_name: item.name,
    value: item.amountPesewas / 100,
    currency: CURRENCY,
  });

  if (!PUBLIC_KEY) {
    alert('Payments are not configured yet. Please reach out on WhatsApp and we’ll help you purchase.');
    return;
  }

  const details = await collectBuyerDetails(item);
  if (!details) return;
  trackEvent('checkout_details_submitted', {
    service_id: item.id,
    item_name: item.name,
    selected_sessions: details.sessions.length,
    value: details.amountPesewas / 100,
    currency: CURRENCY,
  });

  setButtonBusy(btn, true);
  try {
    await loadPaystackSdk();
  } catch (err) {
    setButtonBusy(btn, false);
    alert((err as Error).message);
    return;
  }

  const customFields: Array<Record<string, string>> = [
    { display_name: 'Service', variable_name: 'service_id', value: item.id },
    { display_name: 'Name', variable_name: 'buyer_name', value: details.name },
  ];
  if (details.sessions.length) {
    customFields.push({ display_name: 'Sessions', variable_name: 'sessions', value: details.sessions.join('; ') });
  }

  const handler = window.PaystackPop!.setup({
    key: PUBLIC_KEY,
    email: details.email,
    amount: details.amountPesewas,
    currency: CURRENCY,
    metadata: { custom_fields: customFields },
    onClose: () => { setButtonBusy(btn, false); },
    callback: (response: { reference: string }) => {
      // Verify server-side before trusting success.
      void finalize(response.reference, item.id, details, btn);
    },
  });
  trackMeta('InitiateCheckout', {
    content_ids: item.id,
    content_name: item.name,
    value: details.amountPesewas / 100,
    currency: CURRENCY,
  });
  handler.openIframe();
}

async function finalize(
  reference: string,
  serviceId: string,
  details: BuyerDetails,
  btn: HTMLButtonElement,
): Promise<void> {
  try {
    const res = await fetch(VERIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reference, serviceId, name: details.name, email: details.email, sessions: details.sessions }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data && data.ok) {
      const item = CATALOG[serviceId];
      trackEvent('purchase_completed', {
        service_id: serviceId,
        item_name: item?.name || serviceId,
        selected_sessions: details.sessions.length,
        value: details.amountPesewas / 100,
        currency: CURRENCY,
      });
      trackMeta('Purchase', {
        content_ids: serviceId,
        content_name: item?.name || serviceId,
        value: details.amountPesewas / 100,
        currency: CURRENCY,
      });
      const params = new URLSearchParams({ ref: reference, item: serviceId });
      window.location.assign(`${CONFIRM_PATH}?${params.toString()}`);
      return;
    }
    throw new Error(data?.message || 'We could not confirm your payment automatically.');
  } catch (err) {
    setButtonBusy(btn, false);
    alert(`${(err as Error).message} If you were charged, email hello@elevatecareerhub.com with reference ${reference} and we’ll sort it out right away.`);
  }
}

function init(): void {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button.buy-btn[data-service-id]'));
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => { void startCheckout(btn); });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
