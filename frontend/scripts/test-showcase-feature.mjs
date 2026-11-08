import assert from 'node:assert/strict'
import { homepageDemoConfig } from '../config/homepageDemo.js'
import {
  SHOWCASE_PRINTS,
  cropImageStyle,
  exploreArtistLabel,
  showcasePrint,
} from '../utils/home/showcaseFeature.js'

assert.deepEqual(
  homepageDemoConfig.featuredShowcaseSlugs,
  ['shannontehya', 'moondough', 'emerge'],
  'Shannon Tehya is first, then Moon Dough, then Emerge'
)

assert.equal(exploreArtistLabel('Shannon Tehya'), 'Explore Shannon’s page')
assert.equal(exploreArtistLabel('Moon Dough'), 'Explore Moon Dough’s page')
assert.equal(exploreArtistLabel('Emerge'), 'Explore Emerge’s page')

const shannon = showcasePrint('shannontehya')
assert.equal(shannon.fit, 'cover')
assert.equal(shannon.ratio, '4 / 5')
assert.equal(shannon.position, '58% 22%')
assert.equal(shannon.mobilePosition, '50% 12%')

const moon = showcasePrint('moondough')
assert.equal(moon.fit, 'cover')
assert.equal(moon.ratio, '3 / 2')
assert.match(moon.position, /^64%/)

const emerge = SHOWCASE_PRINTS.emerge
assert.equal(emerge.fit, 'rect')
assert.ok(emerge.crop.y + emerge.crop.h <= 0.41, 'Emerge cover stays above the burned-in wordmark')
assert.ok(emerge.avatarCrop.y + emerge.avatarCrop.h <= 0.41)

const placed = cropImageStyle(emerge.crop)
assert.ok(placed)
assert.match(placed.width, /%$/)
assert.ok(Number.parseFloat(placed.left) < 0)
assert.ok(Number.parseFloat(placed.top) < 0)

console.log('showcase feature presentation ok')
