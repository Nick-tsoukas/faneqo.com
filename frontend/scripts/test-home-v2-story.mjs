/**
 * Home V2 Act 3 Phase 1 — story data, motion, no nested scroll.
 * Run: node scripts/test-home-v2-story.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HOME_V2_STORY_CHAPTERS, HOME_V2_STORY_DEMO } from '../utils/home-v2/relationshipStoryData.js'
import { HOME_V2_STORY_MOTION } from '../utils/home-v2/relationshipStoryMotion.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function read(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

assert.deepEqual(HOME_V2_STORY_CHAPTERS, ['CHECK IN', 'KEEP', 'REACH', 'TALK', 'REMEMBER'])
assert.equal(HOME_V2_STORY_DEMO.artist.name, 'BADFLOWER')
assert.equal(HOME_V2_STORY_DEMO.artist.city, 'Nashville')
assert.equal(HOME_V2_STORY_DEMO.artist.hereLine, 'You’re here.')
assert.equal(HOME_V2_STORY_DEMO.fan.initials, 'SM')
assert.equal(HOME_V2_STORY_DEMO.fan.name, 'Sarah M.')
assert.equal(HOME_V2_STORY_DEMO.fanCountBefore, 128)
assert.equal(HOME_V2_STORY_DEMO.fanCountAfter, 129)
assert.equal(HOME_V2_STORY_DEMO.neighbors.length, 3)

for (const key of [
  'relationshipPinDistance',
  'relationshipScrub',
  'storyScrollDistance',
  'storyScrub',
  'checkinPress',
  'checkinResolve',
  'checkinDuration',
  'checkinHold',
  'identityReveal',
  'identityHold',
  'sarahTransferDuration',
  'sarahMoveDuration',
  'fanListEstablish',
  'countTransition',
  'fanCountDuration',
  'rowAccentHold',
  'finalHold',
  'settleHold',
  'signalDuration',
]) {
  assert.equal(typeof HOME_V2_STORY_MOTION[key], 'number', key)
}

assert.equal(HOME_V2_STORY_MOTION.relationshipPinDistance, HOME_V2_STORY_MOTION.storyScrollDistance)
assert.equal(HOME_V2_STORY_MOTION.sarahTransferDuration, HOME_V2_STORY_MOTION.sarahMoveDuration)
assert.equal(typeof HOME_V2_STORY_MOTION.storyScrollVh, 'number')
assert.ok(HOME_V2_STORY_MOTION.storyScrollVh >= 2)
assert.ok(HOME_V2_STORY_MOTION.storyScrollVh <= 4)

const storyEngine = read('composables/home-v2/useHomeV2RelationshipStory.js')
assert.match(storyEngine, /storyScrollVh/)
assert.match(storyEngine, /trigger: pin \? pinEl : root/)
assert.match(storyEngine, /HOME_V2_STORY_REFRESH_PRIORITY/)
assert.doesNotMatch(storyEngine, /ScrollTrigger\.getAll\(\)/)

const storyFiles = [
  'components/home-v2/HomeV2RelationshipStory.vue',
  'components/home-v2/HomeV2StoryShowMode.vue',
  'components/home-v2/HomeV2StoryFanList.vue',
  'components/home-v2/HomeV2StorySarahIdentity.vue',
  'components/home-v2/HomeV2StorySignal.vue',
  'composables/home-v2/useHomeV2RelationshipStory.js',
]

for (const file of storyFiles) {
  const src = read(file)
  assert.doesNotMatch(
    src,
    /overflow-y\s*:\s*(auto|scroll)/,
    `${file} must not capture vertical scrolling`
  )
}

const story = read('components/home-v2/HomeV2RelationshipStory.vue')
assert.match(story, /One check-in can become a fan you actually know/)
assert.match(story, /She’s not a scan/)
assert.doesNotMatch(story, /A fan checks in\. Faneqo keeps the connection going/)

const list = read('components/home-v2/HomeV2StoryFanList.vue')
assert.match(list, /fq-email-count-anchor/)
assert.match(list, /All fans/)

const engine = read('composables/home-v2/useHomeV2RelationshipStory.js')
assert.match(engine, /addLabel\('arrival'\)/)
assert.match(engine, /addLabel\('identity'\)/)
assert.match(engine, /addLabel\('transfer'\)/)
assert.match(engine, /addLabel\('keep'\)/)
assert.match(engine, /addLabel\('hold'\)/)

const page = read('pages/index.vue')
assert.doesNotMatch(page, /HomeV2RelationshipStory|useHomeV2RelationshipStory/)

const hero = read('components/home-v2/HomeV2Hero.vue')
const hq = read('components/home-v2/product-theater/HomeV2ProductTheater.vue')
assert.match(hero, /Bands don't need/)
assert.match(hq, /headquarters/)

console.log('home-v2 relationship story demo/motion ok')
