/**
 * YouTube connect/sync and Muse insights go through the authenticated Strapi
 * client. The backend now requires band access on these routes (qrserver
 * scripts/test-api-lockdown-2026-10.js), so a bare $fetch would get a 401.
 * Run: node scripts/test-authed-youtube-insights.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript } from '@vue/compiler-sfc'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

function scriptOf(rel) {
  const { descriptor, errors } = parse(read(rel), { filename: rel })
  assert.deepEqual(errors, [], `${rel} parse errors`)
  return compileScript(descriptor, { id: rel, filename: rel }).content
}

const FILES = {
  'pages/analytics/[id].vue': ['/youtube/sync', '/youtube/purge', '/youtube/oauth/init'],
  'pages/oauth/youtube/callback.vue': ['/youtube/oauth/callback', '/youtube/select-channel'],
  'components/analytics/InsightsPanel.vue': ['/muse/insights'],
}

for (const [rel, paths] of Object.entries(FILES)) {
  test(`${rel} compiles and calls ${paths.join(', ')} through the authenticated client`, () => {
    const src = scriptOf(rel)
    assert.ok(/useStrapiClient\(\)/.test(src), 'uses useStrapiClient')
    for (const p of paths) {
      assert.ok(new RegExp(`client\\(\\s*["'\`]${p.replace(/\//g, '\\/')}["'\`]`).test(src), `${p} via client()`)
    }
    assert.ok(!/\$fetch\([^)]*\/api\/(youtube|muse\/insights)/.test(src), 'no bare $fetch to protected routes')
  })
}

console.log(`\n${passed} passed`)
