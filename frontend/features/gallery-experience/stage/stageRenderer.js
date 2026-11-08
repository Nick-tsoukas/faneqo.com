/**
 * Normalized Stage renderer boundary.
 * Photograph stays in PhotoSwipe. This only owns the optional GPU/CSS field.
 *
 * Future visual experiments should talk to this contract, not Three.js directly.
 * Default Living Gallery does not init this (stageMode = black).
 */

export function createStageRenderer() {
  let gpu = null
  let suspended = false

  async function init(container) {
    const { createGpuStage } = await import('./createGpuStage.js')
    gpu = await createGpuStage(container)
    return gpu
  }

  function resize() {
    if (suspended) return
    gpu?.resize?.()
  }

  function setMedia() {
    // Photograph is not drawn here.
  }

  function setProgress(state) {
    if (suspended) return
    gpu?.setState?.(state)
  }

  function suspend() {
    suspended = true
  }

  function resume() {
    suspended = false
    gpu?.resize?.()
    gpu?.render?.()
  }

  function destroy() {
    gpu?.dispose?.()
    gpu = null
    suspended = false
  }

  function render() {
    if (suspended) return
    gpu?.render?.()
  }

  return {
    init,
    resize,
    setMedia,
    setProgress,
    suspend,
    resume,
    destroy,
    render,
    getBackend: () => gpu?.backend || 'css',
    isReady: () => Boolean(gpu?.ready),
  }
}
