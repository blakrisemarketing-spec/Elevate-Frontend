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

async function callOurVerify(reference, serviceId) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reference, serviceId, name: 'E2E Tester', email: BUYER }),
  });
  return { http: res.status, body: await res.json().catch(() => ({})) };
}

function line(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${label}${detail ? ` :: ${detail}` : ''}`);
  return ok;
}

const results = [];
console.log('--- Generating real test transactions via Paystack Charge API ---');

// Test 1: happy path — pay ₵350, claim career-cv (₵350) → expect 200 ok + emails
{
  const c = await chargeTestCard(35000, BUYER);
  console.log(`  charge ₵350 → status=${c.status} amount=${c.amount} ref=${c.reference}`);
  if (c.status === 'success') {
    const v = await callOurVerify(c.reference, 'career-cv');
    results.push(line('Happy path (₵350 → career-cv)', v.http === 200 && v.body.ok === true, `HTTP ${v.http} ${JSON.stringify(v.body)}`));
  } else {
    results.push(line('Happy path (₵350 → career-cv)', false, `charge did not succeed: ${c.status}`));
  }
}

// Test 2: ANTI-TAMPER — real successful ₵1, claim career-cv (₵350) → expect 402 reject
{
  const c = await chargeTestCard(100, BUYER);
  console.log(`  charge ₵1 → status=${c.status} amount=${c.amount} ref=${c.reference}`);
  if (c.status === 'success') {
    const v = await callOurVerify(c.reference, 'career-cv');
    results.push(line('Anti-tamper (real ₵1 cannot buy ₵350 service)', v.http === 402 && v.body.ok === false, `HTTP ${v.http} ${JSON.stringify(v.body)}`));
  } else {
    results.push(line('Anti-tamper guard', false, `charge did not succeed: ${c.status}`));
  }
}

// Test 3: DIY product — pay ₵75, claim diy-remote-job-playbook → expect 200 + deliverablePath
{
  const c = await chargeTestCard(7500, BUYER);
  console.log(`  charge ₵75 → status=${c.status} amount=${c.amount} ref=${c.reference}`);
  if (c.status === 'success') {
    const v = await callOurVerify(c.reference, 'diy-remote-job-playbook');
    const ok = v.http === 200 && v.body.ok === true && v.body.deliverablePath === '/downloads/the-remote-job-playbook.pdf';
    results.push(line('DIY product (₵75 → deliverable link returned)', ok, `HTTP ${v.http} ${JSON.stringify(v.body)}`));
  } else {
    results.push(line('DIY product path', false, `charge did not succeed: ${c.status}`));
  }
}

const passed = results.filter(Boolean).length;
console.log(`\n=== ${passed}/${results.length} passed ===`);
process.exit(passed === results.length ? 0 : 1);
