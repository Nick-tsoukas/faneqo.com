/**
 * Shared `.riv` file cache.
 * Load once, pass `riveFile` into multiple FaneqoRive instances.
 * Do not cleanup a cached RiveFile while any instance still uses it.
 */
import { loadRiveRuntime } from './loadRiveRuntime'

const files = new Map()

export async function getCachedRiveFile(src) {
  if (!src) {
    throw new Error('[rive] getCachedRiveFile requires src')
  }
  const hit = files.get(src)
  if (hit) return hit

  const pending = loadRiveRuntime().then(async ({ RiveFile }) => {
    const file = new RiveFile({ src })
    await file.init()
    return file
  })

  files.set(src, pending)
  try {
    return await pending
  } catch (err) {
    files.delete(src)
    throw err
  }
}

export function peekCachedRiveFile(src) {
  return files.get(src) || null
}
