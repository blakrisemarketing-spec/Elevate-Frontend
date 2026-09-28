/**
 * End-to-end payment test (local). Not deployed.
 *
 * 1. Creates REAL successful test transactions via Paystack's Charge API
 *    (test success card), getting genuine references.
 * 2. Feeds those references to OUR verify endpoint (php -S serving dist) and
 *    asserts the happy path, the anti-tamper amount guard, and DIY delivery.
 *
 * Run with PAYSTACK_SECRET_KEY in env, and the php -S endpoint on $ENDPOINT.
 */
const SECRET = process.env.PAYSTACK_SECRET_KEY;
const ENDPOINT = process.env.ENDPOINT || 'http://127.0.0.1:8799/api/verify-payment.php';
const QUOTE_ENDPOINT = process.env.QUOTE_ENDPOINT || ENDPOINT.replace('verify-payment.php', 'price-quote.php');
const BUYER = process.env.BUYER_EMAIL || 'elevatewithnll@gmail.com';
const TEST_CARD = { number: '4084084084084081', cvv: '408', expiry_month: '12', expiry_year: '30' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pay = (path, body) => fetch('https://api.paystack.co' + path, {
  method: 'POST',
  headers: { Authorization: `Bearer ${SECRET}`, 'content-type': 'application/json' },
  body: JSON.stringify(body),
}).then((r) => r.json());

async function chargeTestCard(amountPesewas, email) {
  let d = await pay('/charge', { email, amount: amountPesewas, card: TEST_CARD });
  let status = d?.data?.status;
  const reference = d?.data?.reference;
  // Walk the test-mode auth states.
  let guard = 0;
  while (['send_otp', 'send_pin', 'pending'].includes(status) && guard++ < 8) {
    if (status === 'send_otp') d = await pay('/charge/submit_otp', { otp: '123456', reference });
    else if (status === 'send_pin') d = await pay('/charge/submit_pin', { pin: '1234', reference });
    else { await sleep(1500); d = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, { headers: { Authorization: `Bearer ${SECRET}` } }).then((r) => r.json()); }
    status = d?.data?.status;
  }
  return { reference, status, amount: d?.data?.amount };
}

/**
 * Ask for a price quote as a visitor in `country`. Prices are regional, and
 * verify-payment.php trusts nothing but the signed token this returns.
 */
async function getQuote(serviceId, country) {
  const res = await fetch(QUOTE_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(country ? { 'CF-IPCountry': country } : {}) },
    body: JSON.stringify({ ids: [serviceId] }),
  });
  const body = await res.json().catch(() => ({}));
  return body?.items?.[serviceId] ?? null;
}

async function callOurVerify(reference, serviceId, quote) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reference, serviceId, quote, name: 'E2E Tester', email: BUYER }),
  });
  return { http: res.status, body: await res.json().catch(() => ({})) };
}

function line(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}, ${label}${detail ? ` :: ${detail}` : ''}`);
  return ok;
}

const results = [];
console.log('--- Generating real test transactions via Paystack Charge API ---');

// Test 1: happy path, pay ₵350, claim career-cv-early (₵350) → expect 200 ok + emails
{
  const c = await chargeTestCard(35000, BUYER);
  console.log(`  charge ₵350 → status=${c.status} amount=${c.amount} ref=${c.reference}`);
  if (c.status === 'success') {
    const v = await callOurVerify(c.reference, 'career-cv-early', (await getQuote('career-cv-early', 'GH')).quote);
    results.push(line('Happy path (₵350 → career-cv-early)', v.http === 200 && v.body.ok === true, `HTTP ${v.http} ${JSON.stringify(v.body)}`));
  } else {
    results.push(line('Happy path (₵350 → career-cv-early)', false, `charge did not succeed: ${c.status}`));
  }
}

// Test 2: ANTI-TAMPER, real successful ₵1, claim career-cv-early (₵350) → expect 402 reject
{
  const c = await chargeTestCard(100, BUYER);
  console.log(`  charge ₵1 → status=${c.status} amount=${c.amount} ref=${c.reference}`);
  if (c.status === 'success') {
    const v = await callOurVerify(c.reference, 'career-cv-early', (await getQuote('career-cv-early', 'GH')).quote);
    results.push(line('Anti-tamper (real ₵1 cannot buy ₵350 service)', v.http === 402 && v.body.ok === false, `HTTP ${v.http} ${JSON.stringify(v.body)}`));
  } else {
    results.push(line('Anti-tamper guard', false, `charge did not succeed: ${c.status}`));
  }
}

// Test 3: DIY product, pay ₵75, claim diy-remote-job-playbook → expect 200 + deliverablePath
{
  const c = await chargeTestCard(7500, BUYER);
  console.log(`  charge ₵75 → status=${c.status} amount=${c.amount} ref=${c.reference}`);
  if (c.status === 'success') {
    const v = await callOurVerify(c.reference, 'diy-remote-job-playbook', (await getQuote('diy-remote-job-playbook', 'GH')).quote);
    const ok = v.http === 200 && v.body.ok === true && v.body.deliverablePath === '/downloads/the-remote-job-playbook.pdf';
    results.push(line('DIY product (₵75 → deliverable link returned)', ok, `HTTP ${v.http} ${JSON.stringify(v.body)}`));
  } else {
    results.push(line('DIY product path', false, `charge did not succeed: ${c.status}`));
  }
}

// ── Regional pricing guards ──────────────────────────────────────
// These are the reason regional pricing is safe to ship: the price a buyer is
// charged must follow the region the SERVER picked, and no request may talk
// its way down to the cheaper Ghana price.
console.log('\n--- Regional pricing ---');

const ghQuote = await getQuote('career-cv-early', 'GH');
const usQuote = await getQuote('career-cv-early', 'US');

results.push(line(
  'Region changes the price (GH vs US quote differ)',
  Boolean(ghQuote && usQuote) && usQuote.chargePesewas > ghQuote.chargePesewas,
  `GH=${ghQuote?.chargePesewas} US=${usQuote?.chargePesewas}`,
));

// Test 4: a US visitor pays the US price → accepted.
{
  const c = await chargeTestCard(usQuote.chargePesewas, BUYER);
  console.log(`  charge US price ${usQuote.chargePesewas} → status=${c.status} ref=${c.reference}`);
  if (c.status === 'success') {
    const v = await callOurVerify(c.reference, 'career-cv-early', usQuote.quote);
    results.push(line('US buyer pays the US price', v.http === 200 && v.body.ok === true, `HTTP ${v.http} ${JSON.stringify(v.body)}`));
  } else {
    results.push(line('US buyer pays the US price', false, `charge did not succeed: ${c.status}`));
  }
}

// Test 5: THE ARBITRAGE CASE. Pay the cheap Ghana amount, then present a
// Ghana quote, while the transaction is meant to be the US-priced one. The
// amounts simply will not line up, so it is rejected.
{
  const c = await chargeTestCard(ghQuote.chargePesewas, BUYER);
  console.log(`  charge GH price ${ghQuote.chargePesewas} → status=${c.status} ref=${c.reference}`);
  if (c.status === 'success') {
    const v = await callOurVerify(c.reference, 'career-cv-early', usQuote.quote);
    results.push(line('Ghana amount cannot satisfy a US quote', v.http === 402 && v.body.ok === false, `HTTP ${v.http} ${JSON.stringify(v.body)}`));
  } else {
    results.push(line('Ghana amount cannot satisfy a US quote', false, `charge did not succeed: ${c.status}`));
  }
}

// Test 6: no quote at all. Dropping the token must NOT fall back to the Ghana
// price, or every foreign buyer would simply omit it.
{
  const v = await callOurVerify('ref-no-quote', 'career-cv-early', undefined);
  results.push(line('Missing quote is rejected (no Ghana fallback)', v.http === 400 && v.body.ok === false, `HTTP ${v.http}`));
}

// Test 7: forged signature.
{
  const forged = usQuote.quote.slice(0, -1) + (usQuote.quote.endsWith('A') ? 'B' : 'A');
  const v = await callOurVerify('ref-forged', 'career-cv-early', forged);
  results.push(line('Tampered quote signature is rejected', v.http === 400 && v.body.ok === false, `HTTP ${v.http}`));
}

// Test 8: a valid quote for a cheaper item, replayed against a dearer one.
{
  const cheap = await getQuote('diy-remote-job-playbook', 'GH');
  const v = await callOurVerify('ref-swap', 'career-cv-early', cheap.quote);
  results.push(line('Quote for another item is rejected', v.http === 400 && v.body.ok === false, `HTTP ${v.http}`));
}

const passed = results.filter(Boolean).length;
console.log(`\n=== ${passed}/${results.length} passed ===`);
process.exit(passed === results.length ? 0 : 1);
