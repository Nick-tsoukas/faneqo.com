/**
 * Render a mounted creative to a PNG in the browser.
 *
 * The node is cloned, every computed style is inlined, images and the Poppins
 * faces become data URLs, and the result is drawn through an SVG
 * <foreignObject> onto a canvas of the exact logical size. No server, no
 * extension, no dependency. Chrome and Edge are the supported studio browsers.
 */

const FONT_CSS_URL = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700;800&display=swap'

let fontCssPromise = null
const assetCache = new Map()

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error || new Error('Could not read asset'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Same-origin assets (including the studio's authenticated media proxy) need
 * the session cookie. Third-party assets are fetched anonymously with CORS.
 */
function isSameOrigin(url) {
  if (url.startsWith('/')) return true
  try {
    return new URL(url, window.location.href).origin === window.location.origin
  } catch {
    return false
  }
}

async function fetchAsDataUrl(url) {
  if (url.startsWith('data:')) return url
  if (assetCache.has(url)) return assetCache.get(url)
  const task = (async () => {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: isSameOrigin(url) ? 'same-origin' : 'omit',
    })
    if (!response.ok) throw new Error(`${response.status} for ${url}`)
    return blobToDataUrl(await response.blob())
  })()
  assetCache.set(url, task)
  try {
    return await task
  } catch (error) {
    assetCache.delete(url)
    throw error
  }
}

/** Poppins @font-face rules with embedded woff2 so the SVG image can use them. */
async function embeddedFontCss() {
  if (fontCssPromise) return fontCssPromise
  fontCssPromise = (async () => {
    const response = await fetch(FONT_CSS_URL, { mode: 'cors', credentials: 'omit' })
    if (!response.ok) throw new Error(`Font stylesheet ${response.status}`)
    const css = await response.text()
    const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1])
    const unique = [...new Set(urls)]
    const data = await Promise.all(unique.map((u) => fetchAsDataUrl(u)))
    let out = css
    unique.forEach((u, i) => {
      out = out.split(`url(${u})`).join(`url(${data[i]})`)
    })
    return out
  })()
  try {
    return await fontCssPromise
  } catch (error) {
    fontCssPromise = null
    console.warn('[ads] Poppins could not be embedded; the PNG will use fallback fonts.', error)
    return ''
  }
}

function copyStyles(source, target) {
  const computed = window.getComputedStyle(source)
  const style = target.style
  for (let i = 0; i < computed.length; i += 1) {
    const name = computed[i]
    style.setProperty(name, computed.getPropertyValue(name), computed.getPropertyPriority(name))
  }
  style.setProperty('transition', 'none')
  style.setProperty('animation', 'none')
}

async function cloneTree(source) {
  const clone = source.cloneNode(false)
  if (source.nodeType === Node.ELEMENT_NODE) {
    copyStyles(source, clone)
    if (source instanceof HTMLImageElement) {
      const src = source.currentSrc || source.src
      if (src) {
        clone.removeAttribute('srcset')
        clone.setAttribute('src', await fetchAsDataUrl(src))
      }
    }
  }
  for (const child of source.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE || child.nodeType === Node.TEXT_NODE) {
      clone.appendChild(await cloneTree(child))
    }
  }
  return clone
}

async function waitForImages(root) {
  const images = [...root.querySelectorAll('img')]
  await Promise.all(images.map((img) => {
    if (img.complete && img.naturalWidth) return Promise.resolve()
    return img.decode().catch(() => {})
  }))
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('The creative could not be rasterized.'))
    image.src = url
  })
}

/**
 * @param {HTMLElement} node the creative root, laid out at 1:1
 * @param {{ width: number, height: number }} size exact logical pixels
 * @returns {Promise<Blob>} PNG
 */
export async function renderNodeToPng(node, { width, height }) {
  if (document.fonts?.ready) await document.fonts.ready
  await waitForImages(node)

  const [fontCss, clone] = await Promise.all([embeddedFontCss(), cloneTree(node)])
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')
  clone.style.setProperty('margin', '0')
  clone.style.setProperty('width', `${width}px`)
  clone.style.setProperty('height', `${height}px`)

  const markup = new XMLSerializer().serializeToString(clone)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<style>${fontCss}</style>` +
    `<foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`
  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.drawImage(image, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('The browser refused to encode the PNG.'))
    }, 'image/png')
  })
}

export function savePngBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Read the IHDR of a PNG blob so the studio can confirm the saved size. */
export async function pngDimensions(blob) {
  const bytes = new DataView(await blob.slice(16, 24).arrayBuffer())
  return { width: bytes.getUint32(0), height: bytes.getUint32(4) }
}
