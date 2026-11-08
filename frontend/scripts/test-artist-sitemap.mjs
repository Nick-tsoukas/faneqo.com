/**
 * Artist sitemap (B14): artist, radio and editorial profiles are listed with
 * no content minimum and no payment requirement; only URLs that really
 * render that artist are included.
 * Run: node scripts/test-artist-sitemap.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { artistSitemapUrls, reservedTopLevelPaths } from '../utils/seo/artistSitemap.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

test('every listed band becomes /<slug>, with lastmod when known', () => {
  const urls = artistSitemapUrls([
    { slug: 'emerge', updatedAt: '2026-07-31T00:00:00Z' },
    { slug: '939waby', updatedAt: null },
    { slug: '方樹樑好人有限' },
  ])
  assert.deepEqual(urls, [
    { loc: '/emerge', changefreq: 'weekly', priority: 0.7, lastmod: '2026-07-31T00:00:00Z' },
    { loc: '/939waby', changefreq: 'weekly', priority: 0.7 },
    { loc: '/方樹樑好人有限', changefreq: 'weekly', priority: 0.7 },
  ])
})

test('a slug shadowed by an app route, or a redirect source, is left out', () => {
  const reserved = reservedTopLevelPaths(['dashboard', 'article', 'signupSuccess.vue', 'index.vue', '[bandSlug]'])
  assert.ok(reserved.has('signupsuccess') && !reserved.has('[bandslug]'))
  const urls = artistSitemapUrls(
    [{ slug: 'dashboard' }, { slug: 'Article' }, { slug: 'old-name' }, { slug: 'real-band' }],
    { reserved, redirected: new Set(['/old-name']) },
  )
  assert.deepEqual(urls.map((u) => u.loc), ['/real-band'])
})

test('malformed or duplicate slugs never produce a URL', () => {
  const urls = artistSitemapUrls([{ slug: '' }, { slug: 'a b' }, { slug: 'a/b' }, { slug: null }, { slug: 'x' }, { slug: 'X' }])
  assert.deepEqual(urls.map((u) => u.loc), ['/x'])
})

test('the real pages/ directory reserves the app routes', () => {
  const reserved = reservedTopLevelPaths(fs.readdirSync(path.join(root, 'pages')))
  for (const name of ['dashboard', 'article', 'createband', 'editband', 'login', 'signup']) assert.ok(reserved.has(name), name)
})

test('sitemap reads artists at request time; eligibility ignores payments and content', () => {
  const config = read('nuxt.config.ts')
  assert.match(config, /sources: \['\/api\/sitemap\/artists'\]/)
  assert.match(config, /sitemapReservedPaths: \[\.\.\.reservedTopLevelPaths\(readdirSync\('\.\/pages'\)\)\]/)
  const route = read('server/api/sitemap/artists.get.ts')
  assert.match(route, /\/api\/bands\/sitemap`/)
  assert.match(route, /defineCachedEventHandler/)
  assert.match(route, /validate: \(entry\) => Array\.isArray\(entry\.value\) && entry\.value\.length > 0/, 'outages are not cached')
  assert.match(route, /return \[\]/, 'an outage keeps the sitemap valid')
  const helper = read('utils/seo/artistSitemap.js')
  assert.doesNotMatch(helper + route, /payments|stripe|singlesong|singlevideo|songs|videos/i)
})

console.log(`\n${passed} passed`)
