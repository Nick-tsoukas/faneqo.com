/**
 * Desktop-only Cybered surface pass (AP.D2).
 * Run: node scripts/test-cybered-desktop-surfaces.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const rel = 'components/band/BandPageCybered.vue'

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function compileSfc(path) {
  const source = read(path)
  const { descriptor, errors } = parse(source, { filename: path })
  assert.equal(errors.length, 0, `${path} parse errors`)
  if (descriptor.scriptSetup || descriptor.script) {
    compileScript(descriptor, { id: 'test' })
  }
  if (descriptor.template) {
    compileTemplate({
      source: descriptor.template.content,
      filename: path,
      id: 'test',
    })
  }
}

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

const css = read(rel)

function desktopBlock() {
  const start = css.lastIndexOf('AP.D2')
  assert.ok(start > 0, 'AP.D2 desktop block present')
  return css.slice(start)
}

test('compiles BandPageCybered', () => {
  compileSfc(rel)
})

test('mobile polish-test canvas and bio stay on the existing charcoal values', () => {
  const beforeDesktop = css.slice(0, css.lastIndexOf('AP.D2'))
  assert.match(beforeDesktop, /\.band-page-cybered\[data-profile-variant='polish-test'\] \{\s*background: #050506;/)
  assert.match(beforeDesktop, /background-color: rgba\(7, 8, 10, 0\.92\)/)
  assert.match(beforeDesktop, /from-black via-black\/25 to-transparent/)
})

test('desktop canvas and bio use canonical obsidian', () => {
  const desktop = desktopBlock()
  assert.match(desktop, /min-width: 1024px/)
  assert.match(desktop, /--faneqo-obsidian, #050608/)
  assert.match(desktop, /\.cybered-content-card \{[\s\S]*#050608/)
  assert.match(desktop, /backdrop-filter: none/)
})

test('desktop hero fade lands on the same canvas black', () => {
  const desktop = desktopBlock()
  assert.match(desktop, /\.cybered-hero-fade--base/)
  assert.match(desktop, /#050608 0%/)
  assert.match(desktop, /\.cybered-hero-fade--veil/)
  assert.match(desktop, /\.cybered-hero-fade--foot/)
})

test('approved desktop geometry is unchanged', () => {
  assert.match(css, /max-width:\s*clamp\(52rem, 68vw, 62rem\)/)
  assert.match(css, /height:\s*clamp\(31rem, 56vh, 35rem\)/)
  assert.match(css, /\.cybered-hero-identity \{\s*bottom: 1\.75rem;/)
  assert.match(css, /margin-top:\s*-1\.25rem/)
})

test('image framing helpers are not rewritten here', () => {
  assert.match(css, /getCyberedSurfacePhotoStyle/)
  assert.doesNotMatch(css, /resolveArtistImageFit/)
})

console.log(`\ncybered-desktop-surfaces: ${passed} tests passed`)
