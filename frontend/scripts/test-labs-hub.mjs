/**
 * Labs experience hub catalog contracts.
 * Run: node scripts/test-labs-hub.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { labsHubSections } from '../config/labsExperienceHub.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const index = fs.readFileSync(path.join(root, 'pages/labs/index.vue'), 'utf8')
const shell = fs.readFileSync(path.join(root, 'components/labs/LabsShell.vue'), 'utf8')
const hub = fs.readFileSync(path.join(root, 'components/labs/LabsExperienceHub.vue'), 'utf8')

assert.match(index, /LabsExperienceHub/)
assert.match(shell, /to="\/labs"/)
assert.match(shell, /to="\/labs\/gallery-experience"/)
assert.match(shell, /to="\/labs\/relationship"/)
assert.match(shell, /to="\/labs\/passport"/)

const names = labsHubSections.flatMap((section) => section.items.map((item) => item.name))
assert.deepEqual(
  names.includes('Elite Gallery') && names.includes('Night Story')
    && names.includes('Living Gallery')
    && names.includes('Night Recordings')
    && names.includes('Share Photos From Tonight') && names.includes('DM Media')
    && names.includes('Artist × Fan') && names.includes('Passport'),
  true,
)

const living = labsHubSections
  .flatMap((section) => section.items)
  .find((item) => item.name === 'Living Gallery')
assert.equal(living.status, 'lab')
assert.ok(living.actions.some((row) => row.to === '/labs/gallery-experience'))
assert.ok(living.actions.some((row) => row.to === '/__dev/gallery-experience'))

const passport = labsHubSections
  .flatMap((section) => section.items)
  .find((item) => item.name === 'Passport')
assert.equal(passport.status, 'ready')
assert.match(passport.statusLabel, /Relationship journal/)
assert.ok(passport.actions.some((row) => row.to === '/fan/passport'))

const share = labsHubSections
  .flatMap((section) => section.items)
  .find((item) => item.name === 'Share Photos From Tonight')
const shareTos = share.actions.map((row) => row.to)
assert.ok(shareTos.includes('/labs/share-photos-lab'))
assert.ok(shareTos.includes('/labs/share-photos'))

assert.match(hub, /Local visual fixtures/)
assert.doesNotMatch(hub, /stamp book/)
assert.doesNotMatch(index, /IntelligenceEngine/)

console.log('test-labs-hub: ok')
