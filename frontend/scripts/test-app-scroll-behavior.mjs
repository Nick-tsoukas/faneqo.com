import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveAppScrollPosition } from '../utils/ui/appScrollBehavior.js'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))

function test(name, fn) {
  fn()
  console.log(`ok ${name}`)
}

const artist = { path: '/faneqo-test-band', hash: '', matched: [{ path: '/:bandSlug()' }] }
const emptyFrom = { path: '/', hash: '', matched: [] }
const home = { path: '/', hash: '', matched: [{ path: '/' }] }

test('query-only replace on the artist page does not reset scroll', () => {
  assert.equal(
    resolveAppScrollPosition(
      { ...artist, hash: '' },
      artist,
      null,
      0,
    ),
    false,
  )
})

test('first hydration does not animate the page to top', () => {
  assert.equal(resolveAppScrollPosition(artist, emptyFrom, null, 0), false)
})

test('real client navigation still jumps to top instantly', () => {
  assert.deepEqual(resolveAppScrollPosition(artist, home, null, 0), { top: 0 })
})

test('hash, archive memory, and back/forward still win', () => {
  assert.deepEqual(
    resolveAppScrollPosition({ ...artist, hash: '#support' }, home, null, 0),
    { el: '#support', behavior: 'smooth', top: 90 },
  )
  assert.deepEqual(
    resolveAppScrollPosition({ path: '/galleries', hash: '', matched: [] }, home, null, 420),
    { left: 0, top: 420 },
  )
  assert.deepEqual(
    resolveAppScrollPosition(artist, home, { left: 0, top: 800 }, 0),
    { left: 0, top: 800 },
  )
})

test('router.options delegates to the shared decision', () => {
  const router = readFileSync(resolve(root, 'app/router.options.ts'), 'utf8')
  assert.match(router, /resolveAppScrollPosition/)
  assert.match(router, /recalledArchiveScroll/)
  assert.match(router, /isGalleryArchivePath/)
  assert.doesNotMatch(router, /behavior: 'smooth'/)
})

test('router.options scrolls the element that really scrolls, after the page renders', () => {
  // `<body>` is the scroll container on most routes; `window.scrollTo` is a
  // no-op there, so the router has to apply the position itself.
  const router = readFileSync(resolve(root, 'app/router.options.ts'), 'utf8')
  assert.match(router, /import \{ pageScrollElement, setPageScrollTop \} from '\.\.\/utils\/ui\/pageScroll'/)
  assert.match(router, /hookOnce\('page:finish'/)
  assert.match(router, /setPageScrollTop\(position\.top \|\| 0\)/)
  assert.match(router, /if \('el' in position\) return position/)
  assert.match(router, /if \(!position \|\| import\.meta\.server\) return position/)
})

test('create event scrolls the document, not the body', () => {
  const page = readFileSync(resolve(root, 'pages/newevent.vue'), 'utf8')
  assert.match(page, /class: 'fq-event-form-route'/)
  assert.match(page, /html\.fq-event-form-route body/)
  assert.match(page, /overflow-x: clip/)
  assert.match(page, /height: auto/)
  assert.doesNotMatch(page, /overflow:\s*hidden/)
})

test('artist page restores document scroll like the homepage', () => {
  const page = readFileSync(resolve(root, 'pages/[bandSlug]/index.vue'), 'utf8')
  assert.match(page, /class: 'fq-artist-route'/)
  assert.match(page, /html\.fq-artist-route body/)
  assert.match(page, /overflow-x: clip/)
  assert.match(page, /height: auto/)
})

console.log('app scroll behavior ok')
