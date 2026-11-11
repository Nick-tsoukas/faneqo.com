/**
 * Production gallery + campaign convergence contracts.
 * Run: node scripts/test-gallery-campaign-convergence-ui.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const galleryHome = read('pages/galleries/index.vue')
const galleryArchive = read('components/galleries/FaneqoGalleryArchive.vue')
const galleryShelves = read('utils/galleries/archiveShelves.js')
const galleryStudio = read('pages/galleries/new.vue')
const picker = read('components/messages/FaneqoGalleryPicker.vue')
const composePage = read('pages/messages/compose.vue')
const campaignComposer = read('components/dashboard/fans/FanCampaignComposer.vue')
const campaignState = read('composables/useCampaignComposer.js')
const artistUpdateComposer = read('components/updates/ArtistUpdateComposer.vue')
const showLaunch = read('components/dashboard/fans/ShowMessageComposer.vue')
const header = read('components/Header.vue')

// Band-aware since Multi-Band Workspace: carries ?bandId= when scoped.
assert.match(header, /:to="galleriesPath"/)
assert.match(header, /withActiveBand\('\/galleries', activeWorkspace\.value\)/)
assert.match(galleryArchive, /Create gallery/)
assert.match(galleryArchive, /Your Nights, in pictures/)
assert.match(galleryStudio, /Fan Passport/)
assert.match(galleryShelves, /galleryId: String\(item\.id\)/)
assert.match(galleryHome, /FaneqoGalleryArchive/)
assert.doesNotMatch(galleryHome, /#39ff14/i)
assert.doesNotMatch(galleryHome, /rgba\(57,\s*255,\s*20/)
assert.doesNotMatch(galleryStudio, /#39ff14/i)
assert.doesNotMatch(galleryStudio, /rgba\(57,\s*255,\s*20/)
assert.match(galleryStudio, /What is this gallery from\?/)
assert.match(galleryStudio, /Only a real Show Recap can create attendee-only access/)
assert.match(galleryStudio, /:show-recap-id="selectedRecap\?\.id \|\| null"/)
/* The publish reveal shows the return link; the page hands it the composer return path. */
assert.ok(galleryStudio.includes(`:return-path="returnWithGallery || ''"`), 'page hands the reveal the composer return path')
assert.ok(read('components/galleries/GalleryPublishReveal.vue').includes('<NuxtLink v-if="returnPath" :to="returnPath">Use in original message</NuxtLink>'), 'reveal shows the return link')
assert.match(galleryStudio, /buildGalleryComposerReturn/)
assert.match(picker, /buildComposerGalleryCreateQuery/)
assert.match(picker, /Upload new photos/)
assert.doesNotMatch([galleryHome, galleryStudio, picker].join('\n'), /\/updates\/new/)
assert.match(artistUpdateComposer, /Everyone/)
assert.match(artistUpdateComposer, /People who were there/)
assert.doesNotMatch(artistUpdateComposer, /Protected delivery is not ready yet/)

assert.match(composePage, /type: 'show_attendees'/)
assert.match(composePage, /reference: show\.campaignId \|\| null/)
assert.match(campaignComposer, /FaneqoGalleryPicker/)
assert.match(campaignComposer, /initialGalleryId/)
assert.match(campaignComposer, /:disabled="submitting \|\| !!selectedGallery"/)
assert.match(campaignState, /artistUpdateId/)
assert.match(campaignState, /hasGallery|Boolean\(artistUpdateId\.value\)/)
assert.match(showLaunch, /path: '\/messages\/compose'/)
assert.match(showLaunch, /audienceType: 'show_attendees'/)

console.log('test-gallery-campaign-convergence-ui: ok')
