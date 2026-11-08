'use strict';

/**
 * Creates the local RockSnaps test band in development SQLite only.
 *
 * Refuses to start unless NODE_ENV is development and config/database.js
 * resolves to .tmp/data.db. Does not print passwords. Writes them to
 * .tmp/rocksnaps-local-login.txt, which is gitignored.
 *
 * Run: node scripts/ensure-local-rocksnaps-band.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SQLITE_PATH = path.resolve(ROOT, '.tmp', 'data.db');
const LOGIN_FILE = path.join(ROOT, '.tmp', 'rocksnaps-local-login.txt');
const ENV_FILE = path.join(ROOT, '.env');

const ROCKSNAPS_EMAIL = 'rocksnaps-local@example.com';
const ROCKSNAPS_USERNAME = 'rocksnaps-local';
const OTHER_EMAIL = 'other-artist-local@example.com';
const OTHER_USERNAME = 'other-artist-local';
const ROCKSNAPS_SLUG = 'rocksnapsphotography';
const OTHER_SLUG = 'otherlocalartist';

if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development') {
  console.error('Refusing: NODE_ENV must be development or unset.');
  process.exit(1);
}
process.env.NODE_ENV = 'development';

function env(key, fallback) {
  const value = process.env[key];
  return value === undefined ? fallback : value;
}
env.int = (key, fallback) => {
  const value = env(key);
  if (value === undefined || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
env.bool = (key, fallback = false) => {
  const value = env(key);
  if (value === undefined || value === '') return fallback;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
};

const dbConfig = require('../config/database')({ env });
const client = dbConfig?.connection?.client;
const filename = dbConfig?.connection?.connection?.filename;
if (client !== 'sqlite' || !filename || path.resolve(filename) !== SQLITE_PATH) {
  console.error('Refusing: development database is not the local SQLite file.');
  process.exit(1);
}
if (!fs.existsSync(SQLITE_PATH)) {
  console.error('Refusing: .tmp/data.db does not exist.');
  process.exit(1);
}

function password() {
  return crypto.randomBytes(18).toString('base64url');
}

function readLogin() {
  if (!fs.existsSync(LOGIN_FILE)) return {};
  const out = {};
  for (const line of fs.readFileSync(LOGIN_FILE, 'utf8').split(/\r?\n/)) {
    const idx = line.indexOf('=');
    if (idx > 0) out[line.slice(0, idx)] = line.slice(idx + 1);
  }
  return out;
}

function writeLogin(values) {
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`);
  fs.mkdirSync(path.dirname(LOGIN_FILE), { recursive: true });
  fs.writeFileSync(LOGIN_FILE, `${lines.join('\n')}\n`, { encoding: 'utf8' });
}

function writeBandId(id) {
  let text = fs.readFileSync(ENV_FILE, 'utf8');
  const line = `ROCKSNAPS_BAND_ID=${id}`;
  if (/^ROCKSNAPS_BAND_ID=/m.test(text)) text = text.replace(/^ROCKSNAPS_BAND_ID=.*$/m, line);
  else text += (text.endsWith('\n') ? '' : '\n') + `${line}\n`;
  fs.writeFileSync(ENV_FILE, text);
}

function png(fileName) {
  const bytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  const dir = path.join(ROOT, 'public', 'uploads');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, fileName);
  if (!fs.existsSync(file)) fs.writeFileSync(file, bytes);
  return `http://127.0.0.1:1337/uploads/${fileName}`;
}

async function ensureUser(strapi, login, { email, username, passwordKey }) {
  const existing = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { email } });
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });
  if (!role) throw new Error('Authenticated role is missing');
  if (existing && login[passwordKey]) return existing;
  const nextPassword = password();
  if (!existing) {
    const created = await strapi.plugins['users-permissions'].services.user.add({
      username,
      email,
      password: nextPassword,
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: role.id,
      subscriptionStatus: 'unpaid',
    });
    login[passwordKey] = nextPassword;
    return created;
  }
  await strapi.plugins['users-permissions'].services.user.edit(existing.id, { password: nextPassword });
  login[passwordKey] = nextPassword;
  return existing;
}

async function ensureBand(strapi, user, { name, slug, bio }) {
  const rows = await strapi.entityService.findMany('api::band.band', {
    filters: { slug },
    fields: ['id', 'name', 'slug'],
    populate: { users_permissions_user: { fields: ['id'] } },
    limit: 1,
  });
  const existing = rows?.[0];
  if (existing) {
    const ownerId = existing.users_permissions_user?.id;
    if (Number(ownerId) !== Number(user.id)) {
      throw new Error(`Band ${slug} already exists and is not owned by the local fixture user`);
    }
    return existing;
  }
  const created = await strapi.entityService.create('api::band.band', {
    data: {
      name,
      slug,
      genre: 'Photography',
      bio,
      users_permissions_user: user.id,
      paymentsEnabled: false,
      stripeAccountId: null,
      stripeOnboardingComplete: false,
    },
  });
  await strapi.entityService.create('api::band-member.band-member', {
    data: {
      band: created.id,
      user: user.id,
      role: 'owner',
      status: 'active',
      acceptedAt: new Date().toISOString(),
    },
  });
  return created;
}

async function ensureFile(strapi, { name, url, width, height }) {
  const existing = await strapi.db.query('plugin::upload.file').findOne({ where: { name } });
  if (existing) return existing;
  return strapi.entityService.create('plugin::upload.file', {
    data: {
      name,
      hash: name.replace(/\W+/g, ''),
      ext: '.png',
      mime: 'image/png',
      size: 0.1,
      width,
      height,
      url,
      provider: 'local',
      alternativeText: name,
      folderPath: '/',
    },
  });
}

async function ensureGallery(strapi, { userId, bandId, title, bodyText, mediaIds, coverMediaId, key }) {
  const { createArtistUpdateService } = require('../src/utils/artistUpdates/artistUpdateService');
  const service = createArtistUpdateService(strapi);
  const result = await service.createAndPublish({
    userId,
    bandId,
    title,
    bodyText,
    visibility: 'public',
    mediaIds,
    coverMediaId,
    publishIdempotencyKey: key,
  });
  if (result.error) throw new Error(`${key}: ${result.error} ${result.message || ''}`);
  return result.data;
}

async function main() {
  const Strapi = require('@strapi/strapi');
  const strapi = await Strapi().load();
  try {
    const live = strapi.config.get('database.connection');
    const liveFile = live?.connection?.filename;
    if (live?.client !== 'sqlite' || !liveFile || path.resolve(liveFile) !== SQLITE_PATH) {
      throw new Error('Refusing to write: live connection is not local SQLite');
    }

    const before = await strapi.entityService.findMany('api::artist-update.artist-update', {
      fields: ['id', 'showOnRockSnaps'],
      limit: 500,
    });
    const alreadyOn = (before || []).filter((row) => row.showOnRockSnaps === true).length;
    console.log(`existing_galleries=${(before || []).length} already_on_rocksnaps=${alreadyOn}`);

    const login = readLogin();
    const owner = await ensureUser(strapi, login, {
      email: ROCKSNAPS_EMAIL,
      username: ROCKSNAPS_USERNAME,
      passwordKey: 'rocksnaps_password',
    });
    const other = await ensureUser(strapi, login, {
      email: OTHER_EMAIL,
      username: OTHER_USERNAME,
      passwordKey: 'other_password',
    });
    const band = await ensureBand(strapi, owner, {
      name: 'RockSnaps Photography',
      slug: ROCKSNAPS_SLUG,
      bio: 'Local development profile for RockSnaps gallery publishing. Not a production account.',
    });
    const otherBand = await ensureBand(strapi, other, {
      name: 'Other Local Artist',
      slug: OTHER_SLUG,
      bio: 'Local development artist used to prove RockSnaps publishing stays limited to one band.',
    });

    const roomA = await ensureFile(strapi, { name: 'rocksnaps-local-a.png', url: png('rocksnaps-local-a.png'), width: 1200, height: 800 });
    const roomB = await ensureFile(strapi, { name: 'rocksnaps-local-b.png', url: png('rocksnaps-local-b.png'), width: 800, height: 1200 });
    const roomC = await ensureFile(strapi, { name: 'rocksnaps-local-c.png', url: png('rocksnaps-local-c.png'), width: 1600, height: 900 });
    const stageA = await ensureFile(strapi, { name: 'rocksnaps-local-d.png', url: png('rocksnaps-local-d.png'), width: 1400, height: 900 });
    const stageB = await ensureFile(strapi, { name: 'rocksnaps-local-e.png', url: png('rocksnaps-local-e.png'), width: 900, height: 1400 });
    const otherFile = await ensureFile(strapi, { name: 'other-local-a.png', url: png('other-local-a.png'), width: 1000, height: 1000 });

    const room = await ensureGallery(strapi, {
      userId: owner.id,
      bandId: band.id,
      title: 'Local Room',
      bodyText: 'Local Room is a development gallery for RockSnaps.',
      mediaIds: [roomA.id, roomB.id, roomC.id],
      coverMediaId: roomC.id,
      key: 'rocksnaps-local-room',
    });
    const stage = await ensureGallery(strapi, {
      userId: owner.id,
      bandId: band.id,
      title: 'Local Stage',
      bodyText: 'Local Stage is the second development gallery.',
      mediaIds: [stageA.id, stageB.id],
      coverMediaId: stageB.id,
      key: 'rocksnaps-local-stage',
    });
    const otherGallery = await ensureGallery(strapi, {
      userId: other.id,
      bandId: otherBand.id,
      title: 'Other Room',
      bodyText: 'This gallery must never appear on RockSnaps.',
      mediaIds: [otherFile.id],
      coverMediaId: otherFile.id,
      key: 'other-local-room',
    });

    writeBandId(band.id);
    writeLogin({
      ...login,
      rocksnaps_email: ROCKSNAPS_EMAIL,
      other_email: OTHER_EMAIL,
      rocksnaps_band_id: String(band.id),
      other_band_id: String(otherBand.id),
      room_gallery_id: String(room.id),
      stage_gallery_id: String(stage.id),
      other_gallery_id: String(otherGallery.id),
      room_slug: room.slug,
      stage_slug: stage.slug,
    });

    console.log(`rocksnaps_band_id=${band.id}`);
    console.log(`rocksnaps_email=${ROCKSNAPS_EMAIL}`);
    console.log(`other_band_id=${otherBand.id}`);
    console.log(`room_gallery_id=${room.id} slug=${room.slug}`);
    console.log(`stage_gallery_id=${stage.id} slug=${stage.slug}`);
    console.log('credentials=.tmp/rocksnaps-local-login.txt');
  } finally {
    await strapi.destroy();
  }
}

main().catch((err) => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});
