/**
 * Photo composition resolver V2.
 * Semantic placement for Living Gallery. PhotoSwipe contain-fits inside this padding.
 * Do not upscale low-res fixtures irresponsibly on large desktops.
 * Phone rules are authored per aspect class — not one generic contain-fit.
 */

function clamp(value, min, max) {
  const n = Number(value)
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

export const PHOTO_LANDSCAPE = 'landscape'
export const PHOTO_PORTRAIT = 'portrait'
export const PHOTO_SQUARE = 'square'

export const ASPECT_PORTRAIT_23 = 'portrait-2-3'
export const ASPECT_PORTRAIT_34 = 'portrait-3-4'
export const ASPECT_PORTRAIT_45 = 'portrait-4-5'
export const ASPECT_NEAR_SQUARE = 'near-square'
export const ASPECT_SQUARE = 'square'
export const ASPECT_LANDSCAPE = 'landscape'
export const ASPECT_WIDE = 'wide'

export const DEVICE_PHONE = 'phone'
export const DEVICE_TABLET = 'tablet'
export const DEVICE_DESKTOP = 'desktop'
export const DEVICE_ULTRAWIDE = 'ultrawide'

export const OPTICAL_AUTO = 'auto'
export const OPTICAL_CENTER = 'center'
export const OPTICAL_SLIGHT_HIGH = 'slight-high'
export const OPTICAL_HIGHER = 'higher'
export const OPTICAL_CUSTOM = 'custom'

export const OPTICAL_AY = Object.freeze({
  [OPTICAL_CENTER]: 0.5,
  [OPTICAL_SLIGHT_HIGH]: 0.44,
  [OPTICAL_HIGHER]: 0.38,
})

export function classifyPhotoOrientation(width, height) {
  const w = Math.max(1, Number(width) || 1)
  const h = Math.max(1, Number(height) || 1)
  const aspect = w / h
  if (aspect > 1.12) return PHOTO_LANDSCAPE
  if (aspect < 0.92) return PHOTO_PORTRAIT
  return PHOTO_SQUARE
}

export function classifyPhotoAspectClass(width, height) {
  const w = Math.max(1, Number(width) || 1)
  const h = Math.max(1, Number(height) || 1)
  const aspect = w / h
  if (aspect <= 0.70) return ASPECT_PORTRAIT_23
  if (aspect <= 0.775) return ASPECT_PORTRAIT_34
  if (aspect < 0.88) return ASPECT_PORTRAIT_45
  if (aspect < 0.97) return ASPECT_NEAR_SQUARE
  if (aspect <= 1.03) return ASPECT_SQUARE
  if (aspect <= 1.12) return ASPECT_NEAR_SQUARE
  if (aspect < 1.65) return ASPECT_LANDSCAPE
  return ASPECT_WIDE
}

export function describePhotoAspect(width, height) {
  const w = Math.max(1, Number(width) || 1)
  const h = Math.max(1, Number(height) || 1)
  return {
    width: w,
    height: h,
    aspectRatio: Number((w / h).toFixed(3)),
    aspectClass: classifyPhotoAspectClass(w, h),
    orientation: classifyPhotoOrientation(w, h),
  }
}

export function classifyDeviceClass(viewportWidth = 390, viewportHeight = 844) {
  const vw = Math.max(1, Number(viewportWidth) || 1)
  const vh = Math.max(1, Number(viewportHeight) || 1)
  const shortest = Math.min(vw, vh)
  const longest = Math.max(vw, vh)
  // A phone in landscape is still a phone (e.g. 932×430). Do not treat it as a tablet.
  if (shortest < 500 && longest <= 1100) return DEVICE_PHONE
  if (vw >= 1680) return DEVICE_ULTRAWIDE
  if (vw >= 1100 || (vw >= 900 && vw > vh && shortest >= 700)) return DEVICE_DESKTOP
  if (shortest >= 680 || vw >= 720) return DEVICE_TABLET
  return DEVICE_PHONE
}

export function readSafeInsets(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc?.body) return { top: 0, right: 0, bottom: 0, left: 0 }
  const probe = doc.createElement('div')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'visibility:hidden',
    'pointer-events:none',
    'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
  ].join(';')
  doc.body.appendChild(probe)
  const cs = doc.defaultView?.getComputedStyle?.(probe)
  const read = (prop) => {
    const n = parseFloat(cs?.[prop] || '0')
    return Number.isFinite(n) ? n : 0
  }
  const inset = {
    top: read('paddingTop'),
    right: read('paddingRight'),
    bottom: read('paddingBottom'),
    left: read('paddingLeft'),
  }
  probe.remove()
  return inset
}

export function containRect({
  boxX = 0,
  boxY = 0,
  boxW = 1,
  boxH = 1,
  imageW = 1,
  imageH = 1,
} = {}) {
  const bw = Math.max(1, Number(boxW) || 1)
  const bh = Math.max(1, Number(boxH) || 1)
  const iw = Math.max(1, Number(imageW) || 1)
  const ih = Math.max(1, Number(imageH) || 1)
  const scale = Math.min(bw / iw, bh / ih)
  const w = iw * scale
  const h = ih * scale
  return {
    x: Number(boxX) + (bw - w) / 2,
    y: Number(boxY) + (bh - h) / 2,
    w,
    h,
  }
}

/**
 * Chrome overlays the black field. It must not reflow the photograph on tap.
 */
function chromeReserve(_device, _orientation, _chromeOn) {
  return { top: 0, bottom: 0, left: 0, right: 0 }
}

function maxUpscale(device) {
  // Composition may outsize fixture pixels. Softness is source debt, not layout truth.
  if (device === DEVICE_PHONE) return 1.06
  if (device === DEVICE_TABLET) return 1.4
  if (device === DEVICE_ULTRAWIDE) return 1.75
  return 1.55
}

/**
 * Desktop shelf reserve.
 *
 * The shelf is where the caption plate, contact sheet and controls live, so it
 * is part of the composition — not padding. Without a reserve a near-full-
 * height print ran underneath the dock and the contact sheet sat on top of the
 * photograph.
 */
function desktopShelf(device) {
  const wide = device === DEVICE_ULTRAWIDE
  /*
   * One reserve for the whole display, not one per orientation. Sizing the
   * shelf to the active photograph moved the shelf itself as you swiped from a
   * landscape frame to a portrait one — the print is allowed to change shape,
   * the room around it is not.
   *
   * The bottom is deep enough that the contact sheet can be raised over the
   * shelf without ever touching the print, which is why the print keeps its
   * full size on a large display instead of permanently giving up a sixth of
   * its height to a strip of thumbnails.
   */
  return {
    top: wide ? 44 : 38,
    bottom: wide ? 196 : 178,
    plate: wide ? 58 : 52,
    bar: wide ? 62 : 58,
    sheet: 0,
    gap: 14,
  }
}

/**
 * Phone / tablet shelf reserve — the Gallery Shelf.
 *
 * A 3:2 frame can only ever cover about a third of a tall phone, so the real
 * design question is never "how big is the print" but "what is the rest of the
 * screen". Previously the rest was three unrelated bands of black: above the
 * print, between the print and its identity lines, and between those and the
 * controls. That is what read as a lightbox.
 *
 * Reserving one block at the foot — caption plate, contact sheet, actions —
 * turns the lower third into photographs and type, and leaves exactly one
 * interval of darkness between the print and its shelf. The reserve does not
 * depend on chrome visibility or on which photograph is showing, so the print
 * never moves on tap, on swipe, or on rotation.
 */
export function handShelf(device, viewportHeight, hasSheet = true) {
  const vh = Math.max(1, Number(viewportHeight) || 1)
  // A gallery of one has no contact sheet, so the shelf must not hold a space
  // for it. Gallery length is a property of the gallery, not of the open
  // photograph, so the reserve still cannot change as you swipe.
  const sheet = (height) => (hasSheet ? height : 0)
  if (device === DEVICE_TABLET) {
    return { top: 52, gap: 24, plate: 78, sheet: sheet(92), bar: 58 }
  }
  // A phone held on its side has no room to give away; chrome overlays there.
  if (vh < 620) return { top: 0, gap: 0, plate: 0, sheet: 0, bar: 0 }
  if (vh < 720) return { top: 44, gap: 16, plate: 64, sheet: 0, bar: 56 }
  return { top: 48, gap: 20, plate: 72, sheet: sheet(76), bar: 56 }
}

function shelfHeight(shelf) {
  return shelf.plate + shelf.sheet + shelf.bar
}

function alignmentFor(device, orientation, editorialBias = false) {
  if (device === DEVICE_PHONE) {
    if (orientation === PHOTO_LANDSCAPE) return { ax: 0.5, ay: 0.36 }
    if (orientation === PHOTO_PORTRAIT) return { ax: 0.5, ay: 0.40 }
    return { ax: 0.5, ay: 0.40 }
  }
  if (device === DEVICE_TABLET) {
    // Leave a lower shelf for Memory Rail / context without shrinking the print.
    if (orientation === PHOTO_LANDSCAPE) return { ax: 0.5, ay: 0.40 }
    if (orientation === PHOTO_SQUARE) return { ax: 0.5, ay: 0.44 }
    return { ax: 0.5, ay: 0.46 }
  }
  // The print and its column are centred as one group further down, so the
  // fraction here only distributes slack inside the print's own field.
  if (editorialBias) {
    if (orientation === PHOTO_PORTRAIT) return { ax: 0.5, ay: 0.46 }
    return { ax: 0.5, ay: 0.48 }
  }
  // Powerful centered placement. Landscape sits slightly high so lower black
  // can host Memory Rail / context without looking like leftover void.
  if (orientation === PHOTO_LANDSCAPE) return { ax: 0.5, ay: 0.40 }
  if (orientation === PHOTO_SQUARE) return { ax: 0.5, ay: 0.46 }
  return { ax: 0.5, ay: 0.48 }
}

/**
 * Does this photograph earn an editorial column?
 *
 * Derived from the photograph itself, never passed in as a gallery-wide flag.
 * A single flag cannot describe a mixed gallery: PhotoSwipe resolves padding
 * per item, so a gallery-level bias made the print and its column disagree and
 * the editorial type landed on the photograph.
 *
 * A column is earned when the print is height-bound — its leftover width is
 * real space with nothing to do — and that leftover can hold a readable
 * measure. Landscape is excluded by art direction: a wide frame's job on a
 * large display is cinematic authority, not a magazine spread.
 */
export function earnsContextColumn({
  device = DEVICE_DESKTOP,
  viewportWidth = 1440,
  orientation = PHOTO_PORTRAIT,
  imageWidth = 1000,
  imageHeight = 1500,
  availWidth = 1,
  availHeight = 1,
  contextEnabled = true,
} = {}) {
  if (contextEnabled === false) return 0
  if (device !== DEVICE_DESKTOP && device !== DEVICE_ULTRAWIDE) return 0
  if (orientation === PHOTO_LANDSCAPE) return 0
  const iw = Math.max(1, Number(imageWidth) || 1)
  const ih = Math.max(1, Number(imageHeight) || 1)
  const aw = Math.max(1, Number(availWidth) || 1)
  const ah = Math.max(1, Number(availHeight) || 1)
  // Height-bound means the print cannot use the width it has been given.
  if (aw / iw <= ah / ih) return 0
  const printW = iw * (ah / ih)
  const gutter = columnGutter(viewportWidth)
  const spare = aw - printW - gutter
  if (spare < COLUMN_MIN) return 0
  return clamp(Math.round(Math.min(spare, Number(viewportWidth) * 0.24)), COLUMN_MIN, COLUMN_MAX)
}

const COLUMN_MIN = 264
const COLUMN_MAX = 420

function columnGutter(viewportWidth) {
  return clamp(Math.round(Number(viewportWidth) * 0.055), 56, 112)
}

function defaultPhoneOpticalAy(aspectClass, restsOnShelf) {
  /*
   * A phone cannot make a 3:2 frame fill a 390x844 screen, so the only real
   * question is what the leftover darkness does. Split above and below, it
   * reads as two accidents and strands the caption away from its photograph.
   * Pooled into one interval above, with the print resting on its own shelf,
   * it reads as matting — and the caption always touches the print it names.
   */
  if (restsOnShelf) return 1
  // Adaptive Editorial Stage families — optical placement differs by orientation.
  if (aspectClass === ASPECT_PORTRAIT_23 || aspectClass === ASPECT_PORTRAIT_34 || aspectClass === ASPECT_PORTRAIT_45) {
    // Monumental: sit slightly high so the print approaches chrome without crop.
    return 0.40
  }
  if (aspectClass === ASPECT_NEAR_SQUARE) return 0.42
  if (aspectClass === ASPECT_SQUARE) {
    // Print-balance: deliberate mid-high stage, not accidental portrait.
    return 0.40
  }
  if (aspectClass === ASPECT_WIDE) return 0.41
  return 0.40
}

export function resolveOpticalAy({
  device = DEVICE_PHONE,
  orientation = PHOTO_LANDSCAPE,
  aspectClass = ASPECT_LANDSCAPE,
  opticalMode = OPTICAL_AUTO,
  opticalOffset = 0,
  editorialBias = false,
  restsOnShelf = false,
} = {}) {
  if (opticalMode === OPTICAL_CUSTOM) {
    const offset = clamp(Number(opticalOffset) || 0, -0.16, 0.22)
    return clamp(0.5 - offset, 0.28, 0.66)
  }
  if (opticalMode && opticalMode !== OPTICAL_AUTO && OPTICAL_AY[opticalMode] != null) {
    return OPTICAL_AY[opticalMode]
  }
  if (device !== DEVICE_PHONE) return alignmentFor(device, orientation, editorialBias).ay
  return defaultPhoneOpticalAy(aspectClass, restsOnShelf)
}

function phoneEdges(aspectClass, safe, extra, shrinkPx) {
  if (
    aspectClass === ASPECT_PORTRAIT_23
    || aspectClass === ASPECT_PORTRAIT_34
    || aspectClass === ASPECT_PORTRAIT_45
  ) {
    return {
      L: Math.max(0, safe.left) + extra * 0.03 + shrinkPx * 0.08,
      R: Math.max(0, safe.right) + extra * 0.03 + shrinkPx * 0.08,
      T: Math.max(0, safe.top),
      B: Math.max(0, safe.bottom),
    }
  }
  if (aspectClass === ASPECT_NEAR_SQUARE) {
    return {
      L: Math.max(0, safe.left) + extra * 0.04 + shrinkPx * 0.12,
      R: Math.max(0, safe.right) + extra * 0.04 + shrinkPx * 0.12,
      T: Math.max(0, safe.top),
      B: Math.max(0, safe.bottom),
    }
  }
  if (aspectClass === ASPECT_SQUARE) {
    // Square print: full useful width — dignity comes from optical stage, not side matte.
    return {
      L: Math.max(0, safe.left) + extra * 0.01 + shrinkPx * 0.04,
      R: Math.max(0, safe.right) + extra * 0.01 + shrinkPx * 0.04,
      T: Math.max(0, safe.top),
      B: Math.max(0, safe.bottom),
    }
  }
  // Landscape / wide: aggressively own viewport width.
  const side = aspectClass === ASPECT_WIDE ? 0 : 0
  return {
    L: Math.max(side, safe.left + side + extra * 0.04) + shrinkPx * 0.08,
    R: Math.max(side, safe.right + side + extra * 0.04) + shrinkPx * 0.08,
    T: Math.max(0, safe.top),
    B: Math.max(0, safe.bottom),
  }
}

export function compositionRuleName(device, aspectClass, editorial = false) {
  if (device === DEVICE_DESKTOP || device === DEVICE_ULTRAWIDE) {
    const orientation = aspectClass === ASPECT_SQUARE || aspectClass === ASPECT_NEAR_SQUARE
      ? PHOTO_SQUARE
      : (aspectClass === ASPECT_LANDSCAPE || aspectClass === ASPECT_WIDE ? PHOTO_LANDSCAPE : PHOTO_PORTRAIT)
    const scope = device === DEVICE_ULTRAWIDE ? 'wide' : 'desktop'
    if (orientation === PHOTO_LANDSCAPE) return `${scope}-landscape-cinematic`
    if (orientation === PHOTO_SQUARE) return `${scope}-square-exhibition`
    return editorial ? `${scope}-portrait-editorial` : `${scope}-portrait-centered`
  }
  if (device === DEVICE_PHONE) {
    if (aspectClass === ASPECT_PORTRAIT_23 || aspectClass === ASPECT_PORTRAIT_34 || aspectClass === ASPECT_PORTRAIT_45) {
      return 'phone-portrait-monumental'
    }
    if (aspectClass === ASPECT_NEAR_SQUARE) return 'phone-near-square-print'
    if (aspectClass === ASPECT_SQUARE) return 'phone-square-print'
    if (aspectClass === ASPECT_WIDE) return 'phone-wide-width-field'
    return 'phone-landscape-width-field'
  }
  if (device === DEVICE_TABLET) return 'tablet-inset'
  if (device === DEVICE_ULTRAWIDE) return 'ultrawide-editorial'
  return 'desktop-editorial'
}

function formatRect(rect) {
  const x = Math.round(Number(rect?.x) || 0)
  const y = Math.round(Number(rect?.y) || 0)
  const w = Math.round(Number(rect?.w) || 0)
  const h = Math.round(Number(rect?.h) || 0)
  return `${x},${y} ${w}×${h}`
}

/**
 * Resolve padding / image box for one photograph.
 *
 * `editorialBias` is a tri-state: `null` (default) lets each photograph earn
 * its own editorial column, `false` suppresses columns entirely (context off).
 * There is deliberately no "force a column" value — a column the geometry has
 * not earned is what put editorial type on top of the photograph.
 */
export function resolvePhotoComposition({
  viewportWidth = 390,
  viewportHeight = 844,
  imageWidth = 1600,
  imageHeight = 1066,
  safeTop = 0,
  safeRight = 0,
  safeBottom = 0,
  safeLeft = 0,
  scaleBias = 1,
  surroundExtra = 0,
  chromeOn = false,
  opticalMode = OPTICAL_AUTO,
  opticalOffset = 0,
  editorialBias = null,
  hasSheet = true,
} = {}) {
  const vw = Math.max(1, Number(viewportWidth) || 1)
  const vh = Math.max(1, Number(viewportHeight) || 1)
  const iw = Math.max(1, Number(imageWidth) || 1)
  const ih = Math.max(1, Number(imageHeight) || 1)
  const orientation = classifyPhotoOrientation(iw, ih)
  const aspectClass = classifyPhotoAspectClass(iw, ih)
  const aspectRatio = Number((iw / ih).toFixed(3))
  const device = classifyDeviceClass(vw, vh)
  const extra = Math.max(0, Number(surroundExtra) || 0)
  const shrink = 1 - clamp(scaleBias, 0.78, 1.06)
  const shrinkPx = Math.round(Math.min(vw, vh) * shrink * 0.18)
  const chrome = chromeReserve(device, orientation, chromeOn)

  let edgeL
  let edgeR
  let edgeT
  let edgeB
  let contextColumn = 0
  let gutter = 0
  let shelf = null

  if (device === DEVICE_PHONE || device === DEVICE_TABLET) {
    shelf = handShelf(device, vh, hasSheet)
    const edges = device === DEVICE_PHONE
      ? phoneEdges(aspectClass, {
        top: safeTop,
        right: safeRight,
        bottom: safeBottom,
        left: safeLeft,
      }, extra, shrinkPx)
      : {
        L: Math.max(22, safeLeft + 24 + extra) + shrinkPx,
        R: Math.max(22, safeRight + 24 + extra) + shrinkPx,
        T: Math.max(0, safeTop),
        B: Math.max(0, safeBottom),
      }
    edgeL = edges.L
    edgeR = edges.R
    /*
     * The shelf absorbs the system's own insets rather than stacking a second
     * reserve on top of them. Adding them left a notched phone with 47px of
     * status bar under 48px of breathing room, and a home indicator under a
     * 56px action row — roughly 80px of the photograph spent on padding that
     * the shelf was already providing.
     */
    edgeT = Math.max(shelf.top, edges.T) + chrome.top
    edgeB = shelfHeight(shelf) + shelf.gap + Math.max(0, edges.B - 24) + chrome.bottom
  } else {
    // Desktop is art-directed per orientation, not a scaled phone.
    // Landscape claims width; square is hung as a print; portrait gives its
    // leftover width to an editorial column instead of two dead margins.
    const side = device === DEVICE_ULTRAWIDE ? 44 : 34
    const desk = desktopShelf(device)
    shelf = desk
    edgeL = Math.max(side, safeLeft + side) + extra + shrinkPx
    edgeR = Math.max(side, safeRight + side) + extra + shrinkPx
    edgeT = Math.max(desk.top, safeTop + desk.top) + chrome.top
    edgeB = Math.max(desk.bottom, safeBottom + desk.bottom) + chrome.bottom
    contextColumn = editorialBias === false ? 0 : earnsContextColumn({
      device,
      viewportWidth: vw,
      orientation,
      imageWidth: iw,
      imageHeight: ih,
      availWidth: vw - edgeL - edgeR,
      availHeight: vh - edgeT - edgeB,
      contextEnabled: editorialBias !== false,
    })
    if (contextColumn > 0) {
      edgeR += contextColumn
      // The caption plate's reserve belongs to the column now, so give the
      // print the height back instead of leaving an empty band under it.
      edgeB = Math.max(chrome.bottom, edgeB - shelf.plate)
      shelf = { ...shelf, plate: 0 }
    }
  }

  const editorial = contextColumn > 0
  const { ax } = alignmentFor(device, orientation, editorial)
  const ay = resolveOpticalAy({
    device,
    orientation,
    aspectClass,
    opticalMode,
    opticalOffset,
    editorialBias: editorial,
    restsOnShelf: Boolean(shelf && shelf.plate > 0 && device === DEVICE_PHONE),
  })

  const availW = Math.max(1, vw - edgeL - edgeR)
  const availH = Math.max(1, vh - edgeT - edgeB)
  const cap = maxUpscale(device)
  const maxW = Math.min(availW, iw * cap)
  const maxH = Math.min(availH, ih * cap)
  const scale = Math.min(maxW / iw, maxH / ih)
  const dispW = iw * scale
  const dispH = ih * scale
  let x = edgeL + (availW - dispW) * ax
  const y = edgeT + (availH - dispH) * ay

  /*
   * Editorial spread. The print and its column are one composed group with a
   * fixed internal gutter, and the group is centred. Placing the print by a
   * fraction of its leftover space instead produces the opposite of the
   * intended rhythm — a huge outer margin against a hairline gutter.
   */
  if (contextColumn > 0) {
    gutter = columnGutter(vw)
    const groupW = dispW + gutter + contextColumn
    x = Math.max(edgeL - contextColumn, Math.round((vw - groupW) / 2))
  }
  const padding = {
    top: Math.max(0, y),
    right: Math.max(0, vw - x - dispW),
    bottom: Math.max(0, vh - y - dispH),
    left: Math.max(0, x),
  }
  const imageRect = {
    x: padding.left,
    y: padding.top,
    w: Math.max(1, vw - padding.left - padding.right),
    h: Math.max(1, vh - padding.top - padding.bottom),
  }
  const rule = compositionRuleName(device, aspectClass, editorial)
  // The column is the band between the print's right edge and the viewport,
  // minus the outer margin — a real region, not whatever space was left over.
  const columnRect = contextColumn > 0
    ? {
      x: imageRect.x + imageRect.w + gutter,
      y: imageRect.y,
      w: contextColumn,
      h: imageRect.h,
    }
    : null

  const topBreath = imageRect.y
  const bottomBreath = vh - (imageRect.y + imageRect.h)
  const stageFamily = orientation === PHOTO_PORTRAIT
    ? 'monumental'
    : orientation === PHOTO_SQUARE
      ? 'print-balance'
      : 'width-field'

  return {
    orientation,
    aspectClass,
    aspectRatio,
    device,
    rule,
    stageFamily,
    opticalMode: opticalMode || OPTICAL_AUTO,
    opticalAy: ay,
    padding,
    stageWidth: vw,
    stageHeight: vh,
    imageMaxWidth: imageRect.w,
    imageMaxHeight: imageRect.h,
    imageRect,
    imageRectLabel: formatRect(imageRect),
    viewportLabel: `${Math.round(vw)}×${Math.round(vh)}`,
    topBreath,
    bottomBreath,
    shelf,
    shelfHeight: shelf ? shelfHeight(shelf) : 0,
    // The contact sheet is resident only where the reserve already holds it.
    // Deriving this from the viewport rather than from the active photograph
    // keeps the action row identical for every frame in a gallery.
    railResident: Boolean(shelf && shelf.sheet > 0),
    sideSurround: Math.min(imageRect.x, vw - (imageRect.x + imageRect.w)),
    verticalAlign: ay >= 0.97 ? 'shelf' : ay < 0.47 ? 'optical' : 'center',
    // Alignment reports the composition that actually rendered, not the input.
    horizontalAlign: padding.right > padding.left + 80 ? 'editorial' : 'center',
    contextColumn,
    columnRect,
    maxUpscale: cap,
  }
}

export function photoRectToUv(rect, viewportWidth, viewportHeight, shiftX = 0) {
  const vw = Math.max(1, Number(viewportWidth) || 1)
  const vh = Math.max(1, Number(viewportHeight) || 1)
  return {
    x: (Number(rect?.x) + Number(shiftX) * vw) / vw,
    y: Number(rect?.y) / vh,
    w: Number(rect?.w) / vw,
    h: Number(rect?.h) / vh,
  }
}

export function resolvePhotoPadding(input) {
  return resolvePhotoComposition(input).padding
}
