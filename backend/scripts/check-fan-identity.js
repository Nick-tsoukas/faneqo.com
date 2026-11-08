'use strict';

/**
 * Offline checks for fan identity hashing / token validation.
 * Run: node scripts/check-fan-identity.js
 */

process.env.FAN_VISITOR_PEPPER = process.env.FAN_VISITOR_PEPPER || 'test-pepper';

const {
  isValidVisitorToken,
  hashVisitorToken,
  mintVisitorToken,
  buildPromptEligibility,
} = require('../src/utils/fanIdentity');

let failed = 0;
function check(name, cond) {
  if (!cond) {
    failed += 1;
    console.error('FAIL', name);
  } else {
    console.log('ok  ', name);
  }
}

const a = mintVisitorToken();
const b = mintVisitorToken();
check('mint length', a.length >= 32);
check('mint unique', a !== b);
check('valid mint', isValidVisitorToken(a));
check('reject short', !isValidVisitorToken('abc'));
check('reject email-like PII shape as token is still allowed only opaque charset', !isValidVisitorToken('sarah@example.com'));
check('hash stable', hashVisitorToken(a) === hashVisitorToken(a));
check('hash differs', hashVisitorToken(a) !== hashVisitorToken(b));
check('hash hex', /^[a-f0-9]{64}$/.test(hashVisitorToken(a)));

const eligibility = buildPromptEligibility({
  visitor: {
    visitCount: 3,
    firstSeenAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    lastSeenAt: new Date().toISOString(),
    dismissCount: 0,
    lastPromptAt: null,
  },
  joinedArtistCount: 2,
  showAttendanceCount: 2,
});
check('returnVisit signal', eligibility.signals.returnVisit === true);
check('multiArtist signal', eligibility.signals.multiArtist === true);
check('repeatShow signal', eligibility.signals.repeatShow === true);
check('triggers include second_artist', eligibility.availableTriggers.includes('second_artist'));

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nAll fan-identity checks passed');
