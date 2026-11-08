/**
 * PWA updates stay silent. The worker still replaces itself, and an open
 * page is not reloaded until the next navigation.
 * Run: node scripts/test-pwa-update-quiet.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  claimServiceWorkerReload,
  isSensitiveUpdatePath,
  isStaleAssetError,
  shouldFullLoadUpdatedApp,
} from '../utils/pwa/applyUpdate.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const config = read('nuxt.config.ts')
assert.match(config, /registerType:\s*'prompt'/)
assert.match(config, /skipWaiting:\s*true/)
assert.match(config, /clientsClaim:\s*true/)
assert.doesNotMatch(config, /registerType:\s*'autoUpdate'/)

for (const layout of ['layouts/default.vue', 'layouts/auth.vue']) {
  const source = read(layout)
  assert.doesNotMatch(source, /PwaUpdateToast/)
  assert.doesNotMatch(source, /PwaDownloadIndicator/)
  assert.match(source, /NetworkStatus/)
}

assert.equal(fs.existsSync(path.join(root, 'components/PwaUpdateToast.vue')), false)
assert.equal(fs.existsSync(path.join(root, 'components/PwaDownloadIndicator.vue')), false)

const pwa = read('composables/usePwa.js')
assert.match(pwa, /updatePending/)
assert.match(pwa, /shouldFullLoadUpdatedApp/)
assert.doesNotMatch(pwa, /needsRefresh/)
assert.doesNotMatch(pwa, /MBQ just improved/)

assert.equal(isSensitiveUpdatePath('/checkout'), true)
assert.equal(isSensitiveUpdatePath('/checkout/band'), true)
assert.equal(isSensitiveUpdatePath('/account/billing'), true)
assert.equal(isSensitiveUpdatePath('/stripe/return'), true)
assert.equal(isSensitiveUpdatePath('/leslie/support/receipt'), true)
assert.equal(isSensitiveUpdatePath('/leslie'), false)
assert.equal(isSensitiveUpdatePath('/dashboard'), false)

assert.equal(shouldFullLoadUpdatedApp({ fromPath: '/leslie', toPath: '/leslie' }), false)
assert.equal(shouldFullLoadUpdatedApp({ fromPath: '/checkout', toPath: '/leslie' }), false)
assert.equal(shouldFullLoadUpdatedApp({ fromPath: '/leslie', toPath: '/galleries' }), true)

assert.equal(isStaleAssetError(new Error('Failed to fetch dynamically imported module: /_nuxt/a.js')), true)
assert.equal(isStaleAssetError('Importing a module script failed.'), true)
assert.equal(isStaleAssetError(new Error('Failed to fetch')), false)
assert.equal(isStaleAssetError(new Error('NetworkError when attempting to fetch resource.')), false)

const memory = new Map()
const storage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => memory.set(key, String(value)),
}
assert.equal(claimServiceWorkerReload(storage, 1_000), true)
assert.equal(claimServiceWorkerReload(storage, 2_000), false)
assert.equal(claimServiceWorkerReload(storage, 61_001), true)

console.log('test-pwa-update-quiet: ok')
