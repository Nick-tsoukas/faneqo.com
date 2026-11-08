/**
 * Artist-world Night / Gallery contextual Back.
 * Run: node scripts/test-artist-world-nav.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  artistWorldReturnLabel,
  preserveSafeFromQuery,
  readSafeFromQuery,
  resolveGalleryReturn,
  resolveNightReturn,
  sanitizeArtistWorldFrom,
  stripNavFrom,
  withSafeFrom,
} from '../utils/nights/artistWorldReturn.js'
import { publicShareHead } from '../utils/nights/publicShareHead.js'
import { faneqoShareUrl, shareFaneqoUrl } from '../utils/share/faneqoShare.js'
import { safeGalleryViewerReturn } from '../utils/updates/nightStoryCopy.js'

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

const nightHref = '/therockers/night/the-rock-chicago-sep-3-2026-8bcefe8f'
const galleryHref = '/therockers/gallery/fun-time-last-gallery'
const artistPath = '/therockers'

test('1. artist gallery management from=/galleries wins over parent Night', () => {
  const result = resolveGalleryReturn({
    from: '/galleries',
    nightHref,
    nightLabel: 'The Rock · Chicago',
    artistPath,
    artistName: 'The Rockers',
  })
  assert.equal(result.to, '/galleries')
  assert.equal(result.label, 'Galleries')
  assert.equal(safeGalleryViewerReturn('/galleries', 'therockers'), '/galleries')
  const page = read('pages/galleries/index.vue')
  const helper = read('utils/galleries/archiveShelves.js')
  assert.match(helper, /from=\$\{encodeURIComponent\('\/galleries'\)\}/)
  assert.match(page, /FaneqoGalleryArchive/)
  const gallery = read('components/nights/PublicGalleryExperience.vue')
  assert.match(gallery, /resolveGalleryReturn/)
  assert.match(gallery, /navReturn\.to/)
})

test('2. public Night → Gallery stays an overlay; canonical from is preserved when used', () => {
  const night = read('components/nights/PublicNightExperience.vue')
  assert.match(night, /NightGalleryViewer/)
  assert.match(night, /openGallery/)
  assert.match(night, /lockOverlayScroll/)
  assert.doesNotMatch(night, /navigateTo\(.*galleryPath/)
  const fromNight = withSafeFrom(galleryHref, nightHref)
  assert.equal(fromNight, `${galleryHref}?from=${encodeURIComponent(nightHref)}`)
  const result = resolveGalleryReturn({
    from: nightHref,
    nightHref,
    nightLabel: 'The Rock · Chicago',
    artistPath,
    artistName: 'The Rockers',
  })
  assert.equal(result.to, nightHref)
  assert.equal(result.label, 'The Rock · Chicago')
})

test('3. direct Gallery with Night and no from → parent Night', () => {
  const result = resolveGalleryReturn({
    from: '',
    nightHref,
    nightLabel: 'The Rock · Chicago',
    artistPath,
    artistName: 'The Rockers',
  })
  assert.equal(result.to, nightHref)
  assert.equal(result.label, 'The Rock · Chicago')
})

test('4. direct standalone Gallery with no from → artist page', () => {
  const result = resolveGalleryReturn({
    from: null,
    nightHref: null,
    artistPath,
    artistName: 'The Rockers',
  })
  assert.equal(result.to, artistPath)
  assert.equal(result.label, 'The Rockers')
})

test('5. Show Recap preview passes safe from and Back returns to that recap', () => {
  const preview = withSafeFrom(nightHref, '/fans/recaps/42')
  assert.equal(preview, `${nightHref}?from=${encodeURIComponent('/fans/recaps/42')}`)
  const result = resolveNightReturn({
    from: '/fans/recaps/42',
    artistPath,
    artistName: 'The Rockers',
  })
  assert.equal(result.to, '/fans/recaps/42')
  assert.equal(result.label, 'Show Recap')
  const recap = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  assert.match(recap, /nightPreviewHref/)
  assert.match(recap, /withSafeFrom/)
  assert.match(recap, /\/fans\/recaps\/\$\{props\.recap\.id\}/)
  assert.match(recap, /canonicalPath: nightHref\.value/)
})

test('5b. Passport from returns to Passport, not the artist page', () => {
  const result = resolveNightReturn({
    from: '/fan/passport',
    artistPath,
    artistName: 'The Rockers',
  })
  assert.equal(result.to, '/fan/passport')
  assert.equal(result.label, 'Passport')
  assert.equal(artistWorldReturnLabel({ from: '/fan/passport' }), 'Passport')
  assert.equal(
    withSafeFrom('/the-rockers/night/the-rad-spot', '/fan/passport'),
    '/the-rockers/night/the-rad-spot?from=%2Ffan%2Fpassport',
  )
  assert.equal(sanitizeArtistWorldFrom('passport'), null)
})

test('6. direct Night with no from → artist page', () => {
  const result = resolveNightReturn({
    from: '',
    artistPath,
    artistName: 'The Rockers',
  })
  assert.equal(result.to, artistPath)
  assert.equal(result.label, 'The Rockers')
})

test('7. invalid external from is ignored', () => {
  assert.equal(sanitizeArtistWorldFrom('https://example.com'), null)
  assert.equal(readSafeFromQuery({ from: 'https://example.com' }), null)
  const gallery = resolveGalleryReturn({
    from: 'https://example.com',
    nightHref,
    nightLabel: 'The Rock · Chicago',
    artistPath,
    artistName: 'The Rockers',
  })
  assert.equal(gallery.to, nightHref)
  const night = resolveNightReturn({
    from: 'https://example.com',
    artistPath,
    artistName: 'The Rockers',
  })
  assert.equal(night.to, artistPath)
})

test('8. protocol-relative and other open-redirect tricks are rejected', () => {
  const attacks = [
    '//example.com',
    'http://evil.com',
    'javascript:alert(1)',
    'data:text/html,hi',
    '/\\example.com',
    '/%2F%2Fexample.com',
  ]
  for (const value of attacks) {
    assert.equal(sanitizeArtistWorldFrom(value), null, value)
    assert.notEqual(resolveGalleryReturn({
      from: value,
      nightHref,
      artistPath,
      artistName: 'The Rockers',
    }).to.startsWith('http'), true, value)
    assert.ok(
      resolveGalleryReturn({ from: value, nightHref, artistPath }).to.startsWith('/'),
      value,
    )
  }
})

test('9. share Gallery URL never includes from', () => {
  assert.equal(
    faneqoShareUrl({
      canonicalPath: `${galleryHref}?from=/galleries`,
      origin: 'https://faneqo.com',
    }),
    `https://faneqo.com${galleryHref}`,
  )
  assert.equal(stripNavFrom(`${galleryHref}?from=/galleries`), galleryHref)
  assert.equal(stripNavFrom(`${galleryHref}?from=/galleries&photo=4`), galleryHref)
  const page = read('pages/[bandSlug]/gallery/[gallerySlug].vue')
  const gallery = read('components/nights/PublicGalleryExperience.vue')
  assert.match(gallery, /canonicalPath: props\.payload\?\.share\?\.canonicalPath/)
  assert.doesNotMatch(page + gallery, /canonicalPath: route\.(fullPath|query)/)
})

test('10. share Night URL never includes from', async () => {
  assert.equal(
    faneqoShareUrl({
      canonicalPath: `${nightHref}?from=/fans/recaps/42`,
      origin: 'https://faneqo.com',
    }),
    `https://faneqo.com${nightHref}`,
  )
  let shared = null
  await shareFaneqoUrl({
    title: 'Night',
    canonicalPath: `${nightHref}?from=/fans/recaps/42`,
    origin: 'https://faneqo.com',
  }, {
    navigator: { share: async (payload) => { shared = payload } },
  })
  assert.equal(shared.url, `https://faneqo.com${nightHref}`)
  const page = read('pages/[bandSlug]/night/[nightSlug].vue')
  assert.match(page, /canonicalPath: share\.canonicalPath/)
})

test('11. legacy /updates redirect preserves a safe from and drops an unsafe one', () => {
  assert.deepEqual(
    preserveSafeFromQuery({ from: '/galleries', utm_source: 'x' }),
    { from: '/galleries', utm_source: 'x' },
  )
  assert.deepEqual(
    preserveSafeFromQuery({ from: 'https://evil.com', vid: '1' }),
    { vid: '1' },
  )
  const page = read('pages/[bandSlug]/updates/[slug].vue')
  assert.match(page, /preserveSafeFromQuery\(route\.query\)/)
  assert.match(page, /redirectCode: 301/)
})

test('12. canonical / OG never receive from', () => {
  const head = publicShareHead({
    share: {
      canonicalPath: `${galleryHref}?from=/galleries`,
      title: 'Fun Time Last Gallery',
      description: 'Photos.',
    },
    origin: 'https://faneqo.com',
  })
  assert.equal(head.canonical, `https://faneqo.com${galleryHref}`)
  assert.doesNotMatch(head.canonical, /from=/)
  const helper = read('utils/nights/publicShareHead.js')
  assert.match(helper, /stripNavFrom/)
})

test('other safe management from is preserved', () => {
  assert.equal(resolveNightReturn({
    from: '/dashboard',
    artistPath,
    artistName: 'The Rockers',
  }).to, '/dashboard')
  assert.equal(artistWorldReturnLabel({ from: '/dashboard' }), 'Dashboard')
})

test('auth-loop from is ignored', () => {
  assert.equal(sanitizeArtistWorldFrom('/login'), null)
  assert.equal(sanitizeArtistWorldFrom('/fan/login'), null)
  assert.equal(resolveNightReturn({
    from: '/login',
    artistPath,
    artistName: 'The Rockers',
  }).to, artistPath)
})

test('chrome uses resolved return and does not hijack history when backTo exists', () => {
  const chrome = read('components/nights/ArtistWorldChrome.vue')
  assert.match(chrome, /if \(props\.backTo\) \{\s*navigateTo\(props\.backTo\)/)
  assert.match(chrome, /router\.back\(\)/)
  assert.match(chrome, /awc__back-text/)
})

test('touched SFCs compile', () => {
  compileSfc('pages/[bandSlug]/gallery/[gallerySlug].vue')
  compileSfc('pages/[bandSlug]/night/[nightSlug].vue')
  compileSfc('pages/[bandSlug]/updates/[slug].vue')
  compileSfc('components/nights/PublicGalleryExperience.vue')
  compileSfc('components/nights/PublicNightExperience.vue')
  compileSfc('components/nights/ArtistWorldChrome.vue')
  compileSfc('components/nights/ArtistWorldMissing.vue')
  compileSfc('components/dashboard/fans/ShowRecapDetailContent.vue')
})

console.log(`test-artist-world-nav: ${passed} ok`)
