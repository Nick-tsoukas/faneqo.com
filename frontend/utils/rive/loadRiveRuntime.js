/**
 * Client-only loader for the official Rive WebGL2 runtime.
 * Never import `@rive-app/webgl2` at module top-level — WASM/canvas
 * must not evaluate during Nuxt SSR.
 */
let runtimePromise = null

export function loadRiveRuntime() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('[rive] runtime is client-only'))
  }
  if (!runtimePromise) {
    runtimePromise = import('@rive-app/webgl2')
  }
  return runtimePromise
}
