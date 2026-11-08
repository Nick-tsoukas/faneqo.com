/**
 * Editorial showcase fallbacks use the profile's own publication name.
 * Saved titles always win. No publication name is ever hardcoded.
 * Run: node scripts/test-editorial-defaults.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { editorialDefaults, resolveEditorialShowcase } from '../utils/editorialShowcase.js'
import { getPublicationShortName } from '../utils/publicationProfile.js'

const items = [{ title: 'Interview', url: 'https://example.com/a', contentType: 'interview' }]

assert.deepEqual(editorialDefaults('Northern Static'), {
  sectionTitle: 'Latest from Northern Static',
  archiveLabel: 'Explore Northern Static',
})
assert.deepEqual(editorialDefaults(''), { sectionTitle: 'Latest stories', archiveLabel: 'Explore the archive' })

const fallback = resolveEditorialShowcase(items, true, '', 'https://example.com', '', '', 'KXRT 98.1')
assert.equal(fallback.sectionTitle, 'Latest from KXRT 98.1')
assert.equal(fallback.archiveLabel, 'Explore KXRT 98.1')

// A saved Rock DNA title is untouched.
const saved = resolveEditorialShowcase(items, true, 'Latest from Rock DNA', '', 'Explore Rock DNA Magazine', '', 'Anything')
assert.equal(saved.sectionTitle, 'Latest from Rock DNA')
assert.equal(saved.archiveLabel, 'Explore Rock DNA Magazine')

assert.equal(getPublicationShortName({ editorialSectionTitle: 'Latest from Rock DNA' }), 'Rock DNA')

const source = fs.readFileSync(new URL('../utils/editorialShowcase.js', import.meta.url), 'utf8')
assert.doesNotMatch(source, /Rock DNA/i, 'no publication name hardcoded in the fallback')
assert.match(
  fs.readFileSync(new URL('../components/editorial/EditorialShowcase.vue', import.meta.url), 'utf8'),
  /getPublicationShortName\(props\.band\) \|\| props\.band\.name/,
)

console.log('test-editorial-defaults: ok')
