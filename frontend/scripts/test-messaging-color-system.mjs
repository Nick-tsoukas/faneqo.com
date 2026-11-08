/**
 * Messaging color system (M1.2).
 * Run: node scripts/test-messaging-color-system.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

function compileSfc(rel) {
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [], `${rel} parse errors`)
  if (descriptor.script || descriptor.scriptSetup) {
    const script = compileScript(descriptor, { id: rel, filename: rel })
    assert.ok(script.content, `${rel} script compiled`)
  }
  if (descriptor.template) {
    const template = compileTemplate({
      source: descriptor.template.content,
      filename: rel,
      id: rel,
    })
    assert.deepEqual(template.errors, [], `${rel} template compile errors`)
  }
}

const messagingSurfaces = [
  'components/messages/FaneqoChatEngine.client.vue',
  'components/messages/FaneqoMessageComposer.vue',
  'components/messages/FaneqoMessageStatus.vue',
  'components/messages/FaneqoNewMessagesPill.vue',
  'components/messages/FaneqoFirstThread.vue',
  'components/messages/FanMessagesHome.vue',
  'components/messages/MessagesHome.vue',
  'components/messages/MessagesInboxEmpty.vue',
  'components/messages/MessagesReachPanel.vue',
  'components/messages/MessagesTabCta.vue',
  'components/messages/InboxFanSelector.vue',
  'components/band/FanMessageRequestSheet.vue',
  'components/messages/MessagesAudienceActions.vue',
  'components/messages/FaneqoChat.vue',
  'components/messages/MessagesCampaignsPanel.vue',
  'components/messages/FaneqoSentDetail.vue',
]

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('touched messaging color SFCs compile', () => {
  for (const rel of messagingSurfaces) compileSfc(rel)
  compileSfc('components/messages/FaneqoFanIdentity.vue')
  compileSfc('components/messages/FanMobileBottomNav.vue')
})

test('Try again uses mint, not lime', () => {
  const engine = read('components/messages/FaneqoChatEngine.client.vue')
  assert.match(engine, /\.fq-state__btn \{[\s\S]*?#45E3AE/)
  assert.match(engine, /\.fq-state__btn:hover \{[\s\S]*?#7BF1CA/)
  assert.match(engine, /\.fq-state__btn:focus-visible \{[\s\S]*?#39D5FF/)
  assert.doesNotMatch(engine, /\.fq-state__btn \{[\s\S]*?#39ff14/)
})

test('selected conversation uses a quiet edge, not lime', () => {
  const engine = read('components/messages/FaneqoChatEngine.client.vue')
  const active = engine.match(/\.fq-row\.is-active \{[^}]+\}/)?.[0] || ''
  assert.match(active, /rgba\(245, 245, 246, 0\.78\)/)
  assert.doesNotMatch(active, /#39ff14/)
  assert.doesNotMatch(active, /#39D5FF/)
})

test('production messaging surfaces dropped lime hex', () => {
  for (const rel of messagingSurfaces) {
    const src = read(rel)
    assert.doesNotMatch(src, /#39ff14/i, `${rel} still has lime`)
    assert.doesNotMatch(src, /rgba\(57,\s*255,\s*20/, `${rel} still has lime rgba`)
  }
})

test('homepage messaging showcase references stay put', () => {
  const home = read('components/home/HomeMessagingShowcaseSection.vue')
  assert.match(home, /from-\[#4CA6FF\]/)
  assert.match(home, /via-\[#39D5FF\]/)
  assert.match(home, /to-\[#45E3AE\]/)
})

test('fan mobile bottom nav uses cyan, not lime', () => {
  const nav = read('components/messages/FanMobileBottomNav.vue')
  assert.match(nav, /\.fq-fan-nav__item\.is-active \{[\s\S]*?#39D5FF/)
  assert.match(nav, /rgba\(57, 213, 255, 0\.75\)/)
  assert.doesNotMatch(nav, /#39ff14/i)
  assert.doesNotMatch(nav, /rgba\(57,\s*255,\s*20/)
  assert.doesNotMatch(nav, /--fq-green/)
})

test('local messaging tokens exist', () => {
  const tokens = read('assets/css/faneqo-messaging-accents.css')
  assert.match(tokens, /--fq-accent-blue:\s*#4CA6FF/)
  assert.match(tokens, /--fq-accent-cyan:\s*#39D5FF/)
  assert.match(tokens, /--fq-accent-mint:\s*#45E3AE/)
  assert.match(tokens, /--fq-accent-mint-hover:\s*#7BF1CA/)
})

console.log(`\n=== messaging color system: ${passed} passed ===`)
