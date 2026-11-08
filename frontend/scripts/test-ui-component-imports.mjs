/**
 * Nuxt registers components/ui/Foo.vue as <UiFoo>. Using <Foo> without an
 * import renders an unknown tag and nothing works (the featured video and
 * track fields once did this with an Add button, since removed).
 * Run: node scripts/test-ui-component-imports.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const uiNames = fs.readdirSync(path.join(root, 'components/ui'))
  .filter((f) => f.endsWith('.vue'))
  .map((f) => f.replace(/\.vue$/, ''))

function vueFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : vueFiles(p)
    return e.name.endsWith('.vue') ? [p] : []
  })
}

const offenders = []
for (const dir of ['components', 'pages', 'layouts', 'features']) {
  const abs = path.join(root, dir)
  if (!fs.existsSync(abs)) continue
  for (const file of vueFiles(abs)) {
    const src = fs.readFileSync(file, 'utf8')
    for (const name of uiNames) {
      if (!new RegExp(`<${name}[\\s/>]`).test(src)) continue
      if (new RegExp(`import\\s+${name}\\s+from\\s+['"][^'"]*components/ui/${name}\\.vue['"]`).test(src)) continue
      offenders.push(`${path.relative(root, file)} uses <${name}> without importing it`)
    }
  }
}
assert.deepEqual(offenders, [], offenders.join('\n'))
console.log(`  ok  every unprefixed components/ui tag is imported (${uiNames.join(', ')})`)

const video = fs.readFileSync(path.join(root, 'components/bands/ArtistFeaturedVideoFields.vue'), 'utf8')
const music = fs.readFileSync(path.join(root, 'components/bands/ArtistFeaturedMusicFields.vue'), 'utf8')
// Paste-and-done: no Add button; a pasted link is added automatically.
assert.doesNotMatch(video + music, /FaneqoFormCta|idle-label="Add/)
for (const rel of ['pages/createband.vue', 'pages/editband/[id].vue']) {
  const page = fs.readFileSync(path.join(root, rel), 'utf8')
  assert.match(page, /watch\(singlevideoYoutubeUrl,[\s\S]{0,300}if \(extractYoutubeId\(url\)\) addFeaturedVideo\(\);/, `${rel} adds a pasted video`)
  assert.match(page, /watch\(spotifyUrlInput,[\s\S]{0,900}fetchSpotifyOembed\(\)/, `${rel} adds a pasted track`)
}
console.log('  ok  featured track and video are added on paste, no Add button')
console.log('\n2 passed')
