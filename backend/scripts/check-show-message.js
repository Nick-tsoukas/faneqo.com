'use strict';

/**
 * Sanity check for post-show messaging rules.
 * Run: node scripts/check-show-message.js
 */

const showMessage = require('../src/api/show-recap/services/show-message');

let failures = 0;

const priorCampaignTestMode = process.env.FANEQO_CAMPAIGN_TEST_MODE;
const priorCampaignTestEmails = process.env.FANEQO_CAMPAIGN_TEST_EMAILS;
const priorNodeEnv = process.env.NODE_ENV;
delete process.env.FANEQO_CAMPAIGN_TEST_MODE;
delete process.env.FANEQO_CAMPAIGN_TEST_EMAILS;

function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}\n        got: ${actual}\n        want: ${expected}`);
}

const HOUR = 3600000;
const hoursAgo = (h) => new Date(Date.now() - h * HOUR).toISOString();
const eligibility = (args) => showMessage.getSendEligibility(args);

// --- Per-fan cooldown -------------------------------------------------------

const room = [
  { id: 1, email: 'a@x.com' },
  { id: 2, email: 'b@x.com', lastMessagedAt: hoursAgo(2) },
  { id: 3, email: 'c@x.com', lastMessagedAt: hoursAgo(30) },
  { id: 4, email: 'd@x.com', lastMessagedAt: 'not-a-date' },
];

const split = showMessage.partitionRecipients(room);

check('a fan never messaged can be mailed', split.sendable.some((f) => f.id === 1), true);
check('a fan messaged 2 hours ago is held back', split.cooling.some((f) => f.id === 2), true);
check('a fan messaged 30 hours ago is mailable again', split.sendable.some((f) => f.id === 3), true);
check('an unparseable timestamp does not trap a fan', split.sendable.some((f) => f.id === 4), true);
check('the split accounts for everyone', split.sendable.length + split.cooling.length, room.length);

check(
  'just inside the cooldown is held back',
  showMessage.partitionRecipients([{ id: 9, lastMessagedAt: hoursAgo(23.9) }]).cooling.length,
  1
);

check(
  'just outside the cooldown is released',
  showMessage.partitionRecipients([{ id: 9, lastMessagedAt: hoursAgo(24.1) }]).sendable.length,
  1
);

// --- Send eligibility -------------------------------------------------------

check(
  'sending is allowed with people to send to',
  eligibility({ recap: {}, sendableCount: 5, coolingCount: 0 }).canSend,
  true
);

check(
  'no per-show quota blocks a band that has already sent several',
  eligibility({ recap: { messagesSentCount: 9, lastMessageSentAt: hoursAgo(3) }, sendableCount: 5, coolingCount: 0 })
    .canSend,
  true
);

check(
  'a double submit is blocked',
  eligibility({ recap: { lastMessageSentAt: new Date().toISOString() }, sendableCount: 5, coolingCount: 0 }).reason,
  'just_sent'
);

check(
  'an entirely cooling room is blocked with the right reason',
  eligibility({ recap: {}, sendableCount: 0, coolingCount: 12 }).reason,
  'all_cooling'
);

check(
  'an empty room is blocked with the right reason',
  eligibility({ recap: {}, sendableCount: 0, coolingCount: 0 }).reason,
  'no_recipients'
);

check(
  'a garbage timestamp does not block sending',
  eligibility({ recap: { lastMessageSentAt: 'not-a-date' }, sendableCount: 5, coolingCount: 0 }).canSend,
  true
);

// --- Recency guard ----------------------------------------------------------

const daysAgo = (d) => new Date(Date.now() - d * 24 * HOUR).toISOString();

check(
  'a recent show can be messaged',
  eligibility({ recap: { showEndedAt: daysAgo(3) }, sendableCount: 5, coolingCount: 0 }).canSend,
  true
);

check(
  'a show just inside the window can be messaged',
  eligibility({ recap: { showEndedAt: daysAgo(59) }, sendableCount: 5, coolingCount: 0 }).canSend,
  true
);

check(
  'a long-past show is closed to messaging',
  eligibility({ recap: { showEndedAt: daysAgo(61) }, sendableCount: 5, coolingCount: 0 }).reason,
  'show_too_old'
);

check(
  'age falls back to the generation date when the show date is missing',
  eligibility({ recap: { recapGeneratedAt: daysAgo(400) }, sendableCount: 5, coolingCount: 0 }).reason,
  'show_too_old'
);

check(
  'a recap with no dates at all is not blocked by age',
  eligibility({ recap: {}, sendableCount: 5, coolingCount: 0 }).canSend,
  true
);

// --- Sender identity --------------------------------------------------------

const priorFrom = process.env.EMAIL_DEFAULT_FROM;
const priorShowFrom = process.env.SHOW_MAIL_FROM;

process.env.EMAIL_DEFAULT_FROM = 'Faneqo <noreply@mail.faneqo.com>';
delete process.env.SHOW_MAIL_FROM;

check(
  'the band is the recognisable sender',
  showMessage.buildFromHeader('The Powerlines'),
  '"The Powerlines via Faneqo" <noreply@mail.faneqo.com>'
);

check(
  'a band name with a comma cannot split the header',
  showMessage.buildFromHeader('Earth, Wind & Fire'),
  '"Earth, Wind & Fire via Faneqo" <noreply@mail.faneqo.com>'
);

check(
  'a quote in a band name is stripped',
  showMessage.buildFromHeader('The "Real" Band').includes('\\'),
  false
);

check('no band name degrades to plain Faneqo', showMessage.buildFromHeader(''), 'Faneqo <noreply@mail.faneqo.com>');

process.env.SHOW_MAIL_FROM = 'Faneqo Shows <shows@shows.faneqo.com>';
check(
  'a dedicated show sender takes precedence when configured',
  showMessage.buildFromHeader('The Powerlines'),
  '"The Powerlines via Faneqo" <shows@shows.faneqo.com>'
);

if (priorShowFrom === undefined) delete process.env.SHOW_MAIL_FROM;
else process.env.SHOW_MAIL_FROM = priorShowFrom;
process.env.EMAIL_DEFAULT_FROM = priorFrom;

// --- Email template ---------------------------------------------------------

const recap = {
  venue: "Rudy's",
  city: 'Austin',
  showStartedAt: '2026-03-14T02:30:00.000Z', // 9:30pm Mar 13 in Chicago
  timezone: 'America/Chicago',
};

const built = showMessage.buildEmail({
  recap,
  bandName: 'The Powerlines',
  subject: '20% off merch for everyone who was there',
  note: 'Thanks for coming out.\n\nNew single Friday.',
  unsubscribeUrl: 'https://faneqo.com/unsubscribe?token=abc',
  fan: { firstName: 'Dana', email: 'dana@example.com' },
});

check('the band owns the subject line', built.subject, '20% off merch for everyone who was there');

check(
  'an empty subject falls back to the venue default',
  showMessage.buildEmail({
    recap,
    bandName: 'The Powerlines',
    subject: '   ',
    note: 'x',
    unsubscribeUrl: 'u',
    fan: { email: 'x@example.com' },
  }).subject,
  "Thanks for coming out to Rudy's"
);

check(
  'the default names the band when there is no venue',
  showMessage.defaultSubject({ recap: {}, bandName: 'The Powerlines' }),
  'Thanks for coming out — The Powerlines'
);
check('greeting uses the first name', built.text.startsWith('Hi Dana,'), true);
check('unsubscribe url is in the text part', built.text.includes('https://faneqo.com/unsubscribe?token=abc'), true);
check('unsubscribe url is in the html part', built.html.includes('/unsubscribe?token=abc'), true);
check(
  'footer uses the local show date, not the UTC one',
  built.text.includes("Rudy's · Austin on Friday, March 13"),
  true
);
check('paragraph breaks survive into html', built.html.includes('<p style="margin:0 0 14px;">New single Friday.</p>'), true);

const anonymous = showMessage.buildEmail({
  recap: {},
  bandName: 'The Powerlines',
  note: 'Hi',
  unsubscribeUrl: 'https://faneqo.com/unsubscribe?token=abc',
  fan: { email: 'x@example.com' },
});

check('greeting degrades without a first name', anonymous.text.startsWith('Hi,'), true);
check('footer degrades without show details', anonymous.text.includes('you checked in at the show'), true);

const injected = showMessage.buildEmail({
  recap: {},
  bandName: 'Band',
  note: '<script>alert(1)</script>',
  unsubscribeUrl: 'https://faneqo.com/unsubscribe?token=abc',
  fan: { firstName: '<b>X</b>', email: 'x@example.com' },
});

check('note markup is escaped', injected.html.includes('<script>'), false);
check('fan name markup is escaped', injected.html.includes('<b>X</b>'), false);

function restoreCampaignTestEnv() {
  if (priorCampaignTestMode === undefined) delete process.env.FANEQO_CAMPAIGN_TEST_MODE;
  else process.env.FANEQO_CAMPAIGN_TEST_MODE = priorCampaignTestMode;
  if (priorCampaignTestEmails === undefined) delete process.env.FANEQO_CAMPAIGN_TEST_EMAILS;
  else process.env.FANEQO_CAMPAIGN_TEST_EMAILS = priorCampaignTestEmails;
  if (priorNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = priorNodeEnv;
}

const recentlyMessaged = [{ id: 21, email: 'test@example.com', lastMessagedAt: hoursAgo(2) }];
const otherRecentlyMessaged = [{ id: 22, email: 'other@example.com', lastMessagedAt: hoursAgo(2) }];

process.env.NODE_ENV = 'development';
process.env.FANEQO_CAMPAIGN_TEST_MODE = 'true';
delete process.env.FANEQO_CAMPAIGN_TEST_EMAILS;

check(
  'dev test mode lets a recently messaged fan be mailed again',
  showMessage.partitionRecipients(recentlyMessaged).sendable.length,
  1
);

check(
  'dev test mode does not treat an all-cooling room as blocked',
  eligibility({
    recap: {},
    sendableCount: showMessage.partitionRecipients(recentlyMessaged).sendable.length,
    coolingCount: showMessage.partitionRecipients(recentlyMessaged).cooling.length,
  }).canSend,
  true
);

check(
  'dev test mode still blocks a Message-the-Room double submit',
  eligibility({
    recap: { lastMessageSentAt: new Date().toISOString() },
    sendableCount: 5,
    coolingCount: 0,
  }).reason,
  'just_sent'
);

check(
  'dev test mode still closes a show that is too old',
  eligibility({
    recap: { showEndedAt: daysAgo(61) },
    sendableCount: 5,
    coolingCount: 0,
  }).reason,
  'show_too_old'
);

process.env.FANEQO_CAMPAIGN_TEST_EMAILS = 'test@example.com';
check(
  'dev test allowlist still bypasses the matching fan',
  showMessage.partitionRecipients(recentlyMessaged).sendable.length,
  1
);
check(
  'dev test allowlist still holds back a non-allowlisted fan',
  showMessage.partitionRecipients(otherRecentlyMessaged).cooling.length,
  1
);

process.env.NODE_ENV = 'production';
process.env.FANEQO_CAMPAIGN_TEST_MODE = 'true';
delete process.env.FANEQO_CAMPAIGN_TEST_EMAILS;
check(
  'production still cools a recently messaged fan even if the test flag is on',
  showMessage.partitionRecipients(recentlyMessaged).cooling.length,
  1
);

process.env.NODE_ENV = 'development';
process.env.FANEQO_CAMPAIGN_TEST_MODE = 'true';
process.env.FANEQO_CAMPAIGN_TEST_EMAILS = 'test@example.com';
const justMessaged = [{ id: 31, email: 'test@example.com', lastMessagedAt: new Date().toISOString() }];
const splitNow = showMessage.partitionRecipients(justMessaged);
check('lastMessagedAt=now is sendable for an allowlisted fan in test mode', splitNow.sendable.length, 1);
check(
  'all_fans canSend is true when the only cooling fan is allowlisted in test mode',
  eligibility({ recap: {}, sendableCount: splitNow.sendable.length, coolingCount: splitNow.cooling.length }).canSend,
  true
);

process.env.NODE_ENV = 'production';
process.env.FANEQO_CAMPAIGN_TEST_MODE = 'true';
process.env.FANEQO_CAMPAIGN_TEST_EMAILS = 'test@example.com';
const splitNowProd = showMessage.partitionRecipients(justMessaged);
check('lastMessagedAt=now stays cooling in production even with the test flag', splitNowProd.cooling.length, 1);
check(
  'all_fans canSend is false in production when everyone was just emailed',
  eligibility({ recap: {}, sendableCount: splitNowProd.sendable.length, coolingCount: splitNowProd.cooling.length }).canSend,
  false
);

restoreCampaignTestEnv();

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
