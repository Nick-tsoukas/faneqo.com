import { analyzeImageData } from '../core/lightField.js'

const SIZE = 24

self.onmessage = async (event) => {
  const { id, url, bitmap } = event.data || {}
  try {
    let image = bitmap
    if (!image && url) {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`light-field fetch ${response.status}`)
      image = await createImageBitmap(await response.blob())
    }
    if (!image) throw new Error('no bitmap')
    const canvas = new OffscreenCanvas(SIZE, SIZE)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(image, 0, 0, SIZE, SIZE)
    const field = analyzeImageData(ctx.getImageData(0, 0, SIZE, SIZE))
    if (typeof image.close === 'function') image.close()
    self.postMessage({ id, ok: true, field })
  } catch (error) {
    self.postMessage({ id, ok: false, error: String(error?.message || error) })
  }
}
