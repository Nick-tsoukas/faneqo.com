'use strict';

/**
 * Read-only Stripe Price retrieve. Never creates customers/subscriptions/charges.
 * Prints Price ID + public price fields only. Never prints secret keys.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

function parseEnvFile(file) {
  try {
    const src = fs.readFileSync(file, 'utf8');
    const get = (key) => {
      const match = src.match(new RegExp('^' + key + '\\s*=\\s*(.+)$', 'm'));
      if (!match) return null;
      return match[1].trim().replace(/^['"]|['"]$/g, '');
    };
    return {
      file,
      exists: true,
      priceId: get('STRIPE_DEFAULT_PRICE_ID'),
      secret: get('STRIPE_SECRET_KEY'),
    };
  } catch {
    return { file, exists: false, priceId: null, secret: null };
  }
}

function checkHttp(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve({ url, status: res.statusCode });
      res.resume();
    });
    req.on('error', (err) => resolve({ url, error: err.message }));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve({ url, error: 'timeout' });
    });
  });
}

async function main() {
  const servers = await Promise.all([
    checkHttp('http://localhost:3000'),
    checkHttp('http://localhost:1337/api/health'),
  ]);
  console.log('SERVERS', JSON.stringify(servers));

  const files = [
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../../musicbizqr/.env'),
    path.join(__dirname, '../../musicbizqr/.env.local'),
  ].map(parseEnvFile);

  for (const info of files) {
    console.log('ENVFILE', JSON.stringify({
      file: info.file,
      exists: info.exists,
      priceId: info.priceId || null,
      hasSecret: Boolean(info.secret && info.secret.length > 8 && !info.secret.includes('tobemodified')),
    }));
  }

  const chosen = files.find((f) => f.priceId && f.secret && f.secret.length > 8 && !f.secret.includes('tobemodified'))
    || files.find((f) => f.priceId);

  const priceId = process.env.STRIPE_DEFAULT_PRICE_ID || chosen?.priceId || null;
  const secret = process.env.STRIPE_SECRET_KEY || chosen?.secret || null;

  console.log('LOCAL_PRICE_ID', priceId || 'NOT ACCESSIBLE');
  console.log('LOCAL_SECRET_PRESENT', Boolean(secret && secret.length > 8 && !(secret.includes('tobemodified'))));

  if (!priceId || !secret || secret.includes('tobemodified')) {
    console.log('STRIPE_RETRIEVE', 'NOT ACCESSIBLE');
    console.log('PRODUCTION STRIPE_DEFAULT_PRICE_ID NOT VERIFIED');
    return;
  }

  const Stripe = require('stripe');
  const stripe = new Stripe(secret);
  const price = await stripe.prices.retrieve(priceId);
  console.log('STRIPE_RETRIEVE', JSON.stringify({
    id: price.id,
    active: price.active,
    unit_amount: price.unit_amount,
    currency: price.currency,
    recurring_interval: price.recurring?.interval || null,
    recurring_interval_count: price.recurring?.interval_count || null,
    livemode: price.livemode,
    product: typeof price.product === 'string' ? price.product : price.product?.id || null,
  }));
  const isExpected12 = price.unit_amount === 1200 && price.currency === 'usd' && price.recurring?.interval === 'month';
  console.log('MATCHES_USD_1200_MONTHLY', isExpected12);
  console.log('PRODUCTION STRIPE_DEFAULT_PRICE_ID NOT VERIFIED');
}

main().catch((err) => {
  console.error('STRIPE_RETRIEVE_ERROR', err.message);
  console.log('PRODUCTION STRIPE_DEFAULT_PRICE_ID NOT VERIFIED');
  process.exitCode = 1;
});
