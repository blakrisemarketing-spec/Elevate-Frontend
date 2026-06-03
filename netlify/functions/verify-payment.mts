/**
 * Paystack payment verification (Netlify Function, v2 Web API signature).
 *
 * The browser hands us a transaction `reference` after the inline popup
 * reports success. We DO NOT trust that — we call Paystack's verify endpoint
 * with the SECRET key (server-only) and confirm:
 *   1. Paystack says the transaction succeeded, AND
 *   2. the amount charged exactly matches the server-side catalog price, AND
 *   3. the currency is GHS.
 * Only then do we fulfil (emails / digital delivery).
 *
 * Endpoint: POST /.netlify/functions/verify-payment
 * Env: PAYSTACK_SECRET_KEY (required), plus the vars used by ../lib/email.
 */
import { getCatalogItem, CURRENCY } from '../../src/checkout/catalog';
import { sendFulfillmentEmails } from '../lib/email';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ ok: false, message: 'Method not allowed' }, 405);

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('[verify-payment] PAYSTACK_SECRET_KEY is not set');
    return json({ ok: false, message: 'Payments are not configured yet.' }, 503);
  }

  let body: { reference?: string; serviceId?: string; name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, message: 'Invalid request body.' }, 400);
  }

  const reference = (body.reference || '').trim();
  const serviceId = (body.serviceId || '').trim();
  if (!reference || !serviceId) return json({ ok: false, message: 'Missing payment reference or service.' }, 400);

  const item = getCatalogItem(serviceId);
  if (!item) return json({ ok: false, message: 'Unknown service.' }, 400);

  // ── Verify with Paystack (secret key, server-side only) ──────────
  let verifyData: any;
  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    verifyData = await res.json();
  } catch (err) {
    console.error('[verify-payment] Paystack verify call failed', err);
    return json({ ok: false, message: 'Could not reach Paystack to verify. Please try again.' }, 502);
  }

  const txn = verifyData?.data;
  const apiOk = verifyData?.status === true;
  const paidOk = txn?.status === 'success';
  const amountOk = typeof txn?.amount === 'number' && txn.amount === item.amountPesewas;
  const currencyOk = (txn?.currency || CURRENCY) === CURRENCY;

  if (!apiOk || !paidOk || !amountOk || !currencyOk) {
    // Amount mismatch is a tamper/underpay signal — log loudly, never fulfil.
    console.warn('[verify-payment] rejected', {
      reference, serviceId, apiOk, paidOk, amountOk, currencyOk,
      reportedAmount: txn?.amount, expectedAmount: item.amountPesewas,
    });
    return json({ ok: false, message: 'We could not verify this payment. If you were charged, contact us with your reference and we will resolve it.' }, 402);
  }

  // ── Fulfilment (best-effort; never block the buyer's confirmation) ─
  const buyerEmail = (body.email || txn?.customer?.email || '').trim();
  const buyerName = (body.name || '').trim();
  try {
    await sendFulfillmentEmails({ item, reference, buyerName, buyerEmail });
  } catch (err) {
    console.error('[verify-payment] fulfilment email failed (payment is still valid)', err);
  }

  return json({
    ok: true,
    reference,
    item: { id: item.id, name: item.name, type: item.type },
    deliverablePath: item.deliverablePath || null,
  });
};
