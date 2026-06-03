/**
 * Fulfilment emails via Resend. Isolated behind one function so the provider
 * is swappable (SendGrid/Postmark/SMTP) without touching the verify function.
 *
 * Degrades gracefully: with no RESEND_API_KEY it logs what it *would* send and
 * returns, so the whole payment flow is testable before the email account
 * exists. A failed send never invalidates a real payment (caller swallows).
 *
 * Env:
 *   RESEND_API_KEY        — Resend key (absent → no-op log)
 *   OPS_EMAIL             — team inbox (default: elevatewithnll@gmail.com)
 *   MAIL_FROM             — verified sender (default: Resend onboarding sender)
 *   PUBLIC_APP_BASE_URL   — https origin for building download links
 */
import type { CatalogItem } from '../../src/checkout/catalog';
import { formatCedis } from '../../src/checkout/catalog';

interface FulfilmentInput {
  item: CatalogItem;
  reference: string;
  buyerName: string;
  buyerEmail: string;
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendEmail(opts: { from: string; to: string[]; subject: string; html: string }, key: string): Promise<void> {
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${detail.slice(0, 200)}`);
  }
}

export async function sendFulfillmentEmails({ item, reference, buyerName, buyerEmail }: FulfilmentInput): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const team = process.env.OPS_EMAIL || 'elevatewithnll@gmail.com';
  const from = process.env.MAIL_FROM || 'Elevate Career Hub <onboarding@resend.dev>';
  const base = (process.env.PUBLIC_APP_BASE_URL || '').replace(/\/$/, '');
  const price = formatCedis(item.amountPesewas);
  const downloadUrl = item.deliverablePath ? `${base}${item.deliverablePath}` : '';

  if (!key) {
    console.log('[email] RESEND_API_KEY missing — would send fulfilment:', {
      item: item.id, reference, buyerEmail, team, downloadUrl,
    });
    return;
  }

  // 1) Team notification — so they can start the work / confirm delivery.
  await sendEmail({
    from,
    to: [team],
    subject: `New purchase: ${item.name} (${price})`,
    html: `
      <h2>New purchase</h2>
      <p><strong>${esc(item.name)}</strong> — ${price}</p>
      <ul>
        <li>Type: ${item.type}</li>
        <li>Buyer: ${esc(buyerName) || '(name not provided)'} &lt;${esc(buyerEmail) || 'no email'}&gt;</li>
        <li>Paystack reference: ${esc(reference)}</li>
      </ul>
      ${item.type === 'service'
        ? '<p>Action: reach out to the buyer to begin the service.</p>'
        : `<p>Digital product — buyer was sent the download link${downloadUrl ? `: <a href="${downloadUrl}">${downloadUrl}</a>` : ' (no deliverable path configured).'}</p>`}
    `,
  }, key);

  // 2) Buyer confirmation — next steps, plus download for digital products.
  if (buyerEmail) {
    await sendEmail({
      from,
      to: [buyerEmail],
      subject: `Your Elevate Career Hub purchase: ${item.name}`,
      html: `
        <p>Hi ${esc(buyerName) || 'there'},</p>
        <p>Thank you for your purchase of <strong>${esc(item.name)}</strong> (${price}). Your payment reference is <strong>${esc(reference)}</strong>.</p>
        ${item.type === 'service'
          ? '<p>Our team will reach out to you shortly to get started. If you need us sooner, reply to this email or message us on WhatsApp at +233 53 111 3454.</p>'
          : (downloadUrl
              ? `<p>You can download your product here: <a href="${downloadUrl}">${esc(item.name)}</a>.</p><p>If the link doesn't work, reply to this email and we'll send it directly.</p>`
              : '<p>Our team will email your product shortly.</p>')}
        <p>— Elevate Career Hub</p>
      `,
    }, key);
  }
}
