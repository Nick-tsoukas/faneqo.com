/**
 * Gallery visibility + removal surfaces.
 * Hide / restore / remove-from-recap controls, artist-facing copy, and the
 * graceful unavailable states for fans and share-link visitors.
 * Run: node scripts/test-gallery-visibility-ui.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  isDraftGallery,
  isHiddenGallery,
  isLiveGallery,
} from '../utils/galleries/archiveShelves.js'

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
    const script = compileScript(descriptor, { id: rel, filename: rel })
    assert.ok(script.content, `${rel} script compiled`)
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

test('hidden is its own state, never mislabeled as a draft', () => {
  assert.equal(isHiddenGallery({ status: 'hidden' }), true)
  assert.equal(isHiddenGallery({ status: 'published' }), false)
  assert.equal(isDraftGallery({ status: 'hidden' }), false, 'hidden must not read as Draft')
  assert.equal(isDraftGallery({ status: 'draft' }), true)
  assert.equal(isLiveGallery({ status: 'published' }), true)
  assert.equal(isLiveGallery({}), true, 'a row with no status is treated as live')
  assert.equal(isLiveGallery({ status: 'hidden' }), false)
})

test('composable exposes hide, restore, and recap detach as PATCH actions', () => {
  const source = read('composables/useArtistUpdates.js')
  assert.match(source, /function hide\(id\)/)
  assert.match(source, /function restore\(id\)/)
  assert.match(source, /function detachFromRecap\(id\)/)
  assert.match(source, /artist-updates\/\$\{id\}\/\$\{action\}/)
  assert.match(source, /method: 'PATCH'/)
  assert.match(source, /manageAction\(id, 'hide'\)/)
  assert.match(source, /manageAction\(id, 'restore'\)/)
  assert.match(source, /manageAction\(id, 'detach-recap'\)/)
  assert.match(source, /requireAuth\(\)/, 'management actions require a signed-in artist')
})

test('archive item offers Hide when live and Restore when hidden', () => {
  const source = read('components/galleries/FaneqoGalleryArchiveItem.vue')
  assert.match(source, /Hide gallery/)
  assert.match(source, /Restore gallery/)
  assert.match(source, /v-if="hidden"[\s\S]{0,200}Restore gallery/)
  assert.match(source, /v-else-if="live"[\s\S]{0,220}Hide gallery/)
  assert.match(source, /v-if="hidden" class="fq-gitem__draft">Hidden/)
  // A hidden gallery must not offer sharing or sending.
  assert.match(source, /v-if="sendTo && !hidden"/)
  assert.match(source, /v-if="!hidden"[\s\S]{0,120}Share/)
})

test('hide confirmation is precise about what hiding can and cannot reach', () => {
  // Hiding closes Faneqo's own surfaces. It cannot recall a public CDN file
  // someone already fetched, and the copy must not pretend otherwise.
  const honest = [
    /Hiding removes the gallery from Faneqo and Faneqo shared-gallery pages\./,
    /Photos already downloaded, reposted, or directly cached elsewhere may remain available\./,
    /You can restore it later\./,
  ]
  for (const rel of [
    'components/galleries/FaneqoGalleryArchive.vue',
    'components/dashboard/fans/ShowRecapDetailContent.vue',
  ]) {
    const source = read(rel)
    assert.match(source, /heading="Hide this gallery\?"/)
    assert.match(source, /confirm-label="Hide gallery"/)
    for (const line of honest) assert.match(source, line, `${rel} hide copy`)
  }
})

test('artist copy never leaks lifecycle jargon', () => {
  const artistSurfaces = [
    'components/galleries/FaneqoGalleryArchive.vue',
    'components/galleries/FaneqoGalleryArchiveItem.vue',
    'components/galleries/FaneqoGalleryConfirm.vue',
    'components/dashboard/fans/ShowRecapDetailContent.vue',
  ]
  for (const rel of artistSurfaces) {
    const source = read(rel)
    for (const jargon of ['soft delete', 'soft-delete', 'unpublish', 'asset reference', 'lifecycle state']) {
      assert.ok(!source.toLowerCase().includes(jargon), `${rel} must not say "${jargon}"`)
    }
  }
})

test('recap gallery management offers open, remove from recap page, and hide', () => {
  const source = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  assert.match(source, /Open gallery/)
  assert.match(source, /Hide gallery/)
  assert.match(source, /detachFromRecap/)
  assert.match(source, /hide: hideGallery/)

  // Detach clears the recap link but keeps the event link, so the gallery can
  // still appear in the night's archive. The wording must say so.
  assert.match(source, /Remove from recap page/)
  assert.match(source, /heading="Remove this gallery from the recap page\?"/)
  assert.match(source, /This removes the gallery from this recap\./)
  assert.match(source, /It may still appear in this Night’s gallery archive/)
  assert.ok(
    !/confirm-label="Remove from recap"/.test(source),
    'the bare "Remove from recap" wording overclaims and must not return',
  )
})

test('share sheet states link reach honestly per audience', () => {
  const experience = read('components/nights/PublicGalleryExperience.vue')
  assert.match(experience, /Anyone with this shared link can view this gallery\./)
  assert.match(experience, /Only fans who can already see this gallery will be able to open this link\./)
  assert.match(experience, /gallery\.value\?\.visibility === 'public'/)
  const sheet = read('components/nights/NightShareSheet.vue')
  assert.match(sheet, /note: \{ type: String, default: '' \}/)
  assert.match(sheet, /v-if="note" class="ns__note"/)

  const archive = read('components/galleries/FaneqoGalleryArchive.vue')
  assert.match(archive, /Anyone with this shared link can view this gallery\./)
  assert.match(archive, /item\?\.visibility === 'public'/)
})

test('public share link renders an unavailable page, not a broken 404', () => {
  const source = read('pages/[bandSlug]/gallery/[gallerySlug].vue')
  assert.match(source, /data\.value\?\.unavailable === true/)
  assert.match(source, /This gallery is no longer available\./)
  assert.match(source, /setResponseStatus\(unavailable \? 410 : 404\)/)
  assert.match(source, /noindex, nofollow/)
  // Never overclaim what Faneqo can revoke.
  assert.match(source, /no longer available on Faneqo or Faneqo shared-gallery pages/)
  assert.match(source, /Photos already downloaded, reposted, or directly cached elsewhere may remain available\./)
})

test('fan passport separates removed-by-artist from not-authorized', () => {
  const source = read('pages/fan/passport/gallery/[id].vue')
  assert.match(source, /gallery_unavailable/)
  assert.match(source, /This gallery is no longer available\./)
  assert.match(source, /This gallery isn’t available to this account\./)
  assert.match(source, /loadError\.value = !removed\.value/)
})

test('message history keeps its own unavailable card', () => {
  const card = read('components/messages/FaneqoGalleryMessageCard.vue')
  assert.match(card, /This gallery is no longer available\./)
  assert.match(card, /the private conversation stays intact/)
  const mapper = read('utils/messages/mapInboxModels.js')
  assert.match(mapper, /gallery\.locked \|\| gallery\.unavailable/)
})

test('touched visibility SFCs compile', () => {
  compileSfc('components/galleries/FaneqoGalleryConfirm.vue')
  compileSfc('components/galleries/FaneqoGalleryArchive.vue')
  compileSfc('components/galleries/FaneqoGalleryArchiveItem.vue')
  compileSfc('components/dashboard/fans/ShowRecapDetailContent.vue')
  compileSfc('components/nights/ArtistWorldMissing.vue')
  compileSfc('components/nights/NightShareSheet.vue')
  compileSfc('components/nights/PublicGalleryExperience.vue')
  compileSfc('pages/[bandSlug]/gallery/[gallerySlug].vue')
  compileSfc('pages/fan/passport/gallery/[id].vue')
  compileSfc('pages/galleries/index.vue')
})

console.log(`test-gallery-visibility-ui: ${passed} ok`)
