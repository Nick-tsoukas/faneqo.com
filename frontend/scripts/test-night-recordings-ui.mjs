/**
 * Night Recordings frontend + Public Night hierarchy.
 * Run: node scripts/test-night-recordings-ui.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  canPublishGatedUpload,
  formatRecordingDuration,
  gatedUploadPublishCopy,
  humanizeRecordingError,
  parseSpotifyInput,
  parseYoutubeInput,
  presentNightRecordings,
  publicNightRecordings,
  recordingSectionPlan,
  recordingSourceChoice,
  sortNightRecordings,
  validateRecordingFile,
  youtubeEmbedUrl,
  youtubeVideoIdFromUrl,
} from '../utils/nights/nightRecordings.js'

const root = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(root, '..', rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

function compileSfc(rel) {
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [], `${rel} parse errors`)
  if (descriptor.script || descriptor.scriptSetup) {
    compileScript(descriptor, { id: rel, filename: rel })
  }
  if (descriptor.template) {
    const template = compileTemplate({
      source: descriptor.template.content,
      filename: rel,
      id: rel,
    })
    assert.deepEqual(template.errors, [], `${rel} template compile errors`)
  }
}

test('source choice maps kind + source', () => {
  assert.equal(recordingSourceChoice('video', 'youtube'), 'youtube')
  assert.equal(recordingSourceChoice('audio', 'spotify'), 'spotify')
  assert.equal(recordingSourceChoice('audio', 'upload'), 'upload-audio')
  assert.equal(recordingSourceChoice('video', 'upload'), 'upload-video')
})

test('YouTube and Spotify accept canonical URL forms only', () => {
  assert.equal(youtubeVideoIdFromUrl('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  assert.equal(parseYoutubeInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ').providerUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  assert.equal(parseYoutubeInput('not-a-link').error, 'invalid_youtube_url')
  const spotify = parseSpotifyInput('https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp')
  assert.equal(spotify.providerResourceType, 'track')
  assert.equal(parseSpotifyInput('https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02').error, 'invalid_spotify_url')
  assert.ok(youtubeEmbedUrl('dQw4w9WgXcQ').includes('youtube-nocookie.com'))
})

test('empty public recordings omit the section', () => {
  assert.deepEqual(publicNightRecordings([]), [])
  assert.equal(recordingSectionPlan([]).empty, true)
  const publicUi = read('components/nights/PublicNightRecordings.vue')
  assert.match(publicUi, /v-if="plan.recordings.length"/)
  assert.match(publicUi, /From the stage/)
  assert.doesNotMatch(publicUi, /No recordings|Add recording/)
})

test('render order follows backend sortOrder and mixed headings', () => {
  const rows = [
    { id: 2, kind: 'video', sortOrder: 1 },
    { id: 1, kind: 'audio', sortOrder: 0 },
  ]
  assert.deepEqual(sortNightRecordings(rows).map((row) => row.id), [1, 2])
  const mixed = recordingSectionPlan(rows)
  assert.equal(mixed.mixed, true)
  assert.equal(mixed.showHearHeading, true)
  const onlyAudio = recordingSectionPlan([{ id: 1, kind: 'audio', sortOrder: 0 }])
  assert.equal(onlyAudio.showHearHeading, false)
  const videoFirstBySort = [
    { id: 2, kind: 'video', sortOrder: 0 },
    { id: 1, kind: 'audio', sortOrder: 1 },
  ]
  assert.deepEqual(presentNightRecordings(videoFirstBySort).map((row) => row.id), [1, 2])
  assert.deepEqual(recordingSectionPlan(videoFirstBySort).recordings.map((row) => row.id), [1, 2])
  const onlyVideo = recordingSectionPlan([{ id: 3, kind: 'video', sortOrder: 0 }])
  assert.deepEqual(onlyVideo.recordings.map((row) => row.id), [3])
  assert.equal(onlyVideo.audio.length, 0)
})

test('gated uploaded media cannot publish', () => {
  assert.equal(canPublishGatedUpload({ source: 'upload', visibility: 'fan_list', status: 'published' }), false)
  assert.equal(canPublishGatedUpload({ source: 'youtube', visibility: 'fan_list', status: 'published' }), true)
  assert.equal(canPublishGatedUpload({ source: 'upload', visibility: 'public', status: 'published' }), true)
  assert.match(gatedUploadPublishCopy(), /protected player/)
  assert.equal(formatRecordingDuration(272), '4:32')
  assert.equal(formatRecordingDuration(null), '')
})

test('upload validation stays honest', () => {
  assert.equal(validateRecordingFile({ name: 'song.mp3', type: 'audio/mpeg', size: 1000 }, 'audio').error, null)
  assert.equal(validateRecordingFile({ name: 'clip.mov', type: 'video/quicktime', size: 1000 }, 'video').error, 'invalid_type')
  assert.equal(validateRecordingFile({ name: 'clip.mp4', type: 'video/mp4', size: 60 * 1024 * 1024 }, 'video').error, 'too_large')
  assert.equal(humanizeRecordingError({ data: { error: { name: 'invalid_youtube_url' } } }), 'Use a valid YouTube video link.')
})

test('Public Night hierarchy is Story → Recordings → Gallery → Lineup', () => {
  const night = read('components/nights/PublicNightExperience.vue')
  const storyAt = night.indexOf('The story')
  const recAt = night.indexOf('PublicNightRecordings')
  const fromAt = night.indexOf('From the night')
  const lineupAt = night.indexOf('PublicNightLineup')
  assert.ok(storyAt > 0 && recAt > storyAt, 'recordings follow story')
  assert.ok(fromAt > recAt, 'gallery follows recordings')
  assert.ok(lineupAt > fromAt, 'lineup follows gallery')
  assert.match(night, /publicNightRecordings/)
  assert.match(night, /pn__on-stage/)
  assert.match(night, /is-rail/)
  assert.match(night, /grid-template-columns: minmax\(0, 1fr\) 11\.5rem/)
  assert.doesNotMatch(night, /featuredRecording/)
})

test('mobile DOM keeps Story → From the Stage → From the Night → On Stage', () => {
  const night = read('components/nights/PublicNightExperience.vue')
  const storyAt = night.indexOf('pn__story-block')
  const recAt = night.indexOf('<PublicNightRecordings')
  const fromAt = night.indexOf('pn__from')
  const lineupAt = night.indexOf('<PublicNightLineup')
  assert.ok(storyAt > 0 && recAt > storyAt && fromAt > recAt && lineupAt > fromAt)
  const lineup = read('components/nights/PublicNightLineup.vue')
  assert.match(lineup, /On stage/)
  assert.doesNotMatch(lineup, /is-top|badge|card/)
})

test('composer starts with source and only reveals relevant fields', () => {
  const composer = read('components/nights/NightRecordingComposer.vue')
  const helpers = read('utils/nights/nightRecordings.js')
  assert.match(helpers, /label: 'YouTube'/)
  assert.match(helpers, /label: 'Spotify'/)
  assert.match(helpers, /label: 'Upload audio'/)
  assert.match(helpers, /label: 'Upload video'/)
  assert.match(composer, /NIGHT_RECORDING_SOURCES/)
  assert.match(composer, /v-if="choice === 'youtube'"/)
  assert.match(composer, /v-else-if="choice === 'spotify'"/)
  assert.match(composer, /v-else-if="isUpload"/)
  assert.match(composer, /gatedUploadBlocked/)
  assert.doesNotMatch(composer, /waveform|HLS|transcod/)
})

test('Show Recap recordings are a completion action, not a CMS dump', () => {
  const recap = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  const manager = read('components/nights/NightRecordingManager.vue')
  assert.match(recap, /NightRecordingManager/)
  assert.match(recap, /ar__recordings/)
  assert.match(manager, /Add something from the stage/)
  assert.match(manager, /Add recording/)
  assert.match(manager, /background: #f3f3f4/)
  assert.doesNotMatch(manager, /CMS|attachment|file manager/)
})

test('Night media uses Artist Page language without Artist Page analytics', () => {
  const item = read('components/nights/NightRecordingItem.vue')
  assert.match(item, /nri__track/)
  assert.match(item, /nri__onframe/)
  assert.match(item, /nri__glass/)
  assert.match(item, /nri__play/)
  assert.match(item, /youtube-nocookie|youtubeEmbedUrl/)
  assert.match(item, /\/api\/spotify\/oembed/)
  assert.match(item, /playing = true/)
  assert.doesNotMatch(item, /trackMediaPlay|useBeacon|useFanInteractionTracker|played_featured_song|clicked_video/)
  assert.doesNotMatch(item, /EliteSpotifyEmbedWidget|AudioPlayer|BandPageCybered|VideoCard/)
  assert.doesNotMatch(item, /emit\(['\"]play|spotify-play|media-play/)
})

test('Show Recap uses the same recording presentation as Public Night', () => {
  const list = read('components/nights/NightRecordingList.vue')
  const item = read('components/nights/NightRecordingItem.vue')
  const manager = read('components/nights/NightRecordingManager.vue')
  assert.match(list, /NightRecordingItem/)
  assert.match(list, /nrl__actions/)
  assert.match(manager, /onSaved/)
  assert.match(manager, /freshId/)
  assert.match(manager, /scrollIntoView/)
  assert.doesNotMatch(item, /trackMediaPlay|useBeacon|useFanInteractionTracker|played_featured_song/)
  assert.doesNotMatch(list, /trackMediaPlay|useBeacon/)
  assert.doesNotMatch(manager, /AudioPlayer|EliteSpotifyEmbedWidget|BandPageCybered/)
})

test('Show Recap Night content is Story → Recordings → Gallery → Lineup', () => {
  const recap = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  const storyAt = recap.indexOf('ar__story-block')
  const recAt = recap.indexOf('NightRecordingManager')
  const fromAt = recap.indexOf('ar__from')
  const lineupAt = recap.indexOf('PublicNightLineup')
  const afterAt = recap.indexOf('ar__after')
  assert.ok(storyAt > 0 && recAt > storyAt, 'recordings follow story')
  assert.ok(fromAt > recAt, 'gallery follows recordings')
  assert.ok(lineupAt > fromAt, 'lineup follows gallery')
  assert.ok(afterAt > lineupAt, 'after the show follows lineup')
  assert.doesNotMatch(recap, /lineupBillingTier|ar__billing|is-top/)
})

test('Passport does not grow a second recordings surface', () => {
  const home = read('components/passport/FanPassportHome.vue')
  const memory = read('components/passport/FanPassportNightMemory.vue')
  const detail = read('components/passport/FanPassportNightDetail.vue')
  assert.doesNotMatch(home, /From the stage|NightRecording/)
  assert.doesNotMatch(memory, /From the stage|NightRecording/)
  assert.doesNotMatch(detail, /From the stage|NightRecordingManager|Hear the night/)
})

test('SFC sanity', () => {
  compileSfc('components/nights/PublicNightLineup.vue')
  compileSfc('components/nights/NightRecordingItem.vue')
  compileSfc('components/nights/PublicNightRecordings.vue')
  compileSfc('components/nights/NightRecordingComposer.vue')
  compileSfc('components/nights/NightRecordingList.vue')
  compileSfc('components/nights/NightRecordingManager.vue')
  compileSfc('components/nights/PublicNightExperience.vue')
  compileSfc('components/dashboard/fans/ShowRecapDetailContent.vue')
  compileSfc('components/labs/NightRecordingsLabBoard.vue')
  compileSfc('pages/__dev/night-recordings.vue')
  compileSfc('pages/labs/night-recordings.vue')
})

console.log(`test-night-recordings-ui: ${passed} ok`)
