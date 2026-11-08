/**
 * Adaptive Editorial Stage — semantic presentation for Living Gallery.
 * Derives stage family from composition orientation. Does not own PhotoSwipe physics.
 */

import {
  PHOTO_LANDSCAPE,
  PHOTO_PORTRAIT,
  PHOTO_SQUARE,
  DEVICE_PHONE,
  DEVICE_DESKTOP,
  DEVICE_ULTRAWIDE,
} from '../core/photoComposition.js'

export const STAGE_MONUMENTAL = 'monumental'
export const STAGE_WIDTH_FIELD = 'width-field'
export const STAGE_PRINT_BALANCE = 'print-balance'

export const CONTEXT_BELOW = 'below-shelf'
export const CONTEXT_ABOVE = 'above-shelf'
export const CONTEXT_NONE = 'none'
/**
 * The two context placements. Both anchor to the photograph's own edges rather
 * than the viewport, which is what makes any display read as composed instead
 * of as a layout that happened to fit.
 *
 * PLATE  — a caption plate at the head of the lower shelf, print width.
 * COLUMN — an editorial column beside a height-bound print.
 */
export const CONTEXT_PLATE = 'caption-plate'
export const CONTEXT_COLUMN = 'context-column'

/**
 * Height of the lower shelf's fixed parts. The caption plate and the action
 * row are always in the shelf; the contact sheet joins them only when the
 * leftover field can hold all three without reaching the photograph.
 */
export const SHELF_PLATE_H = 72
export const SHELF_BAR_H = 56
export const SHELF_SHEET_H = 76
export const SHELF_SHEET_H_LARGE = 104

export const STAGE_CINEMATIC = 'cinematic'
export const STAGE_EXHIBITION = 'exhibition'
export const STAGE_EDITORIAL = 'editorial-split'

export const RAIL_DOCK_UP = 'dock-up'

export const DENSITY_QUIET = 'quiet'
export const DENSITY_BALANCED = 'balanced'
export const DENSITY_RICH = 'rich'

export const EMPHASIS_MAX = 'max'
export const EMPHASIS_AGGRESSIVE = 'aggressive'
export const EMPHASIS_DIGNIFIED = 'dignified'

/**
 * Resolve editorial stage semantics from a composition result.
 * @param {object} composition — resolvePhotoComposition output
 * @param {{ contextOn?: boolean, chromeOn?: boolean, overlaysBusy?: boolean }} options
 */
export function resolveEditorialStage(composition = {}, options = {}) {
  const orientation = composition.orientation || PHOTO_LANDSCAPE
  const device = composition.device || DEVICE_PHONE
  const topBreath = Math.max(0, Number(composition.topBreath) || 0)
  const bottomBreath = Math.max(0, Number(composition.bottomBreath) || 0)
  const contextOn = options.contextOn !== false
  const overlaysBusy = options.overlaysBusy === true
  const phone = device === DEVICE_PHONE
  const large = device === DEVICE_DESKTOP || device === DEVICE_ULTRAWIDE

  const hasColumn = Number(composition.contextColumn) > 0

  let stageAlignment = STAGE_WIDTH_FIELD
  let imageEmphasis = EMPHASIS_AGGRESSIVE
  let contextDensity = DENSITY_QUIET

  if (orientation === PHOTO_PORTRAIT) {
    stageAlignment = hasColumn ? STAGE_EDITORIAL : STAGE_MONUMENTAL
    imageEmphasis = EMPHASIS_MAX
    contextDensity = hasColumn ? DENSITY_RICH : DENSITY_BALANCED
  } else if (orientation === PHOTO_SQUARE) {
    stageAlignment = hasColumn ? STAGE_EDITORIAL : (large ? STAGE_EXHIBITION : STAGE_PRINT_BALANCE)
    imageEmphasis = EMPHASIS_DIGNIFIED
    contextDensity = hasColumn ? DENSITY_RICH : DENSITY_BALANCED
  } else {
    stageAlignment = large ? STAGE_CINEMATIC : STAGE_WIDTH_FIELD
    imageEmphasis = EMPHASIS_AGGRESSIVE
    contextDensity = DENSITY_QUIET
  }

  /*
   * The lower shelf is one composed block anchored to the bottom edge: caption
   * plate, then the contact sheet where the composition reserved room for it,
   * then the actions. Anchoring the plate directly under the print instead
   * left a band of unexplained black between the plate and the controls — the
   * single strongest reason the viewer still read as a lightbox rather than as
   * a composed object.
   */
  const railResident = composition.railResident === true
  const plateHeight = Number(composition.shelf?.plate) || 0

  const contextPlacement = hasColumn ? CONTEXT_COLUMN : CONTEXT_PLATE
  const showContext = Boolean(contextOn && !overlaysBusy)

  return {
    orientation,
    stageAlignment,
    contextPlacement: showContext ? contextPlacement : CONTEXT_NONE,
    railPlacement: RAIL_DOCK_UP,
    railResident,
    contextDensity,
    imageEmphasis,
    // The plate lives inside the dock; only the column is an absolute region.
    showStageIdentity: showContext && hasColumn,
    stageIdentityRegion: showContext && hasColumn ? CONTEXT_COLUMN : CONTEXT_NONE,
    showPlate: Boolean(contextOn && !hasColumn && plateHeight > 0),
    // Place / date is the first thing a tight shelf gives up.
    plateDense: plateHeight >= SHELF_PLATE_H,
    phone,
    topBreath,
    bottomBreath,
  }
}

/**
 * CSS custom properties for stage identity placement relative to the photograph.
 */
export function editorialStageStyle(composition = {}, stage = {}) {
  const r = composition.imageRect || { x: 0, y: 0, w: 0, h: 0 }
  const vw = Math.max(1, Number(composition.stageWidth) || 1)
  const vh = Math.max(1, Number(composition.stageHeight) || 1)
  const region = stage.stageIdentityRegion || CONTEXT_NONE
  const belowTop = Math.round(Number(r.y) + Number(r.h) + 10)
  const aboveBottom = Math.round(Math.max(0, vh - Number(r.y) + 8))
  const col = composition.columnRect

  /*
   * The shelf hangs on the photograph's own column on a large display, and on
   * the shared optical edge on a phone where the print is already full-bleed.
   * Measuring the shelf from the print is what stops a large display from
   * reading as browser furniture around an image.
   */
  const phonePrint = composition.device === DEVICE_PHONE
  const shelfLeft = phonePrint ? null : Math.round(r.x)
  const shelfWidth = phonePrint ? null : Math.round(r.w)

  return {
    '--fq-lg-stage-photo-left': `${Math.round(r.x)}px`,
    '--fq-lg-stage-photo-top': `${Math.round(r.y)}px`,
    '--fq-lg-stage-photo-width': `${Math.round(r.w)}px`,
    '--fq-lg-stage-photo-height': `${Math.round(r.h)}px`,
    '--fq-lg-stage-photo-right': `${Math.round(Math.max(0, vw - r.x - r.w))}px`,
    '--fq-lg-stage-below-top': `${belowTop}px`,
    '--fq-lg-stage-above-bottom': `${aboveBottom}px`,
    '--fq-lg-stage-region': region,
    '--fq-lg-stage-col-left': col ? `${Math.round(col.x)}px` : '0px',
    '--fq-lg-stage-col-width': col ? `${Math.round(col.w)}px` : '0px',
    '--fq-lg-shelf-left': shelfLeft == null
      ? 'calc(env(safe-area-inset-left, 0px) + var(--fq-lg-edge-x, 16px))'
      : `${shelfLeft}px`,
    '--fq-lg-shelf-right': shelfWidth == null
      ? 'calc(env(safe-area-inset-right, 0px) + var(--fq-lg-edge-x, 16px))'
      : `${Math.round(Math.max(0, vw - r.x - r.w))}px`,
  }
}
