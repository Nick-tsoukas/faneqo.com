/**
 * Artist Share QR drawer: scan policy, share URL, overlay language.
 * Run: node scripts/test-artist-share-drawer.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  ARTIST_SHARE_QR_LEVEL,
  ARTIST_SHARE_QR_LOGO_RATIO,
  ARTIST_SHARE_QR_MARGIN,
  artistSharePath,
  artistShareQrLogoSize,
  artistShareQrSize,
} from '../utils/share/artistShareQr.js'
import { faneqoShareUrl, shareFaneqoUrl } from '../utils/share/faneqoShare.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

function compileSfc(rel) {
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [], `${rel} parse errors`)
  if (descriptor.scriptSetup || descriptor.script) {
    const script = compileScript(descriptor, { id: rel, filename: rel })
    assert.ok(script.content, `${rel} script compiled`)
  }
  const template = compileTemplate({
    source: descriptor.template.content,
    filename: rel,
    id: rel,
  })
  assert.deepEqual(template.errors, [], `${rel} template compile errors`)
}

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

test('canonical artist path never carries dashboard or from state', () => {
  assert.equal(artistSharePath('therockers'), '/therockers')
  assert.equal(artistSharePath('/therockers/'), '/therockers')
  assert.equal(artistSharePath('the-rockers?preview=1'), '')
  assert.equal(artistSharePath('../evil'), '')
  assert.equal(
    faneqoShareUrl({ canonicalPath: artistSharePath('therockers'), origin: 'https://faneqo.com' }),
    'https://faneqo.com/therockers',
  )
})

test('QR encodes the gateway, share copies the artist page', () => {
  const qr = read('utils/qr.ts')
  assert.match(qr, /qr\.faneqo\.com\/directqr\?band=/)
  const drawer = read('components/ShareQrDrawer.vue')
  assert.match(drawer, /getBandShareQrUrl\(props\.bandSlug\)/)
  assert.match(drawer, /faneqoShareUrl\(\{ canonicalPath: canonicalPath\.value \}\)/)
  assert.equal(
    faneqoShareUrl({ canonicalPath: '/therockers', origin: 'https://faneqo.com' }),
    'https://faneqo.com/therockers',
  )
})

test('QR size stays scannable and leaves room for identity + actions', () => {
  assert.equal(artistShareQrSize({ width: 320, height: 844 }), 164)
  assert.equal(artistShareQrSize({ width: 390, height: 844 }), 200)
  assert.equal(artistShareQrSize({ width: 430, height: 844 }), 212)
  assert.ok(artistShareQrSize({ width: 390, height: 600 }) < artistShareQrSize({ width: 390, height: 844 }))
  assert.ok(artistShareQrSize({ width: 320, height: 568 }) >= 148)
  assert.ok(artistShareQrSize({ width: 430, height: 932 }) <= 220)
})

test('center logo stays below a safe coverage ratio', () => {
  assert.equal(ARTIST_SHARE_QR_LEVEL, 'H')
  assert.equal(ARTIST_SHARE_QR_MARGIN, 2)
  assert.ok(ARTIST_SHARE_QR_LOGO_RATIO <= 0.18)
  assert.equal(artistShareQrLogoSize(200), 32)
  assert.ok(artistShareQrLogoSize(164) / 164 <= 0.18)
})

test('native share prefers navigator.share then copy', async () => {
  let shared = null
  const native = await shareFaneqoUrl({
    title: 'The Rockers',
    text: 'Share The Rockers',
    canonicalPath: artistSharePath('therockers'),
    origin: 'https://faneqo.com',
  }, {
    navigator: { share: async (payload) => { shared = payload } },
  })
  assert.equal(native.method, 'share')
  assert.equal(shared.url, 'https://faneqo.com/therockers')
  assert.doesNotMatch(shared.url, /dashboard|from=|preview/)

  let copied = ''
  const clipboard = await shareFaneqoUrl({
    title: 'The Rockers',
    canonicalPath: artistSharePath('therockers'),
    origin: 'https://faneqo.com',
  }, {
    navigator: { clipboard: { writeText: async (value) => { copied = value } } },
  })
  assert.equal(clipboard.method, 'copy')
  assert.equal(copied, 'https://faneqo.com/therockers')
})

test('ShareQrDrawer compiles and drops the old neon language', () => {
  compileSfc('components/ShareQrDrawer.vue')
  const src = read('components/ShareQrDrawer.vue')
  assert.match(src, /role="dialog"/)
  assert.match(src, /aria-modal="true"/)
  assert.match(src, /FaneqoIconButton/)
  assert.match(src, /aria-label="Close"/)
  assert.match(src, /shareFaneqoUrl/)
  assert.match(src, /getBandShareQrUrl/)
  assert.match(src, /useFocusTrap/)
  assert.match(src, /lockOverlayScroll/)
  assert.match(src, /prefers-reduced-motion/)
  assert.match(src, /env\(safe-area-inset-bottom/)
  assert.match(src, /level="H"|qrLevel/)
  assert.match(src, /render-as="svg"/)
  assert.match(src, /Share artist/)
  assert.match(src, /class="asq__head"/)
  assert.doesNotMatch(src, /<header[\s>]/)
  assert.match(src, /Scan to open the artist page/)
  assert.match(src, /Share link/)
  assert.match(src, /Copy link/)
  assert.doesNotMatch(src, /SCAN TO CONNECT|Scan to Connect/)
  assert.doesNotMatch(src, /animate-pulse-slow|animate-float/)
  assert.doesNotMatch(src, /from-accent to-neon-purple/)
  assert.doesNotMatch(src, /NightShareSheet|useShareKit|ShareCustomizeDrawer/)
  assert.doesNotMatch(src, /blur-\[120px\]|blur-\[100px\]/)
})

test('artist ShareDrawer keeps share, link, download, and Facebook', () => {
  const src = read('components/band/ShareDrawer.vue')
  assert.match(src, /Share Now/)
  assert.match(src, /Copy Link/)
  assert.match(src, /Download Image/)
  assert.match(src, /Share on Facebook/)
  assert.match(src, /generateFanShareImage/)
  assert.match(src, /grid-cols-2/)
  assert.doesNotMatch(src, /Copy Caption/)
  assert.doesNotMatch(src, /Instagram/)
  assert.doesNotMatch(src, /handleCopyCaption|handleInstagramKit|preparingIG/)
})

test('dock still opens ShareQrDrawer and is otherwise untouched by this file', () => {
  const nav = read('components/MobileBottomNav.vue')
  assert.match(nav, /ShareQrDrawer/)
  assert.match(nav, /aria-label="Share artist page"/)
  assert.match(nav, /fq-artist-nav/)
})

console.log(`\n${passed} tests passed`)
