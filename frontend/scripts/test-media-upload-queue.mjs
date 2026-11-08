/**
 * Presentation-agnostic upload queue tests.
 * Run: node scripts/test-media-upload-queue.mjs
 */
import assert from 'node:assert/strict'
import { effect, reactive, stop } from 'vue'
import {
  createFaneqoMediaUploadQueue,
  FANEQO_DM_MAX_IMAGES,
  FANEQO_UPLOAD_CONCURRENCY,
} from '../utils/media/faneqoMedia.js'

let passed = 0
function test(name, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      passed += 1
      console.log(`  ✅ ${name}`)
    })
}

function jpeg(size = 100) {
  return { type: 'image/jpeg', size }
}

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function flush() {
  await wait(0)
  await wait(0)
}

;(async () => {
  await test('public uploadFn success marks the item ready', async () => {
    const queue = createFaneqoMediaUploadQueue({
      uploadFn: async () => ({ mediaId: 41, width: 800, height: 600, mime: 'image/jpeg' }),
    })
    queue.addFiles([jpeg()])
    await flush()
    assert.equal(queue.items[0].state, 'ready')
    assert.equal(queue.items[0].mediaId, 41)
    assert.equal(queue.ready, true)
    assert.deepEqual(queue.readyAttachments().map((row) => row.mediaId), [41])
  })

  await test('Vue reactive queue publishes async completion to composer state', async () => {
    let completeUpload
    const snapshots = []
    const queue = createFaneqoMediaUploadQueue({
      stateFactory: reactive,
      uploadFn: () => new Promise((resolve) => {
        completeUpload = resolve
      }),
    })
    const runner = effect(() => {
      snapshots.push({
        busy: queue.busy,
        ready: queue.ready,
        state: queue.items[0]?.state || 'empty',
      })
    })
    queue.addFiles([jpeg()])
    assert.equal(queue.busy, true)
    assert.equal(queue.ready, false)
    completeUpload({ mediaId: 42, protected: true, mime: 'image/webp' })
    await flush()
    assert.equal(queue.busy, false)
    assert.equal(queue.ready, true)
    assert.equal(queue.items[0].state, 'ready')
    assert.ok(snapshots.some((row) => row.state === 'ready' && row.ready && !row.busy))
    stop(runner)
  })

  await test('protected uploadFn success keeps protected:true', async () => {
    const queue = createFaneqoMediaUploadQueue({
      uploadFn: async () => ({ mediaId: 9, protected: true, mime: 'image/webp' }),
    })
    queue.addFiles([jpeg()])
    await flush()
    assert.equal(queue.items[0].protected, true)
    assert.equal(queue.readyAttachments()[0].protected, true)
  })

  await test('normal upload failure does not mark ready', async () => {
    const queue = createFaneqoMediaUploadQueue({
      uploadFn: async () => {
        throw new Error('network')
      },
    })
    queue.addFiles([jpeg()])
    await flush()
    assert.equal(queue.items[0].state, 'failed')
    assert.equal(queue.ready, false)
    assert.equal(queue.readyAttachments().length, 0)
  })

  await test('protected delivery disabled fails closed and does not fall back', async () => {
    const calls = []
    const queue = createFaneqoMediaUploadQueue({
      uploadFn: async () => {
        calls.push('protected')
        const err = new Error('Protected delivery is not available.')
        err.code = 'gated_delivery_unavailable'
        throw err
      },
    })
    queue.addFiles([jpeg()])
    await flush()
    assert.deepEqual(calls, ['protected'])
    assert.equal(queue.items[0].state, 'failed')
    assert.equal(queue.items[0].mediaId, null)
  })

  await test('one failed item leaves other ready items intact', async () => {
    let n = 0
    const queue = createFaneqoMediaUploadQueue({
      uploadFn: async () => {
        n += 1
        if (n === 1) throw new Error('boom')
        return { mediaId: 100 + n }
      },
    })
    queue.addFiles([jpeg(), jpeg()])
    await flush()
    assert.equal(queue.items[0].state, 'failed')
    assert.equal(queue.items[1].state, 'ready')
    assert.equal(queue.readyAttachments().length, 1)
  })

  await test('retry uploads only the failed item', async () => {
    let n = 0
    const queue = createFaneqoMediaUploadQueue({
      uploadFn: async () => {
        n += 1
        if (n === 1) throw new Error('boom')
        return { mediaId: n }
      },
    })
    queue.addFiles([jpeg()])
    await flush()
    assert.equal(queue.items[0].state, 'failed')
    queue.retry(queue.items[0].localId)
    await flush()
    assert.equal(queue.items[0].state, 'ready')
    assert.equal(queue.items[0].mediaId, 2)
    assert.equal(n, 2)
  })

  await test('remove queued/ready item revokes preview and drops it', async () => {
    const revoked = []
    const queue = createFaneqoMediaUploadQueue({
      uploadFn: async () => ({ mediaId: 1 }),
      createPreviewUrl: () => 'blob:preview-1',
      revokePreviewUrl: (url) => revoked.push(url),
    })
    queue.addFiles([jpeg()])
    await flush()
    const localId = queue.items[0].localId
    queue.remove(localId)
    assert.equal(queue.items.length, 0)
    assert.deepEqual(revoked, ['blob:preview-1'])
  })

  await test('remove uploading item aborts and never becomes ready', async () => {
    let resolveUpload
    const queue = createFaneqoMediaUploadQueue({
      uploadFn: (file, { signal }) => new Promise((resolve, reject) => {
        const onAbort = () => {
          const err = new Error('aborted')
          err.name = 'AbortError'
          reject(err)
        }
        if (signal?.aborted) onAbort()
        else signal?.addEventListener('abort', onAbort, { once: true })
        resolveUpload = resolve
      }),
    })
    queue.addFiles([jpeg()])
    await flush()
    assert.equal(queue.items[0].state, 'uploading')
    const localId = queue.items[0].localId
    queue.remove(localId)
    assert.equal(queue.items.length, 0)
    resolveUpload({ mediaId: 99 })
    await flush()
    assert.equal(queue.items.length, 0)
    assert.equal(queue.readyAttachments().length, 0)
  })

  await test('late resolved aborted promise does not resurrect a removed item', async () => {
    let finish
    const queue = createFaneqoMediaUploadQueue({
      uploadFn: () => new Promise((resolve) => {
        finish = resolve
      }),
    })
    queue.addFiles([jpeg()])
    await flush()
    const localId = queue.items[0].localId
    queue.remove(localId)
    finish({ mediaId: 77 })
    await flush()
    assert.equal(queue.items.find((row) => row.localId === localId), undefined)
    assert.equal(queue.items.length, 0)
  })

  await test('invalid MIME and oversized files fail locally without uploadFn', async () => {
    let calls = 0
    const queue = createFaneqoMediaUploadQueue({
      uploadFn: async () => {
        calls += 1
        return { mediaId: 1 }
      },
    })
    queue.addFiles([{ type: 'image/gif', size: 10 }, { type: 'image/jpeg', size: 9 * 1024 * 1024 }])
    await flush()
    assert.equal(calls, 0)
    assert.equal(queue.items[0].state, 'failed')
    assert.equal(queue.items[1].state, 'failed')
  })

  await test('max count is parent-configurable and DM default stays 4', async () => {
    const dm = createFaneqoMediaUploadQueue({
      uploadFn: async () => ({ mediaId: 1 }),
    })
    dm.addFiles([jpeg(), jpeg(), jpeg(), jpeg(), jpeg()])
    assert.equal(dm.items.length, FANEQO_DM_MAX_IMAGES)
    const updates = createFaneqoMediaUploadQueue({
      maxItems: 60,
      uploadFn: async () => ({ mediaId: 1 }),
    })
    updates.addFiles(Array.from({ length: 61 }, () => jpeg()))
    assert.equal(updates.items.length, 60)
  })

  await test('concurrency stays at 3', async () => {
    let active = 0
    let maxActive = 0
    const queue = createFaneqoMediaUploadQueue({
      maxItems: 5,
      uploadFn: async () => {
        active += 1
        maxActive = Math.max(maxActive, active)
        await wait(15)
        active -= 1
        return { mediaId: Date.now() }
      },
    })
    queue.addFiles([jpeg(), jpeg(), jpeg(), jpeg(), jpeg()])
    const started = Date.now()
    while (Date.now() - started < 500 && queue.items.some((row) => row.state !== 'ready')) {
      await wait(10)
    }
    assert.equal(maxActive, FANEQO_UPLOAD_CONCURRENCY)
    assert.equal(queue.items.filter((row) => row.state === 'ready').length, 5)
  })

  await test('move reorders items so the first becomes cover', async () => {
    const queue = createFaneqoMediaUploadQueue({
      maxItems: 4,
      uploadFn: async (file) => ({ mediaId: file.size, width: 800, height: 600 }),
    })
    queue.addFiles([jpeg(11), jpeg(22), jpeg(33)])
    await flush()
    assert.equal(queue.move(queue.items[2].localId, -1), true)
    assert.deepEqual(queue.readyAttachments().map((row) => row.mediaId), [11, 33, 22])
    assert.equal(queue.move(queue.items[1].localId, -1), true)
    assert.equal(queue.readyAttachments()[0].mediaId, 33)
    assert.equal(queue.move(queue.items[0].localId, -1), false)
  })

  await test('completion order does not mutate selection order', async () => {
    const queue = createFaneqoMediaUploadQueue({
      maxItems: 3,
      uploadFn: async (file) => {
        const delay = file.size === 1 ? 40 : file.size === 2 ? 5 : 20
        await wait(delay)
        return { mediaId: file.size * 10 }
      },
    })
    queue.addFiles([jpeg(1), jpeg(2), jpeg(3)])
    const started = Date.now()
    while (Date.now() - started < 400 && queue.items.some((row) => row.state !== 'ready')) {
      await wait(10)
    }
    assert.deepEqual(queue.readyAttachments().map((row) => row.mediaId), [10, 20, 30])
  })

  await test('concurrency stays bounded at 3 across 60 files', async () => {
    let active = 0
    let maxActive = 0
    const queue = createFaneqoMediaUploadQueue({
      maxItems: 60,
      uploadFn: async () => {
        active += 1
        maxActive = Math.max(maxActive, active)
        await wait(2)
        active -= 1
        return { mediaId: `m${Math.random()}` }
      },
    })
    queue.addFiles(Array.from({ length: 60 }, () => jpeg()))
    const started = Date.now()
    while (Date.now() - started < 3000 && queue.items.some((row) => row.state !== 'ready')) {
      await wait(5)
    }
    assert.equal(maxActive, FANEQO_UPLOAD_CONCURRENCY)
    assert.equal(queue.readyCount, 60)
    assert.equal(queue.items.length, 60)
  })

  await test('adopt resumes server-staged media without re-uploading it', async () => {
    let calls = 0
    const queue = createFaneqoMediaUploadQueue({
      maxItems: 60,
      uploadFn: async () => {
        calls += 1
        return { mediaId: 999 }
      },
    })
    queue.adopt([
      { mediaId: 7, thumbUrl: '/api/t/7', width: 800, height: 600, protected: true },
      { id: 8, url: 'https://cdn/8.jpg' },
      { mediaId: '', url: 'https://cdn/none.jpg' },
    ])
    await flush()
    assert.equal(calls, 0)
    assert.equal(queue.items.length, 2)
    assert.equal(queue.ready, true)
    assert.equal(queue.busy, false)
    assert.deepEqual(queue.items.map((row) => row.state), ['ready', 'ready'])
    assert.deepEqual(queue.readyAttachments().map((row) => row.mediaId), [7, 8])
    assert.equal(queue.items[0].protected, true)
    assert.equal(queue.items[0].file, null)
    /* An adopted row has no local file, so retry can never duplicate it. */
    queue.retry(queue.items[0].localId)
    await flush()
    assert.equal(calls, 0)
    assert.equal(queue.items[0].mediaId, 7)
  })

  await test('adopt honours maxItems so a 60-photo ceiling survives resume', () => {
    const queue = createFaneqoMediaUploadQueue({ maxItems: 60, uploadFn: async () => ({ mediaId: 1 }) })
    queue.adopt(Array.from({ length: 61 }, (_, i) => ({ mediaId: i + 1 })))
    assert.equal(queue.items.length, 60)
    assert.equal(queue.canAdd, false)
    assert.equal(queue.remaining, 0)
  })

  await test('mixed success and failure reports honest counts', async () => {
    let n = 0
    const queue = createFaneqoMediaUploadQueue({
      maxItems: 10,
      concurrency: 1,
      uploadFn: async () => {
        n += 1
        if (n % 2 === 0) throw new Error('flaky')
        return { mediaId: n }
      },
    })
    queue.addFiles([jpeg(), jpeg(), jpeg(), jpeg()])
    const started = Date.now()
    while (Date.now() - started < 500 && queue.busy) await wait(5)
    assert.equal(queue.readyCount, 2)
    assert.equal(queue.failedCount, 2)
    assert.equal(queue.uploadingCount, 0)
    assert.equal(queue.ready, false)
  })

  await test('retryFailed retries only failures and never duplicates a success', async () => {
    const seen = []
    let n = 0
    const queue = createFaneqoMediaUploadQueue({
      maxItems: 10,
      concurrency: 1,
      uploadFn: async (file) => {
        n += 1
        seen.push(file.size)
        if (n === 2) throw new Error('flaky')
        return { mediaId: file.size }
      },
    })
    queue.addFiles([jpeg(1), jpeg(2), jpeg(3)])
    let started = Date.now()
    while (Date.now() - started < 500 && queue.busy) await wait(5)
    assert.equal(queue.failedCount, 1)
    assert.equal(queue.retryFailed(), 1)
    started = Date.now()
    while (Date.now() - started < 500 && queue.busy) await wait(5)
    assert.equal(queue.readyCount, 3)
    assert.equal(queue.failedCount, 0)
    /* Sizes 1 and 3 were uploaded exactly once; only 2 was tried twice. */
    assert.deepEqual(seen.filter((size) => size === 1).length, 1)
    assert.deepEqual(seen.filter((size) => size === 3).length, 1)
    assert.deepEqual(seen.filter((size) => size === 2).length, 2)
    assert.deepEqual(queue.readyAttachments().map((row) => row.mediaId), [1, 2, 3])
  })

  await test('cancelPending drops in-flight work and keeps what already landed', async () => {
    const pending = []
    const queue = createFaneqoMediaUploadQueue({
      maxItems: 10,
      concurrency: 1,
      uploadFn: (file, { signal }) => new Promise((resolve, reject) => {
        if (file.size === 1) {
          resolve({ mediaId: 1 })
          return
        }
        pending.push(resolve)
        signal?.addEventListener('abort', () => {
          const err = new Error('aborted')
          err.name = 'AbortError'
          reject(err)
        }, { once: true })
      }),
    })
    queue.addFiles([jpeg(1), jpeg(2), jpeg(3)])
    const started = Date.now()
    while (Date.now() - started < 500 && queue.readyCount < 1) await wait(5)
    assert.equal(queue.readyCount, 1)
    assert.equal(queue.cancelPending(), 2)
    assert.equal(queue.items.length, 1)
    assert.equal(queue.ready, true)
    pending.forEach((resolve) => resolve({ mediaId: 99 }))
    await flush()
    assert.equal(queue.items.length, 1)
    assert.deepEqual(queue.readyAttachments().map((row) => row.mediaId), [1])
  })

  await test('a server thumbnail replaces and revokes the original blob preview', async () => {
    const revoked = []
    const queue = createFaneqoMediaUploadQueue({
      uploadFn: async () => ({ mediaId: 5, thumbUrl: '/api/thumb/5' }),
      createPreviewUrl: () => 'blob:full-res',
      revokePreviewUrl: (url) => revoked.push(url),
    })
    queue.addFiles([jpeg()])
    await flush()
    assert.deepEqual(revoked, ['blob:full-res'])
    assert.equal(queue.items[0].previewUrl, null)
    assert.equal(queue.items[0].thumbUrl, '/api/thumb/5')
    assert.equal(queue.readyAttachments()[0].thumbUrl, '/api/thumb/5')
  })

  await test('disposal clears every item and revokes every outstanding preview', async () => {
    const revoked = []
    let i = 0
    const queue = createFaneqoMediaUploadQueue({
      maxItems: 10,
      uploadFn: () => new Promise(() => {}),
      createPreviewUrl: () => `blob:p${(i += 1)}`,
      revokePreviewUrl: (url) => revoked.push(url),
    })
    queue.addFiles([jpeg(), jpeg(), jpeg()])
    await flush()
    // useMediaUploadQueue calls exactly this on scope dispose.
    queue.clear()
    assert.equal(queue.items.length, 0)
    assert.deepEqual(revoked.sort(), ['blob:p1', 'blob:p2', 'blob:p3'])
    assert.equal(queue.busy, false)
  })

  console.log(`\n=== media upload queue: ${passed} passed ===`)
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
