/**
 * ART-2: the legacy articles are retired. /article, /article/**, /discover and
 * the old public /seo dashboard answer 410 Gone with noindex; nothing in the
 * build or sitemap depends on Strapi seo-pages; artist pages, /corvana/seo and
 * the artist sitemap are untouched.
 * Run: node scripts/test-retired-articles.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isRetiredArticlePath, RETIRED_TOP_LEVEL_PATHS, RETIRED_ARTICLE_HTML } from '../utils/seo/retiredArticles.js'
import { artistSitemapUrls, reservedTopLevelPaths } from '../utils/seo/artistSitemap.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(root, rel))
const archived = JSON.parse(read('scripts/fixtures/retired-article-urls.json')).paths

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

test('all 103 archived article and category URLs are retired', () => {
  assert.equal(archived.length, 103)
  for (const p of archived) assert.equal(isRetiredArticlePath(p), true, p)
})

test('variants are retired too: trailing slash, case, double slash, encoding, historic redirects, null category', () => {
  for (const p of [
    '/article', '/article/', '/ARTICLE/Smart-Links/', '//article//smart-links',
    '/article/touring-events/qr-codes--music-tour-promotion',
    '/article/smart-links/smart-links', '/article/null/how-to-promote-your-band',
    '/%61rticle/smart-links', '/discover', '/discover/', '/seo', '/seo/', '/SEO',
  ]) {
    assert.equal(isRetiredArticlePath(p), true, p)
  }
})

test('nothing else is intercepted: artists, app routes, look-alikes, /corvana/seo, the API', () => {
  for (const p of [
    '/', '/emerge', '/939waby', '/937wvlz', '/articles', '/article-guide', '/discovery', '/seo-tools', '/seobands',
    '/corvana/seo', '/corvana/seo/', '/api/corvana/seo/report/cluster-health', '/api/sitemap/artists', '/sitemap.xml',
    '/dashboard', '/editband/9', '/login', '/signup', '/account', '/termsofservice', '/privacypolicy',
    '/fan/passport', '/galleries', '/events', '/band/article', '/x/article', '%E0%A4%A',
  ]) {
    assert.equal(isRetiredArticlePath(p), false, p)
  }
})

test('the 410 page: noindex, says what happened, links home, North Star button, readable on mobile', () => {
  assert.match(RETIRED_ARTICLE_HTML, /<meta name="robots" content="noindex">/)
  assert.match(RETIRED_ARTICLE_HTML, /<meta name="viewport" content="width=device-width, initial-scale=1">/)
  assert.match(RETIRED_ARTICLE_HTML, /This page is no longer available/)
  assert.match(RETIRED_ARTICLE_HTML, /<a href="\/">Go to Faneqo<\/a>/)
  assert.match(RETIRED_ARTICLE_HTML, /background: #f5f5f6; color: #050505/, 'near-white primary action')
  assert.doesNotMatch(RETIRED_ARTICLE_HTML, /gradient|#7c3aed/i)
  assert.match(RETIRED_ARTICLE_HTML, /min-height: 48px/, 'tap target')
})

test('middleware: 410 Gone + noindex, and it runs before the renderer and after domain migration', () => {
  const mw = read('server/middleware/retired-articles.ts')
  assert.match(mw, /if \(!isRetiredArticlePath\(getRequestURL\(event\)\.pathname\)\) return/)
  assert.match(mw, /setResponseStatus\(event, 410, 'Gone'\)/)
  assert.match(mw, /setResponseHeader\(event, 'X-Robots-Tag', 'noindex'\)/)
  assert.match(mw, /return RETIRED_ARTICLE_HTML/)
  // Nitro runs server middleware in file-name order.
  const order = fs.readdirSync(path.join(root, 'server/middleware')).sort()
  assert.ok(order.indexOf('domain-migration.ts') < order.indexOf('retired-articles.ts'), 'old domain → faneqo.com first, then 410')
  // Nothing earlier may redirect or answer an article path.
  for (const f of order.slice(0, order.indexOf('retired-articles.ts'))) {
    assert.doesNotMatch(read(`server/middleware/${f}`), /\/article|\/discover|'\/seo'/, `${f} must not touch retired paths`)
  }
})

test('article pages, list page, /seo dashboard, article middleware and verify-redirects are gone', () => {
  for (const rel of [
    'pages/article', 'pages/discover.vue', 'pages/seo.vue', 'utils/seo.ts',
    'server/middleware/redirects.ts', 'server/middleware/seo-redirects.ts', 'server/api/seo/verify-redirects.get.ts',
  ]) {
    assert.equal(exists(rel), false, rel)
  }
})

test('no route rule or config redirect can send a retired URL anywhere', () => {
  const config = read('nuxt.config.ts')
  assert.doesNotMatch(config, /['"`]\/article/, 'no /article route rules, redirects or sitemap entries')
  assert.doesNotMatch(config, /['"`]\/discover|['"`]\/seo['"`]/)
})

test('build and sitemap make no CMS article request; the sitemap is static pages plus artists', () => {
  const config = read('nuxt.config.ts')
  assert.doesNotMatch(config, /seo-pages/)
  assert.doesNotMatch(config, /['"]nitro:config['"]/)
  assert.doesNotMatch(config, /prerender\.routes/)
  assert.match(config, /urls: \[\s*\{ loc: '\/', changefreq: 'daily', priority: 1\.0 \},\s*\{ loc: '\/contact'/)
  assert.match(config, /sources: \['\/api\/sitemap\/artists'\]/)
})

test('reserved slugs: article, discover and seo are never listed as artist pages', () => {
  assert.deepEqual(RETIRED_TOP_LEVEL_PATHS, ['article', 'discover', 'seo'])
  const config = read('nuxt.config.ts')
  assert.match(config, /sitemapReservedPaths: \[\.\.\.reservedTopLevelPaths\(readdirSync\('\.\/pages'\)\), \.\.\.RETIRED_TOP_LEVEL_PATHS\]/)
  const reserved = new Set([...reservedTopLevelPaths(fs.readdirSync(path.join(root, 'pages'))), ...RETIRED_TOP_LEVEL_PATHS])
  const urls = artistSitemapUrls([{ slug: 'Article' }, { slug: 'discover' }, { slug: 'SEO' }, { slug: 'dashboard' }, { slug: 'real-band' }], { reserved })
  assert.deepEqual(urls.map((u) => u.loc), ['/real-band'])
})

test('kept: artist sitemap route, its redirect map, /corvana/seo and its authenticated APIs, domain migration, noindex', () => {
  const route = read('server/api/sitemap/artists.get.ts')
  assert.match(route, /import \{ getRedirectedUrls \} from '\.\.\/\.\.\/utils\/seoRedirects'/)
  assert.match(route, /reserved: new Set<string>\(config\.sitemapReservedPaths \|\| \[\]\)/)
  for (const rel of ['server/utils/seoRedirects.ts', 'pages/corvana/seo.vue', 'server/api/corvana/seo/articles/inventory.get.ts', 'server/middleware/domain-migration.ts', 'server/middleware/seo-noindex.ts']) {
    assert.ok(exists(rel), `${rel} kept`)
  }
})

test('no remaining links to retired pages', () => {
  const offenders = []
  const walk = (dir) => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`
      if (e.isDirectory()) { if (!['oldpages'].includes(e.name)) walk(rel); continue }
      if (!/\.(vue|js|ts)$/.test(e.name)) continue
      const src = read(rel)
      if (/(to|href)=["']\/(article|discover|seo)(\/|["'])/.test(src)) offenders.push(rel)
    }
  }
  for (const d of ['components', 'pages', 'layouts']) walk(d)
  assert.deepEqual(offenders, [])
})

console.log(`\n=== retired articles: ${passed} passed ===`)
