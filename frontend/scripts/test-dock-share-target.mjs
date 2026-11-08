/**
 * Mobile dock Share must follow the public artist on screen.
 * Run: node scripts/test-dock-share-target.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { artistSharePath } from '../utils/share/artistShareQr.js'
import { faneqoShareUrl } from '../utils/share/faneqoShare.js'
import {
  publicArtistShareRecord,
  resolveDockShareTarget,
  resolveWorkspaceShareBand,
  shareTargetChanged,
} from '../utils/share/dockShareTarget.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

const OWNER = {
  slug: 'artist-a',
  name: 'Artist A',
  profileImage: 'https://cdn.example/a.jpg',
}
const VISITED = {
  slug: 'artist-b',
  name: 'Artist B',
  profileImage: 'https://cdn.example/b.jpg',
}

function pageUrl(slug) {
  return faneqoShareUrl({
    canonicalPath: artistSharePath(slug),
    origin: 'https://faneqo.com',
  })
}

function qrUrl(slug) {
  return `https://qr.faneqo.com/directqr?band=${encodeURIComponent(slug)}`
}

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

test('signed-in artist A viewing artist B shares B, including QR and copy URL', () => {
  const target = resolveDockShareTarget({
    routeSlug: 'artist-b',
    publicArtist: VISITED,
    workspace: OWNER,
  })
  assert.equal(target.available, true)
  assert.equal(target.context, 'public')
  assert.equal(target.slug, 'artist-b')
  assert.equal(target.name, 'Artist B')
  assert.equal(target.profileImage, 'https://cdn.example/b.jpg')
  assert.equal(pageUrl(target.slug), 'https://faneqo.com/artist-b')
  assert.equal(qrUrl(target.slug), 'https://qr.faneqo.com/directqr?band=artist-b')
  assert.notEqual(target.slug, OWNER.slug)
  assert.notEqual(target.name, OWNER.name)
  assert.notEqual(target.profileImage, OWNER.profileImage)
})

test('artist B branding can be absent without substituting artist A', () => {
  const target = resolveDockShareTarget({
    routeSlug: 'artist-b',
    publicArtist: null,
    workspace: OWNER,
  })
  assert.equal(target.available, true)
  assert.equal(target.slug, 'artist-b')
  assert.equal(target.name, '')
  assert.equal(target.profileImage, null)
  assert.equal(pageUrl(target.slug), 'https://faneqo.com/artist-b')
  assert.equal(qrUrl(target.slug), 'https://qr.faneqo.com/directqr?band=artist-b')
})

test('a public route with an unusable slug does not fall back to the signed-in band', () => {
  const target = resolveDockShareTarget({
    routeSlug: '../artist-a',
    publicArtist: null,
    workspace: OWNER,
  })
  assert.equal(target.available, false)
  assert.equal(target.context, 'unavailable')
  assert.equal(target.slug, '')
  assert.equal(target.name, '')
  assert.equal(target.profileImage, null)
  assert.equal(pageUrl(target.slug), null)
  assert.equal(qrUrl(''), 'https://qr.faneqo.com/directqr?band=')
})

test('stale loaded artist is not shown while the route has moved on', () => {
  const record = publicArtistShareRecord({
    routeSlug: 'artist-c',
    loaded: VISITED,
  })
  assert.equal(record.slug, 'artist-c')
  assert.equal(record.name, '')
  assert.equal(record.profileImage, null)

  const target = resolveDockShareTarget({
    routeSlug: 'artist-c',
    publicArtist: VISITED,
    workspace: OWNER,
  })
  assert.equal(target.slug, 'artist-c')
  assert.equal(target.name, '')
  assert.equal(target.profileImage, null)
})

test('switching artists updates the share target and closes a drawer that was showing the previous artist', () => {
  const steps = ['artist-a', 'artist-b', 'artist-c', 'artist-b']
  let open = false
  let previous = ''
  const seen = []
  for (const slug of steps) {
    const target = resolveDockShareTarget({
      routeSlug: slug,
      publicArtist: { slug, name: slug, profileImage: `https://cdn.example/${slug}.jpg` },
      workspace: OWNER,
    })
    if (open && previous && shareTargetChanged(previous, target.slug)) open = false
    assert.equal(open, false)
    open = true
    previous = target.slug
    seen.push({
      slug: target.slug,
      name: target.name,
      image: target.profileImage,
      page: pageUrl(target.slug),
      qr: qrUrl(target.slug),
    })
  }
  assert.deepEqual(seen.map((row) => row.slug), steps)
  assert.equal(seen[1].page, 'https://faneqo.com/artist-b')
  assert.equal(seen[1].qr, 'https://qr.faneqo.com/directqr?band=artist-b')
  assert.equal(seen[2].name, 'artist-c')
  assert.equal(seen[3].slug, 'artist-b')
  assert.equal(seen[3].image, 'https://cdn.example/artist-b.jpg')
  assert.equal(shareTargetChanged('artist-b', 'artist-b'), false)
})

test('dashboard and other workspace routes share the active band, ignoring a stale public artist', () => {
  const workspace = resolveWorkspaceShareBand({
    active: { slug: 'artist-a', name: 'Artist A' },
    mode: 'single',
    legacyBand: OWNER,
  })
  const target = resolveDockShareTarget({
    routeSlug: '',
    publicArtist: VISITED,
    workspace,
  })
  assert.equal(target.context, 'workspace')
  assert.equal(target.slug, 'artist-a')
  assert.equal(target.name, 'Artist A')
  assert.equal(target.profileImage, 'https://cdn.example/a.jpg')
  assert.equal(pageUrl(target.slug), 'https://faneqo.com/artist-a')
  assert.equal(qrUrl(target.slug), 'https://qr.faneqo.com/directqr?band=artist-a')
})

test('several owned bands use the scoped workspace band and do not keep the other band image', () => {
  const first = { slug: 'artist-a', name: 'Artist A', profileImage: 'https://cdn.example/a.jpg' }
  const second = { slug: 'artist-c', name: 'Artist C' }
  const scoped = resolveWorkspaceShareBand({
    active: second,
    mode: 'scoped',
    legacyBand: first,
  })
  assert.equal(scoped.slug, 'artist-c')
  assert.equal(scoped.name, 'Artist C')
  assert.equal(scoped.profileImage, null)

  const target = resolveDockShareTarget({ routeSlug: '', workspace: scoped })
  assert.equal(target.slug, 'artist-c')
  assert.equal(target.profileImage, null)
  assert.equal(qrUrl(target.slug), 'https://qr.faneqo.com/directqr?band=artist-c')
})

test('a multi-band user with no validated choice keeps the existing dock band', () => {
  const legacy = resolveWorkspaceShareBand({
    active: { slug: 'artist-c', name: 'Artist C' },
    mode: 'picker',
    legacyBand: OWNER,
  })
  assert.equal(legacy.slug, 'artist-a')
  assert.equal(legacy.profileImage, OWNER.profileImage)
})

test('viewing your own public page may use workspace branding for that same slug', () => {
  const target = resolveDockShareTarget({
    routeSlug: 'artist-a',
    publicArtist: null,
    workspace: OWNER,
  })
  assert.equal(target.context, 'public')
  assert.equal(target.slug, 'artist-a')
  assert.equal(target.name, 'Artist A')
  assert.equal(target.profileImage, OWNER.profileImage)
})

test('a public gallery route shares that gallery artist, not the signed-in band', () => {
  const target = resolveDockShareTarget({
    routeSlug: 'artist-b',
    publicArtist: { slug: 'artist-b', name: 'Artist B', profileImage: null },
    workspace: OWNER,
  })
  assert.equal(target.slug, 'artist-b')
  assert.equal(target.name, 'Artist B')
  assert.equal(target.profileImage, null)
  assert.equal(qrUrl(target.slug), 'https://qr.faneqo.com/directqr?band=artist-b')
})

test('loaded canonical slug is kept when the route casing differs', () => {
  const record = publicArtistShareRecord({
    routeSlug: 'Artist-B',
    loaded: { slug: 'artist-b', name: 'Artist B', profileImage: 'https://cdn.example/b.jpg' },
  })
  assert.equal(record.slug, 'artist-b')
  assert.equal(record.name, 'Artist B')
  const bare = publicArtistShareRecord({ routeSlug: 'Artist-B', loaded: null })
  assert.equal(bare.slug, 'artist-b')
  assert.equal(bare.name, '')
})

test('dock wires shareTarget, gallery reuses that dock, and in-page share is untouched', () => {
  const nav = read('components/MobileBottomNav.vue')
  assert.match(nav, /:band-slug="shareTarget\.slug"/)
  assert.match(nav, /:disabled="!shareTarget\.available"/)
  assert.match(nav, /if \(prev && shareTargetChanged\(prev, next\)\) showShareDrawer\.value = false/)
  assert.doesNotMatch(nav, /:band-slug="displayBand/)

  const gallery = read('components/nights/PublicGalleryExperience.vue')
  assert.match(gallery, /<MobileBottomNav/)
  assert.match(gallery, /publicArtistShareRecord/)
  assert.match(gallery, /const shareUrl = computed\(\(\) => faneqoShareUrl/)
  assert.match(gallery, /NightShareSheet/)

  const page = read('pages/[bandSlug]/index.vue')
  assert.match(page, /publicArtistShareRecord/)
  assert.match(page, /:band-slug="currentBandSlug"/)
  assert.match(page, /const shareUrl = `\$\{window\.location\.origin\}\/\$\{currentBandSlug\.value\}`/)
  assert.match(page, /<ShareDrawer/)
  assert.doesNotMatch(page, /ShareQrDrawer|displayBand|user-band-nav/)

  const drawer = read('components/ShareQrDrawer.vue')
  assert.match(drawer, /getBandShareQrUrl\(props\.bandSlug\)/)
  assert.match(drawer, /faneqoShareUrl\(\{ canonicalPath: canonicalPath\.value \}\)/)
  const qr = read('utils/qr.ts')
  assert.match(qr, /const QR_GATEWAY_ORIGIN = 'https:\/\/qr\.faneqo\.com'/)
  assert.match(qr, /directqr\?band=\$\{encodeURIComponent\(slug\)\}/)
  const gateway = read('server/routes/directqr.ts')
  assert.match(gateway, /incoming\.band/)
  assert.match(gateway, /qr: null/)
})

console.log(`\n${passed} tests passed`)
