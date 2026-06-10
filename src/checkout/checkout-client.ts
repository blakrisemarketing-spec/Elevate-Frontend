/**
 * Checkout island — progressive enhancement for static pages.
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

/** Minimal accessible modal collecting name + email before opening Paystack. */
function collectBuyerDetails(itemName: string, priceLabel: string): Promise<{ name: string; email: string } | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-navy/60 px-4';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', `Checkout for ${itemName}`);
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl shadow-soft w-full max-w-md p-6 sm:p-8">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">Checkout</p>
        <h2 class="font-display italic font-bold text-navy text-2xl mb-1">${itemName}</h2>
        <p class="text-ink-muted text-sm mb-6">You'll pay <span class="font-semibold text-navy">${priceLabel}</span> securely via Paystack.</p>
        <form novalidate>
          <label class="block text-sm font-semibold text-navy mb-1" for="ck-name">Full name</label>
          <input id="ck-name" name="name" type="text" autocomplete="name" required
            class="w-full rounded-lg border border-ink/15 px-4 py-3 mb-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <label class="block text-sm font-semibold text-navy mb-1" for="ck-email">Email</label>
          <input id="ck-email" name="email" type="email" inputmode="email" autocomplete="email" required
            class="w-full rounded-lg border border-ink/15 px-4 py-3 mb-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
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

    const form = overlay.querySelector('form')!;
    const errEl = overlay.querySelector<HTMLElement>('[data-error]')!;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (overlay.querySelector<HTMLInputElement>('#ck-name')!.value || '').trim();
      const email = (overlay.querySelector<HTMLInputElement>('#ck-email')!.value || '').trim();
      if (name.length < 2) { errEl.textContent = 'Please enter your name.'; return; }
      if (!isEmail(email)) { errEl.textContent = 'Please enter a valid email address.'; return; }
      cleanup();
      resolve({ name, email });
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

  if (!PUBLIC_KEY) {
    alert('Payments are not configured yet. Please reach out on WhatsApp and we’ll help you purchase.');
    return;
  }

  const details = await collectBuyerDetails(item.name, formatCedis(item.amountPesewas));
  if (!details) return;

  setButtonBusy(btn, true);
  try {
    await loadPaystackSdk();
  } catch (err) {
    setButtonBusy(btn, false);
    alert((err as Error).message);
    return;
  }

  const handler = window.PaystackPop!.setup({
    key: PUBLIC_KEY,
    email: details.email,
    amount: item.amountPesewas,
    currency: CURRENCY,
    metadata: {
      custom_fields: [
        { display_name: 'Service', variable_name: 'service_id', value: item.id },
        { display_name: 'Name', variable_name: 'buyer_name', value: details.name },
      ],
    },
    onClose: () => { setButtonBusy(btn, false); },
    callback: (response: { reference: string }) => {
      // Verify server-side before trusting success.
      void finalize(response.reference, item.id, details, btn);
    },
  });
  handler.openIframe();
}

async function finalize(
  reference: string,
  serviceId: string,
  details: { name: string; email: string },
  btn: HTMLButtonElement,
): Promise<void> {
  try {
    const res = await fetch(VERIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reference, serviceId, name: details.name, email: details.email }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data && data.ok) {
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
