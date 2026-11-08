/**
 * Relationship story presentation contracts. Copy is not persisted.
 * Run: node scripts/test-relationship-story.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { presentationForMilestone } from '../utils/milestones/milestonePresentation.js'
import { formatJoinedMonthYear } from '../utils/shows/formatShowNightDate.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const story = fs.readFileSync(path.join(root, 'components/relationship/FaneqoRelationshipStory.vue'), 'utf8')
const fixtures = fs.readFileSync(path.join(root, 'config/relationshipLab.js'), 'utf8')

assert.equal(presentationForMilestone('fan_artist.first_show').line, 'IT STARTED HERE.')
assert.equal(presentationForMilestone('fan_artist.second_show').line, 'YOU CAME BACK.')
assert.equal(presentationForMilestone('fan_artist.first_reply').line, 'YOU WROTE BACK.')
assert.equal(presentationForMilestone('fan_artist.second_show').tone, 'hero')
assert.equal(presentationForMilestone('fan_artist.first_show').tone, 'quiet')

assert.equal(formatJoinedMonthYear('2025-06-01T00:00:00.000Z'), 'June 2025')

assert.match(story, /The first night is still ahead/)
assert.doesNotMatch(story, /No nights recorded yet/)
assert.doesNotMatch(story, /THE CONVERSATION STARTED/)
assert.match(story, /formatJoinedMonthYear/)
assert.match(story, /replyWhen/)
assert.doesNotMatch(story, /sourceType/)
assert.doesNotMatch(story, /idempotencyKey/)
assert.doesNotMatch(story, /candidate/)

assert.match(fixtures, /key: 'five'/)
assert.doesNotMatch(fixtures, /type: 'fan_artist\.fifth_show'/)

const dev = fs.readFileSync(path.join(root, 'pages/__dev/relationship.vue'), 'utf8')
assert.match(dev, /import\.meta\.dev/)

console.log('test-relationship-story: ok')
