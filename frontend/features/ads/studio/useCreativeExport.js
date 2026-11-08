/**
 * PNG export for studio creatives. Wraps the shared renderer with the exact
 * canvas size, a size check on the written file, scene sequencing for
 * carousels, and status text the editor can show.
 */
import { ref } from 'vue'
import { pngDimensions, renderNodeToPng, savePngBlob } from '../exportPng.js'
import { AD_FORMATS } from '../formats.js'
import { creativeFileName } from './creativeModel.js'

export function useCreativeExport() {
  const exporting = ref(false)
  const status = ref('')
  const failed = ref(false)
  const progress = ref('')
  let clearTimer = null

  function setStatus(text, isError = false) {
    status.value = text
    failed.value = isError
    if (clearTimer) clearTimeout(clearTimer)
    if (!isError && text) clearTimer = setTimeout(() => { status.value = '' }, 7000)
  }

  /**
   * Render one mounted node to a PNG of the format's exact size and save it.
   * Returns the written dimensions.
   */
  async function exportNode(node, formatId, fileName, { settle = 160 } = {}) {
    const board = AD_FORMATS[formatId]
    if (!board) throw new Error(`Unknown format ${formatId}`)
    if (!node) throw new Error('The creative did not mount for export.')
    await new Promise((resolve) => setTimeout(resolve, settle))
    const size = { width: board.width, height: board.height }
    const blob = await renderNodeToPng(node, size)
    const dims = await pngDimensions(blob)
    if (dims.width !== size.width || dims.height !== size.height) {
      throw new Error(`Rendered ${dims.width}×${dims.height}, expected ${size.width}×${size.height}.`)
    }
    savePngBlob(blob, fileName)
    return dims
  }

  /**
   * Export one scene (or the single composition) of a creative.
   * `mount(sceneIndex)` must resolve to the laid-out creative root at 1:1.
   */
  async function exportScene(creative, formatId, sceneIndex, mount) {
    if (exporting.value) return null
    exporting.value = true
    const multi = creative.sceneCount > 1
    const fileName = creativeFileName(creative, formatId, multi ? sceneIndex + 1 : null)
    const board = AD_FORMATS[formatId]
    setStatus(`Rendering ${board.width}×${board.height}…`)
    try {
      const node = await mount(sceneIndex)
      const dims = await exportNode(node, formatId, fileName)
      setStatus(`Saved ${fileName} · ${dims.width}×${dims.height}`)
      return { fileName, ...dims }
    } catch (error) {
      setStatus(`Download failed: ${error?.message || error}`, true)
      return null
    } finally {
      exporting.value = false
      progress.value = ''
    }
  }

  /** Export every scene of a carousel, one file per scene, in order. */
  async function exportAllScenes(creative, formatId, mount) {
    if (exporting.value) return []
    exporting.value = true
    const total = Math.max(1, creative.sceneCount || 1)
    const written = []
    try {
      for (let i = 0; i < total; i += 1) {
        progress.value = `${i + 1} / ${total}`
        setStatus(`Rendering scene ${i + 1} of ${total}…`)
        const node = await mount(i)
        const fileName = creativeFileName(creative, formatId, total > 1 ? i + 1 : null)
        const dims = await exportNode(node, formatId, fileName)
        written.push({ fileName, ...dims })
        // Give the browser a beat between downloads so none are dropped.
        await new Promise((resolve) => setTimeout(resolve, 350))
      }
      setStatus(`Saved ${written.length} file${written.length === 1 ? '' : 's'} at ${AD_FORMATS[formatId].width}×${AD_FORMATS[formatId].height}`)
      return written
    } catch (error) {
      setStatus(`Download failed after ${written.length} file${written.length === 1 ? '' : 's'}: ${error?.message || error}`, true)
      return written
    } finally {
      exporting.value = false
      progress.value = ''
    }
  }

  return { exporting, status, failed, progress, exportScene, exportAllScenes, exportNode }
}
