'use strict';

const fs = require('fs');
const path = require('path');
const mailer = require('../src/utils/resendMailer');

async function main() {
  const empty = await mailer.sendOne({});
  console.log('empty ok/error:', empty.ok, empty.error);

  const nobody = await mailer.sendOne({ from: 'a@b.com', to: 'c@d.com', subject: 'x' });
  console.log('no body ok/error:', nobody.ok, nobody.error);

  const showMsg = fs.readFileSync(
    path.join(__dirname, '../src/api/show-recap/services/show-message.js'),
    'utf8'
  );
  console.log('uses resendMailer:', showMsg.includes('resendMailer'));
  console.log('still calls email plugin send:', /plugin\(['"]email['"]\)/.test(showMsg));
  console.log('has List-Unsubscribe-Post:', showMsg.includes('List-Unsubscribe-Post'));
  console.log('has middle-dot join:', showMsg.includes("join(' · ')"));

  const stripe = fs.readFileSync(
    path.join(__dirname, '../src/api/stripe/controllers/stripe.js'),
    'utf8'
  );
  console.log('stripe still uses email plugin:', /plugin\(['"]email['"]\)/.test(stripe));

  const unsubscribe = fs.readFileSync(
    path.join(__dirname, '../src/api/fan/controllers/fan.js'),
    'utf8'
  );
  console.log('unsubscribe accepts query token:', unsubscribe.includes('ctx.query?.token'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
