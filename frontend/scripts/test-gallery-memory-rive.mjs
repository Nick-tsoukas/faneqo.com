import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const motion = read('components/rive/FaneqoGalleryMemoryMotion.vue')
const contract = read('utils/rive/faneqoGalleryMemory.js')
const driver = read('composables/useFaneqoGalleryMemory.js')
const story = read('components/updates/ShowNightStory.vue')

assert.match(motion, /FaneqoRive/)
assert.match(motion, /probeFaneqoGalleryMemoryAsset/)
assert.match(motion, /prefers-reduced-motion/)
assert.match(motion, /v-if="!available"/)
assert.doesNotMatch(motion, /useFanPassport|FaneqoMediaGrid|FaneqoMediaLightbox/)

assert.match(contract, /faneqo-gallery-memory\.riv/)
assert.match(contract, /method: 'HEAD'/)
assert.match(contract, /photoCount: 'photoCount'/)
assert.match(contract, /saved: 'saved'/)
assert.match(contract, /save: 'save'/)

assert.match(driver, /setString/)
assert.match(driver, /setNumber/)
assert.match(driver, /setBoolean/)
assert.match(driver, /fireTrigger/)
assert.doesNotMatch(driver, /\$fetch|localStorage|useFanPassport/)

assert.match(story, /FaneqoGalleryMemoryMotion/)
assert.match(story, /:saved="saved"/)
assert.match(story, /resolvedPhotoCount/)
assert.match(story, /emit\(saved \? 'remove' : 'save'/)

console.log('test-gallery-memory-rive: ok')
