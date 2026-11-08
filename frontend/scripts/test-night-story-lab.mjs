import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const story = fs.readFileSync(path.join(root, 'components/updates/ShowNightStory.vue'), 'utf8')
const fixtures = fs.readFileSync(path.join(root, 'config/nightStoryLab.js'), 'utf8')

assert.match(story, /FaneqoMediaGrid/)
assert.match(story, /variant="gallery"/)
assert.match(story, /FaneqoMediaLightbox/)
assert.doesNotMatch(story, /faneqoGalleryLayout/)
assert.match(story, /You were there/)
assert.match(story, /prefers-reduced-motion/)

assert.match(fixtures, /youWereThere: true/)
assert.match(fixtures, /nightStoryLabLocked/)
assert.match(fixtures, /media: \[\]/)
assert.match(fixtures, /lockReason: 'show_attendees'/)

console.log('test-night-story-lab: ok')
