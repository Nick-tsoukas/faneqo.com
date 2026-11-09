/**
 * Repo hygiene: generated artifacts and oversized binaries must not be tracked.
 * Railway snapshots the whole tracked tree and Nixpacks copies it into the image
 * three times, so 245 MB of tracked browser profiles (.tmp-*) cost every deploy.
 * Run: node scripts/test-repo-hygiene.mjs
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

// Served from public/ today and linked from outside the repo; move to object storage, then drop from here.
const LARGE_FILE_ALLOWLIST = new Set([
  'public/howtocreateartistpage.mp4',
  'public/howtocreateqr.mp4',
])
const MAX_TRACKED_BYTES = 10 * 1024 * 1024

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

test('no tracked file matches .gitignore (browser profiles, captures, caches)', () => {
  const ignored = git('ls-files', '-ci', '--exclude-standard').split('\n').filter(Boolean)
  assert.deepEqual(
    ignored.slice(0, 5),
    [],
    `${ignored.length} tracked file(s) are gitignored; run: git rm -r --cached <path>`,
  )
})

test(`no tracked file over ${MAX_TRACKED_BYTES / 1024 / 1024} MB except the allowlist`, () => {
  const tracked = git('ls-files', '-z').split('\0').filter(Boolean)
  const oversized = tracked
    .filter((rel) => !LARGE_FILE_ALLOWLIST.has(rel))
    .filter((rel) => fs.existsSync(path.join(root, rel)) && fs.statSync(path.join(root, rel)).size > MAX_TRACKED_BYTES)
  assert.deepEqual(oversized, [], 'host large media outside the repo instead of tracking it')
})

test('allowlisted large files still exist (drop the entry when the file moves)', () => {
  for (const rel of LARGE_FILE_ALLOWLIST) {
    assert.ok(fs.existsSync(path.join(root, rel)), `${rel} is allowlisted but missing`)
  }
})

console.log(`\n${passed} passed`)
