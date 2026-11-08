/**
 * Share Photos production flow contracts.
 * Run: node scripts/test-share-photos.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { deriveShowPhotosTitle, formatJoinedMonthYear, formatShowNightDate } from '../utils/shows/formatShowNightDate.js'
import { hideArtistUpdatesRedirect } from '../utils/updates/hideArtistUpdatesPath.js'
import { buildSharePhotosPath, recapIdFrom, safeSharePhotosReturnPath } from '../utils/updates/sharePhotosFromRecap.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

assert.equal(formatShowNightDate('2024-10-18'), 'Oct 18')
assert.equal(formatShowNightDate('2024-10-18T04:00:00.000Z'), 'Oct 18')
assert.equal(formatJoinedMonthYear('2025-06-01T00:00:00.000Z'), 'June 2025')
assert.equal(deriveShowPhotosTitle({ city: 'Nashville', venue: 'The Basement East', date: '2024-10-18' }), 'Nashville — Oct 18')

assert.equal(recapIdFrom({ id: 41 }), '41')
assert.equal(recapIdFrom({ recapId: '12' }), '12')
assert.equal(recapIdFrom({}), null)

const eventPath = buildSharePhotosPath({
  id: 41,
  eventId: 88,
  city: 'Nashville',
  venue: 'The Basement East',
  campaignId: 'sm_123',
}, { from: '/fans/recaps/41' })
assert.match(eventPath, /recapId=41/)
assert.match(eventPath, /eventId=88/)
assert.doesNotMatch(eventPath, /sm_/)
assert.doesNotMatch(eventPath, /campaignId/)
assert.match(eventPath, /^\/galleries\/new\?/)

const manualPath = buildSharePhotosPath({ id: 9, campaignId: 'sm_manual', city: 'Nashville' })
assert.match(manualPath, /recapId=9/)
assert.doesNotMatch(manualPath, /eventId/)
assert.doesNotMatch(manualPath, /sm_manual/)

assert.equal(safeSharePhotosReturnPath('/fans/recaps/41', 41), '/fans/recaps/41')
assert.equal(safeSharePhotosReturnPath('https://evil.example/phish', 41), '/fans/recaps/41')
assert.equal(safeSharePhotosReturnPath('/dashboard', 41), '/dashboard')

const composer = read('components/updates/ArtistUpdateComposer.vue')
assert.match(composer, /show-photos/)
assert.match(composer, /show_attendees/)
assert.match(composer, /People who were there/)
assert.match(composer, /Share with people from tonight/)
assert.match(composer, /linear-gradient\(\s*100deg,\s*#4ca6ff 0%,\s*#39d5ff 48%,\s*#45e3ae 100%\)/)
assert.match(composer, /Publishing…/)
assert.doesNotMatch(composer, /\.auc--show \.auc__publish \{[\s\S]*background:\s*#f7f9fc/)
// Uploads now go through the gallery draft session; the server, not the
// browser, classifies each file from the draft's confirmed audience.
assert.match(composer, /uploadDraftMedia\(sessionId\.value/)
assert.doesNotMatch(composer, /uploadProtectedMedia/)
assert.match(composer, /deliveryReady/)
assert.match(composer, /publishIdempotencyKey/)
assert.match(composer, /publishedLock/)
assert.match(composer, /FANEQO_SHOW_MAX_IMAGES/)
assert.match(composer, /FANEQO_UPDATE_MAX_IMAGES/)
assert.match(composer, /up to \$\{maxPhotos\}/)
assert.doesNotMatch(composer, /campaignId/)

const recapList = read('components/nights/NightHistoryRow.vue')
assert.match(recapList, /Share photos/)
assert.match(recapList, /buildSharePhotosPath/)

const hide = read('middleware/hide-artist-updates.ts')
assert.match(hide, /hideArtistUpdatesRedirect/)
assert.equal(hideArtistUpdatesRedirect('/updates'), '/dashboard')
assert.equal(hideArtistUpdatesRedirect('/updates/new'), '/dashboard')
assert.equal(hideArtistUpdatesRedirect('/some-band/updates/nashville-oct-18'), null)

const cta = read('components/updates/SharePhotosFromTonightCta.vue')
assert.doesNotMatch(cta, /hasLabs/)
assert.match(cta, /Share photos from tonight/)
assert.match(cta, /buildSharePhotosPath/)

const studio = read('pages/galleries/new.vue')
assert.match(studio, /getRecapDetail/)
assert.match(studio, /:show-recap-id="selectedRecap\?\.id \|\| null"/)
assert.doesNotMatch(studio, /middleware: \['auth', 'labs'\]/)

const picker = read('components/media/FaneqoMediaPicker.vue')
assert.match(picker, /variant === 'block'/)

console.log('test-share-photos: ok')
