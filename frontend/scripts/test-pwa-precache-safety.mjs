/**
 * Workbox must not precache leftover public test HTML, and must not
 * NetworkFirst the band analytics page.
 * Run: node scripts/test-pwa-precache-safety.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const config = fs.readFileSync(path.join(root, 'nuxt.config.ts'), 'utf8')

assert.match(config, /globIgnores/)
assert.match(config, /test-\*\.html/)
assert.match(config, /navigateFallback: ''/)
assert.match(config, /\\\/analytics/)
assert.match(config, /\\\/event-analytics/)
assert.match(config, /updates\|analytics\|event-analytics/)

console.log('test-pwa-precache-safety: ok')
