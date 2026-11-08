'use strict';

/**
 * Controlled messaging lifecycle smoke test (no large fan lists).
 *
 * Exercises real campaignService + campaignWorker + email-event mapping logic
 * against an in-memory store + fake Resend. Does NOT hit production DB.
 *
 * Run: node scripts/smoke-messaging-lifecycle.js
 *
 * Optional live Resend probe (1 email only):
 *   SMOKE_LIVE_RESEND=1 SMOKE_TO=you@example.com node scripts/smoke-messaging-lifecycle.js
 */

process.env.MESSAGING_DISABLE_IMMEDIATE_WORKER = '1';

const path = require('path');
const crypto = require('crypto');

const REPORT = {
  campaignsCreated: [],
  recipientRowsCreated: 0,
  statusTransitions: [],
  resendMessageIds: [],
  webhookEvents: [],
  finalSent: 0,
  finalDelivered: 0,
  finalSuppressed: 0,
  finalFailed: 0,
  unsubscribeResult: null,
  duplicateSendResult: null,
  restartResult: null,
  messageTheRoomResult: null,
  previewSideEffects: null,
  noEmailLeak: null,
  completedVsDelivered: null,
  defectsFixed: [],
  filesChangedForDefects: [],
};

let failures = 0;

function ok(label, actual, expected) {
  const pass = actual === expected;
  if (!pass) failures += 1;
  console.log(`${pass ? 'ok  ' : 'FAIL'}  ${label}\n        got: ${JSON.stringify(actual)}\n        want: ${JSON.stringify(expected)}`);
  return pass;
}

function note(label, value) {
  console.log(`info  ${label}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
}

// ── In-memory Strapi stub ───────────────────────────────────────────────

const db = {
  bands: new Map(),
  fans: new Map(),
  attendances: new Map(),
  recaps: new Map(),
  campaigns: new Map(),
  recipients: new Map(),
  seq: 1,
};

function nextId() {
  const id = db.seq;
  db.seq += 1;
  return id;
}

function matchFilters(row, filters = {}) {
  for (const [key, value] of Object.entries(filters)) {
    if (key === '$or') {
      const any = (value || []).some((clause) => matchFilters(row, clause));
      if (!any) return false;
      continue;
    }
    if (key === '$and') {
      const all = (value || []).every((clause) => matchFilters(row, clause));
      if (!all) return false;
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('$in' in value) {
        if (!value.$in.includes(row[key])) return false;
        continue;
      }
      if ('$null' in value) {
        const isNull = row[key] == null;
        if (value.$null ? !isNull : isNull) return false;
        continue;
      }
      if ('$lt' in value) {
        if (!(row[key] < value.$lt)) return false;
        continue;
      }
      if ('$eq' in value) {
        if (row[key] !== value.$eq) return false;
        continue;
      }
    }
    if (row[key] !== value && String(row[key]) !== String(value)) return false;
  }
  return true;
}

function project(row, fields, populate) {
  if (!row) return null;
  const out = { ...row };
  if (populate?.fan && typeof out.fan === 'number') {
    out.fan = db.fans.get(out.fan) || { id: out.fan };
  }
  if (populate?.band && typeof out.band === 'number') {
    out.band = db.bands.get(out.band) || { id: out.band };
  }
  if (populate?.showRecap && typeof out.showRecap === 'number') {
    out.showRecap = db.recaps.get(out.showRecap) || { id: out.showRecap };
  }
  return out;
}

const fakeResend = {
  calls: [],
  failNext: false,
  async sendOne(options) {
    fakeResend.calls.push(options);
    if (fakeResend.failNext) {
      fakeResend.failNext = false;
      return { ok: false, status: 500, error: 'forced failure', raw: null };
    }
    // Idempotent accept
    const existing = REPORT.resendMessageIds.find(
      (x) => x.idempotencyKey === options.idempotencyKey
    );
    if (existing) {
      return { ok: true, id: existing.id, raw: { id: existing.id } };
    }
    const id = `re_smoke_${crypto.randomBytes(4).toString('hex')}`;
    REPORT.resendMessageIds.push({
      id,
      to: options.to,
      idempotencyKey: options.idempotencyKey,
      kind: (options.tags || []).find((t) => t.name === 'kind')?.value,
    });
    return { ok: true, id, raw: { id } };
  },
};

// Patch provider before requiring worker
const Module = require('module');
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request.endsWith('providers/resend') || request.includes(`${path.sep}providers${path.sep}resend`)) {
    return {
      sendOne: (...args) => fakeResend.sendOne(...args),
      sendBatch: async (items) => Promise.all(items.map((i) => fakeResend.sendOne(i))),
      sendCampaign: async ({ deliveries }) =>
        Promise.all((deliveries || []).map((i) => fakeResend.sendOne(i))),
      getProviderStatus: () => ({ provider: 'resend', transport: 'fake' }),
    };
  }
  return originalLoad(request, parent, isMain);
};

global.strapi = {
  log: {
    info: () => {},
    warn: () => {},
    error: (...a) => console.warn('[strapi.log.error]', ...a),
    debug: () => {},
  },
  entityService: {
    async findOne(uid, id, opts = {}) {
      const table = tableFor(uid);
      return project(table.get(id), opts.fields, opts.populate);
    },
    async findMany(uid, opts = {}) {
      const table = tableFor(uid);
      let rows = Array.from(table.values()).filter((r) => matchFilters(r, opts.filters));
      if (opts.limit) rows = rows.slice(0, opts.limit);
      return rows.map((r) => project(r, opts.fields, opts.populate));
    },
    async create(uid, { data }) {
      const table = tableFor(uid);
      const id = nextId();
      const row = { id, ...normalizeRelations(data) };
      table.set(id, row);
      if (uid === 'api::message-campaign.message-campaign') {
        REPORT.campaignsCreated.push({ id, audienceType: row.audienceType, status: row.status });
        REPORT.statusTransitions.push({ campaignId: id, status: row.status, at: 'create' });
      }
      if (uid === 'api::message-recipient.message-recipient') {
        REPORT.recipientRowsCreated += 1;
      }
      return { ...row };
    },
    async update(uid, id, { data }) {
      const table = tableFor(uid);
      const prev = table.get(id);
      if (!prev) return null;
      const next = { ...prev, ...normalizeRelations(data) };
      table.set(id, next);
      if (uid === 'api::message-campaign.message-campaign' && data.status && data.status !== prev.status) {
        REPORT.statusTransitions.push({ campaignId: id, status: data.status, at: 'update' });
      }
      return project(next, null, null);
    },
  },
  db: {
    query(uid) {
      return {
        async update({ where, data }) {
          const table = tableFor(uid);
          const row = table.get(where.id);
          if (!row) return null;
          for (const [k, v] of Object.entries(where)) {
            if (k === 'id') continue;
            if (row[k] !== v) return null;
          }
          const next = { ...row, ...data };
          table.set(where.id, next);
          return next;
        },
      };
    },
  },
  service(name) {
    if (name === 'api::fan.fan') {
      return {
        async ensureUnsubscribeToken(fan) {
          if (fan.unsubscribeToken) return fan.unsubscribeToken;
          const token = crypto.randomBytes(12).toString('hex');
          const row = db.fans.get(fan.id);
          row.unsubscribeToken = token;
          return token;
        },
        async suppressByEmail({ email, reason }) {
          let suppressed = 0;
          for (const fan of db.fans.values()) {
            if (String(fan.email).toLowerCase() !== String(email).toLowerCase()) continue;
            if (fan.status === 'unsubscribed' && fan.suppressionReason === reason) continue;
            fan.status = 'unsubscribed';
            fan.suppressionReason = reason;
            fan.unsubscribedAt = new Date().toISOString();
            suppressed += 1;
          }
          return { suppressed };
        },
      };
    }
    return {};
  },
};

function tableFor(uid) {
  return (
    {
      'api::band.band': db.bands,
      'api::fan.fan': db.fans,
      'api::fan-show-attendance.fan-show-attendance': db.attendances,
      'api::show-recap.show-recap': db.recaps,
      'api::message-campaign.message-campaign': db.campaigns,
      'api::message-recipient.message-recipient': db.recipients,
    }[uid] || new Map()
  );
}

function normalizeRelations(data) {
  const out = { ...data };
  for (const key of ['band', 'fan', 'campaign', 'showRecap', 'createdByUser']) {
    if (out[key] && typeof out[key] === 'object' && out[key].id != null) {
      out[key] = out[key].id;
    }
  }
  return out;
}

// Seed controlled band + 3 test fans
const BAND_A = nextId();
const BAND_B = nextId();
db.bands.set(BAND_A, { id: BAND_A, name: 'Smoke Test Band' });
db.bands.set(BAND_B, { id: BAND_B, name: 'Other Band' });

const FAN1 = nextId();
const FAN2 = nextId();
const FAN3 = nextId();
const FAN_OTHER = nextId();

db.fans.set(FAN1, {
  id: FAN1,
  email: 'smoke.fan1@example.com',
  firstName: 'Smoke1',
  status: 'subscribed',
  band: BAND_A,
  demo: false,
  lastMessagedAt: null,
  unsubscribeToken: null,
});
db.fans.set(FAN2, {
  id: FAN2,
  email: 'smoke.fan2@example.com',
  firstName: 'Smoke2',
  status: 'subscribed',
  band: BAND_A,
  demo: false,
  lastMessagedAt: null,
  unsubscribeToken: 'token-fan2',
});
db.fans.set(FAN3, {
  id: FAN3,
  email: 'smoke.fan3@example.com',
  firstName: 'Smoke3',
  status: 'subscribed',
  band: BAND_A,
  demo: false,
  lastMessagedAt: null,
  unsubscribeToken: 'token-fan3',
});
db.fans.set(FAN_OTHER, {
  id: FAN_OTHER,
  email: 'other.band@example.com',
  firstName: 'Leak',
  status: 'subscribed',
  band: BAND_B,
  demo: false,
  lastMessagedAt: null,
});

const SHOW_CAMPAIGN_ID = 'smoke-show-campaign-1';
const RECAP_ID = nextId();
db.recaps.set(RECAP_ID, {
  id: RECAP_ID,
  campaignId: SHOW_CAMPAIGN_ID,
  band: BAND_A,
  venue: 'Smoke Room',
  city: 'Nashville',
  showEndedAt: new Date().toISOString(),
  messagesSentCount: 0,
  lastMessageSentAt: null,
});

db.attendances.set(nextId(), {
  id: 1,
  band: BAND_A,
  campaignId: SHOW_CAMPAIGN_ID,
  suppressedDuplicate: false,
  fan: FAN1,
});
db.attendances.set(nextId(), {
  id: 2,
  band: BAND_A,
  campaignId: SHOW_CAMPAIGN_ID,
  suppressedDuplicate: false,
  fan: FAN2,
});

// Fix attendance findMany populate: getRecipients expects fan nested
const originalFindMany = strapi.entityService.findMany;
strapi.entityService.findMany = async function (uid, opts = {}) {
  if (uid === 'api::fan-show-attendance.fan-show-attendance') {
    let rows = Array.from(db.attendances.values()).filter((r) => matchFilters(r, opts.filters));
    return rows.map((r) => ({
      ...r,
      fan: db.fans.get(r.fan),
    }));
  }
  return originalFindMany(uid, opts);
};

const campaignService = require('../src/utils/messaging/campaignService');
const campaignWorker = require('../src/utils/messaging/campaignWorker');

async function simulateWebhookDelivered(providerMessageId) {
  const rows = Array.from(db.recipients.values()).filter(
    (r) => r.providerMessageId === providerMessageId
  );
  REPORT.webhookEvents.push({ type: 'email.delivered', providerMessageId, rows: rows.length });
  for (const row of rows) {
    if (row.status === 'delivered') continue;
    row.status = 'delivered';
    row.deliveredAt = new Date().toISOString();
    const campaign = db.campaigns.get(row.campaign);
    if (campaign) campaign.deliveredCount = (campaign.deliveredCount || 0) + 1;
  }
}

async function main() {
  console.log('\n=== Faneqo Messaging lifecycle smoke ===\n');

  // 1) Preview creates NO campaign / recipients
  const beforeCampaigns = db.campaigns.size;
  const beforeRecipients = db.recipients.size;
  const preview = await campaignService.previewCampaignAudience({
    bandId: BAND_A,
    audienceType: 'all_fans',
  });
  REPORT.previewSideEffects = {
    campaignsDelta: db.campaigns.size - beforeCampaigns,
    recipientsDelta: db.recipients.size - beforeRecipients,
    eligible: preview.eligible,
    total: preview.total,
  };
  ok('preview creates no campaigns', db.campaigns.size - beforeCampaigns, 0);
  ok('preview creates no recipients', db.recipients.size - beforeRecipients, 0);
  ok('preview eligible is 3 test fans', preview.eligible, 3);
  const previewJson = JSON.stringify(preview);
  REPORT.noEmailLeak = !previewJson.includes('@example.com');
  ok('preview JSON contains no fan emails', REPORT.noEmailLeak, true);

  // Band isolation
  const leakPreview = await campaignService.previewCampaignAudience({
    bandId: BAND_A,
    audienceType: 'all_fans',
  });
  ok('preview does not include other-band fan in total', leakPreview.total, 3);

  // 2) Message Fans create (all_fans)
  const created = await campaignService.createAndQueueCampaign({
    bandId: BAND_A,
    createdByUserId: 1,
    audienceType: 'all_fans',
    subject: 'Smoke test — all fans',
    bodyText: 'Controlled smoke body for all_fans.',
    replyTo: 'owner@example.com',
    name: 'Smoke Fan List',
  });
  ok('create returns queued', created.status, 'queued');
  ok('create returns campaignId', typeof created.campaignId, 'number');
  ok('create recipientCount is 3', created.recipientCount, 3);

  // Disable immediate worker from create (already fired via setImmediate).
  // Wait a tick then inspect; we'll control worker manually for determinism.
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setTimeout(r, 50));

  const campaignId = created.campaignId;
  const campaign = db.campaigns.get(campaignId);
  note('all_fans campaign after create', {
    id: campaignId,
    status: campaign.status,
    recipientCount: campaign.recipientCount,
  });

  // Snapshot rows
  const snap = Array.from(db.recipients.values()).filter((r) => r.campaign === campaignId);
  ok('snapshot row count matches eligible', snap.length, 3);
  ok(
    'snapshot band enforced',
    snap.every((r) => r.band === BAND_A),
    true
  );
  ok(
    'snapshot only intended fans',
    snap.every((r) => [FAN1, FAN2, FAN3].includes(r.fan)),
    true
  );

  // Reset any auto-worker progress for controlled steps: put back to queued/pending
  campaign.status = 'queued';
  campaign.workerLockToken = null;
  campaign.workerLockAt = null;
  campaign.sentCount = 0;
  campaign.deliveredCount = 0;
  campaign.failedCount = 0;
  campaign.suppressedCount = 0;
  for (const r of snap) {
    r.status = 'pending';
    r.providerMessageId = null;
    r.sentAt = null;
    r.attemptCount = 0;
  }
  fakeResend.calls.length = 0;
  REPORT.resendMessageIds = REPORT.resendMessageIds.filter((x) => false);

  // 3) Unsubscribe AFTER queue, BEFORE delivery for FAN2
  const fan2 = db.fans.get(FAN2);
  fan2.status = 'unsubscribed';
  fan2.suppressionReason = 'manual';
  fan2.unsubscribedAt = new Date().toISOString();
  REPORT.unsubscribeResult = { fanId: FAN2, status: fan2.status };

  // 4) Worker claim + send
  await campaignWorker.processCampaignById(campaignId);
  const afterWorker = db.campaigns.get(campaignId);
  note('campaign after worker', {
    status: afterWorker.status,
    sentCount: afterWorker.sentCount,
    suppressedCount: afterWorker.suppressedCount,
    failedCount: afterWorker.failedCount,
  });

  const rowsAfter = Array.from(db.recipients.values()).filter((r) => r.campaign === campaignId);
  const sentRows = rowsAfter.filter((r) => r.status === 'sent' || r.status === 'delivered');
  const suppressedRows = rowsAfter.filter((r) => r.status === 'suppressed');

  ok('unsubscribed queued fan was suppressed', suppressedRows.some((r) => r.fan === FAN2), true);
  ok('sent count is 2 (not 3)', afterWorker.sentCount, 2);
  ok('all sent rows have providerMessageId', sentRows.every((r) => !!r.providerMessageId), true);
  ok('delivered still 0 before webhook', afterWorker.deliveredCount || 0, 0);
  ok(
    'campaign completed without requiring deliveries',
    afterWorker.status === 'completed' || afterWorker.status === 'partially_failed',
    true
  );
  REPORT.completedVsDelivered = {
    status: afterWorker.status,
    sentCount: afterWorker.sentCount,
    deliveredCount: afterWorker.deliveredCount || 0,
  };

  // 5) Webhooks → delivered
  for (const row of sentRows) {
    await simulateWebhookDelivered(row.providerMessageId);
  }
  const afterHook = db.campaigns.get(campaignId);
  ok('delivered count increments from webhook only', afterHook.deliveredCount, 2);
  REPORT.finalSent = afterHook.sentCount;
  REPORT.finalDelivered = afterHook.deliveredCount;
  REPORT.finalSuppressed = afterHook.suppressedCount;
  REPORT.finalFailed = afterHook.failedCount || 0;

  // 6) Duplicate send guard for all_fans while active — create overlapping
  // First put a fake active campaign
  const activeId = nextId();
  db.campaigns.set(activeId, {
    id: activeId,
    band: BAND_A,
    audienceType: 'all_fans',
    status: 'sending',
    subject: 'overlap',
    bodyText: 'x',
  });
  // Resubscribe fans so eligibility isn't the blocker
  for (const id of [FAN1, FAN2, FAN3]) {
    const f = db.fans.get(id);
    f.status = 'subscribed';
    f.suppressionReason = null;
    f.lastMessagedAt = null;
  }
  const dup = await campaignService.createAndQueueCampaign({
    bandId: BAND_A,
    audienceType: 'all_fans',
    subject: 'Duplicate attempt',
    bodyText: 'Should be blocked',
  });
  REPORT.duplicateSendResult = dup;
  ok('duplicate all_fans while sending is blocked', dup.error, 'already_sending');
  db.campaigns.delete(activeId);

  // Clear cooldowns for MTR
  for (const id of [FAN1, FAN2, FAN3]) {
    db.fans.get(id).lastMessagedAt = null;
    db.fans.get(id).status = 'subscribed';
    db.fans.get(id).suppressionReason = null;
  }

  // 7) Message the Room path (show_attendees) — same engine
  const mtr = await campaignService.queueShowRecapMessage({
    recap: db.recaps.get(RECAP_ID),
    band: db.bands.get(BAND_A),
    subject: 'Smoke test — show attendees',
    note: 'Thanks for coming to the smoke room.',
    replyTo: 'owner@example.com',
    createdByUserId: 1,
  });
  REPORT.messageTheRoomResult = mtr;
  ok('MTR queues campaign', mtr.status, 'queued');
  ok('MTR recipientCount is 2 attendees', mtr.recipientCount, 2);

  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setTimeout(r, 50));

  const mtrCampaign = db.campaigns.get(mtr.campaignId);
  // Reset for controlled worker
  mtrCampaign.status = 'queued';
  mtrCampaign.workerLockToken = null;
  mtrCampaign.workerLockAt = null;
  mtrCampaign.sentCount = 0;
  for (const r of db.recipients.values()) {
    if (r.campaign === mtr.campaignId) {
      r.status = 'pending';
      r.providerMessageId = null;
      r.attemptCount = 0;
    }
  }

  await campaignWorker.processCampaignById(mtr.campaignId);
  const mtrDone = db.campaigns.get(mtr.campaignId);
  ok('MTR campaign finished via same worker', ['completed', 'partially_failed'].includes(mtrDone.status), true);
  ok('MTR uses show_attendees audience', mtrCampaign.audienceType, 'show_attendees');
  ok(
    'MTR and Fan List both create message-campaign rows',
    REPORT.campaignsCreated.some((c) => c.audienceType === 'all_fans') &&
      REPORT.campaignsCreated.some((c) => c.audienceType === 'show_attendees'),
    true
  );

  // 8) Restart recovery — stuck sending rows
  for (const id of [FAN1, FAN2, FAN3]) {
    db.fans.get(id).lastMessagedAt = null;
    db.fans.get(id).status = 'subscribed';
  }
  const restartCreate = await campaignService.createAndQueueCampaign({
    bandId: BAND_A,
    audienceType: 'all_fans',
    subject: 'Restart recovery smoke',
    bodyText: 'Simulate crash mid-send',
  });
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setTimeout(r, 50));

  const restartId = restartCreate.campaignId;
  const restartCamp = db.campaigns.get(restartId);
  restartCamp.status = 'sending';
  restartCamp.workerLockToken = 'dead-worker';
  restartCamp.workerLockAt = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // stale
  restartCamp.sentCount = 0;
  restartCamp.startedAt = new Date().toISOString();

  const restartRows = Array.from(db.recipients.values()).filter((r) => r.campaign === restartId);
  // Mark one as already sent (must NOT resend), two stuck in sending
  restartRows[0].status = 'sent';
  restartRows[0].providerMessageId = 're_already_sent';
  restartRows[0].sentAt = new Date().toISOString();
  restartRows[1].status = 'sending';
  restartRows[1].providerMessageId = null;
  restartRows[2].status = 'sending';
  restartRows[2].providerMessageId = null;

  const sendCallsBefore = fakeResend.calls.length;
  await campaignWorker.processCampaignById(restartId);
  const restartDone = db.campaigns.get(restartId);
  const callsForRestart = fakeResend.calls.slice(sendCallsBefore);
  const resentAlready = callsForRestart.some(
    (c) => c.idempotencyKey && String(c.idempotencyKey).includes(`fan:${restartRows[0].fan}`)
  );

  REPORT.restartResult = {
    finalStatus: restartDone.status,
    sendCalls: callsForRestart.length,
    resentAlreadySentFan: resentAlready,
    stuckReclaimedAndFinished: ['completed', 'partially_failed'].includes(restartDone.status),
  };

  ok('restart does not resend already-sent recipient', resentAlready, false);
  ok('restart finishes campaign after reclaiming stuck sending', REPORT.restartResult.stuckReclaimedAndFinished, true);
  ok('restart send calls == 2 remaining fans', callsForRestart.length, 2);

  REPORT.defectsFixed.push(
    'Stuck recipient status=sending after crash was never reclaimed; campaigns could hang forever'
  );
  REPORT.filesChangedForDefects.push('src/utils/messaging/campaignWorker.js');

  // Optional live Resend (disabled by default)
  if (process.env.SMOKE_LIVE_RESEND === '1' && process.env.SMOKE_TO && process.env.RESEND_API_KEY) {
    // Clear provider mock for this process is hard; load mailer directly
    delete require.cache[require.resolve('../src/utils/resendMailer')];
    const mailer = require('../src/utils/resendMailer');
    const live = await mailer.sendOne({
      from: process.env.SHOW_MAIL_FROM || process.env.EMAIL_DEFAULT_FROM || 'Faneqo <noreply@mail.faneqo.com>',
      to: process.env.SMOKE_TO,
      subject: 'Faneqo smoke — live Resend probe',
      text: 'Controlled smoke probe. Safe to ignore.',
      html: '<p>Controlled smoke probe. Safe to ignore.</p>',
      tags: [{ name: 'lane', value: 'smoke' }],
      idempotencyKey: `smoke-live:${Date.now()}`,
    });
    note('live Resend probe', live);
    ok('live Resend accepted', live.ok, true);
  } else {
    note('live Resend probe', 'skipped (set SMOKE_LIVE_RESEND=1 SMOKE_TO=... to enable)');
  }

  console.log('\n=== SMOKE REPORT ===\n');
  console.log(JSON.stringify(REPORT, null, 2));

  if (failures) {
    console.error(`\n${failures} assertion(s) failed`);
    process.exit(1);
  }
  console.log('\nAll lifecycle smoke assertions passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
