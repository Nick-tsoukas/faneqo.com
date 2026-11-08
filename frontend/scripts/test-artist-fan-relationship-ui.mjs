/**
 * Production Artist × Fan UI contracts.
 * Run: node scripts/test-artist-fan-relationship-ui.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const api = read('composables/useArtistFanRelationship.js')
const page = read('pages/dashboard/fans/[fanId].vue')
const messages = read('components/messages/MessagesHome.vue')
const story = read('components/relationship/FaneqoRelationshipStory.vue')
const labsWrapper = read('components/labs/LabsRelationshipStory.vue')

assert.match(api, /\/api\/artist-fan-relationships\/\$\{fid\}/)
assert.match(api, /Authorization: `Bearer \$\{token\.value\}`/)
assert.doesNotMatch(api, /\/api\/labs\/relationship/)

assert.match(page, /middleware: 'auth'/)
assert.match(page, /noindex, nofollow/)
assert.match(page, /FaneqoRelationshipStory/)
assert.match(page, /Relationship unavailable/)
assert.match(page, /loadGeneration/)

assert.match(messages, /:show-view-fan="Boolean\(selectedFanId\)"/)
assert.match(messages, /path: `\/dashboard\/fans\/\$\{fanId\}`/)
assert.match(messages, /bandId: String\(bandId\.value\)/)
assert.match(messages, /from: 'messages'/)
assert.doesNotMatch(messages, /navigateTo\('\/dashboard#fan-intelligence'\)/)

assert.match(story, /The first night is still ahead/)
assert.match(story, /FaneqoMediaGrid/)
assert.match(labsWrapper, /components\/relationship\/FaneqoRelationshipStory\.vue/)
assert.match(page, /useArtistFanRelationship/)
assert.doesNotMatch(page, /LabsRelationshipStory/)

console.log('test-artist-fan-relationship-ui: ok')
