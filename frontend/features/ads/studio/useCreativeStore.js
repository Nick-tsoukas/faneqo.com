/**
 * Saved creatives.
 *
 * Durable storage is the private Strapi `creatives` collection, called with
 * the signed-in user's own JWT (never a privileged token). Every endpoint is
 * gated server-side and scoped to the caller. When the API is unreachable, not
 * deployed, or the session has no token (dev bypass), creatives fall back to
 * localStorage and are flagged `storage: 'local'` so the UI can say plainly
 * "saved on this device only". Local records are never presented as durable.
 */
import { ref, computed } from 'vue'
import { useRuntimeConfig, useStrapiToken } from '#imports'
import { deepClone, fromRecord, toRecord, validateCreative, duplicateCreative, finalizeCreative, nextCreativePageStart } from './creativeModel.js'

const LOCAL_KEY = 'faneqo.studio.creatives.v1'
const LOCAL_PREFIX = 'local-'

function isLocalId(id) {
  return String(id || '').startsWith(LOCAL_PREFIX)
}

function readLocal() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeLocal(list) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(list))
  } catch (error) {
    throw new Error('This device refused to store the creative (storage full or blocked).')
  }
}

function localId() {
  const rand = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)
  return `${LOCAL_PREFIX}${rand}`
}

function cardOf(creative) {
  const { snapshot, ...rest } = creative
  return { ...rest, snapshot: snapshot ? { name: snapshot.name, slug: snapshot.slug, hero: snapshot.hero || null, song: snapshot.song ? { title: snapshot.song.title, art: snapshot.song.art || null } : null } : null }
}

export function useCreativeStore() {
  const config = useRuntimeConfig()
  const token = useStrapiToken()
  const base = String(config.public.strapiUrl || '').replace(/\/+$/, '')

  const items = ref([])
  const loading = ref(false)
  const error = ref('')
  /** Set when a save meant for Faneqo was kept on this device instead. */
  const warning = ref('')
  /** 'api' once the backend answered, 'local' when we are on device storage only, null before load. */
  const mode = ref(null)
  const apiAvailable = ref(null)
  const remoteTotal = ref(null)
  const remoteLoaded = ref(0)
  /** True when meta.total is larger than the rows we could fetch. Search must not claim to cover the rest. */
  const incomplete = ref(false)

  const LIST_LIMIT = 200
  const MAX_PAGES = 25

  const hasToken = computed(() => Boolean(token.value))

  async function api(path, options = {}) {
    if (!token.value) throw Object.assign(new Error('No session token'), { code: 'NO_TOKEN' })
    const res = await $fetch(`${base}/api/creatives${path}`, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token.value}` },
      timeout: 15_000,
    })
    return res
  }

  function noteApi(ok) {
    apiAvailable.value = ok
    mode.value = ok ? 'api' : 'local'
  }

  async function loadRemotePages() {
    const remote = []
    let start = 0
    let total = null
    let capped = false
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const res = await api(`?start=${start}&limit=${LIST_LIMIT}`)
      const batch = Array.isArray(res?.data) ? res.data : []
      const reported = Number(res?.meta?.total)
      if (Number.isFinite(reported)) total = reported
      const loadedBefore = remote.length
      remote.push(...batch)
      const next = nextCreativePageStart({ loaded: loadedBefore, batchLength: batch.length, total, limit: LIST_LIMIT })
      if (next == null) break
      if (page === MAX_PAGES - 1) {
        capped = true
        break
      }
      start = next
    }
    remoteTotal.value = total
    remoteLoaded.value = remote.length
    incomplete.value = capped || (Number.isFinite(total) && remote.length < total)
    return remote
  }

  async function load() {
    loading.value = true
    error.value = ''
    const local = readLocal().map((row) => fromRecord(row, { storage: 'local' }))
    try {
      const remote = (await loadRemotePages()).map((row) => fromRecord(row, { storage: 'api' }))
      noteApi(true)
      items.value = [...remote, ...local].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
      if (incomplete.value) {
        error.value = `Loaded ${remote.length} of ${remoteTotal.value} creatives from Faneqo. Search covers the loaded set only.`
      }
    } catch (err) {
      noteApi(false)
      remoteTotal.value = null
      remoteLoaded.value = 0
      incomplete.value = false
      items.value = local
      if (err?.statusCode === 401 || err?.statusCode === 403) {
        error.value = 'This Faneqo session cannot open the creative library. Creations on this device are still here.'
      } else if (err?.code !== 'NO_TOKEN' && err?.statusCode !== 404) {
        error.value = 'Saved creatives could not be loaded from Faneqo. Showing creatives on this device.'
      }
    } finally {
      loading.value = false
    }
    return items.value
  }

  async function get(id) {
    const key = String(id)
    if (isLocalId(key)) {
      const row = readLocal().find((r) => String(r.id) === key)
      return row ? fromRecord(row, { storage: 'local' }) : null
    }
    try {
      const res = await api(`/${encodeURIComponent(key)}`)
      noteApi(true)
      return res?.data ? fromRecord(res.data, { storage: 'api' }) : null
    } catch (err) {
      if (err?.statusCode === 404) return null
      throw err
    }
  }

  function saveLocal(creative) {
    const list = readLocal()
    const now = new Date().toISOString()
    const record = { ...toRecord(creative), id: isLocalId(creative.id) ? creative.id : localId(), createdAt: creative.createdAt || now, updatedAt: now }
    const index = list.findIndex((r) => String(r.id) === String(record.id))
    if (index >= 0) list[index] = record
    else list.unshift(record)
    writeLocal(list)
    return fromRecord(record, { storage: 'local' })
  }

  /**
   * Save. Tries the API for new creatives and for API-backed ones; a local
   * creative stays local unless `promote` is set and the API is reachable.
   */
  async function save(creative, { promote = false } = {}) {
    const final = finalizeCreative(deepClone(creative))
    const errors = validateCreative(final)
    if (errors.length) throw new Error(errors.join(' '))
    const wantsApi = !isLocalId(final.id) || promote
    if (wantsApi && token.value) {
      try {
        const body = { data: toRecord(final) }
        const res = final.id && !isLocalId(final.id)
          ? await api(`/${encodeURIComponent(final.id)}`, { method: 'PUT', body })
          : await api('', { method: 'POST', body })
        noteApi(true)
        warning.value = ''
        const saved = fromRecord(res.data, { storage: 'api' })
        if (promote && isLocalId(final.id)) removeLocal(final.id)
        upsert(saved)
        return saved
      } catch (err) {
        if (!isLocalId(final.id) && final.id) throw err // an API record must not silently fork to local
        warning.value = err?.statusCode === 401 || err?.statusCode === 403
          ? 'This Faneqo session could not save the creative. It is still on this device.'
          : 'Faneqo did not store this creative. It is still on this device.'
      }
    } else if (wantsApi) {
      noteApi(false)
      warning.value = ''
    }
    const saved = saveLocal(final)
    upsert(saved)
    return saved
  }

  async function duplicate(creative) {
    if (creative.storage === 'api' && token.value) {
      try {
        const res = await api(`/${encodeURIComponent(creative.id)}/duplicate`, { method: 'POST' })
        const saved = fromRecord(res.data, { storage: 'api' })
        upsert(saved)
        return saved
      } catch {
        // fall through to a local copy
      }
    }
    const copy = duplicateCreative(creative)
    return save(copy)
  }

  function removeLocal(id) {
    const list = readLocal().filter((r) => String(r.id) !== String(id))
    writeLocal(list)
  }

  async function remove(creative) {
    const id = String(creative.id)
    if (isLocalId(id)) {
      removeLocal(id)
    } else {
      await api(`/${encodeURIComponent(id)}`, { method: 'DELETE' })
    }
    items.value = items.value.filter((c) => String(c.id) !== id)
  }

  function upsert(creative) {
    const card = cardOf(creative)
    const index = items.value.findIndex((c) => String(c.id) === String(creative.id))
    if (index >= 0) items.value.splice(index, 1, card)
    else items.value.unshift(card)
  }

  return { items, loading, error, warning, mode, apiAvailable, hasToken, remoteTotal, remoteLoaded, incomplete, load, get, save, duplicate, remove, isLocalId }
}

export { isLocalId }
