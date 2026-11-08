import { CHROME_HIERARCHICAL, PURE_VIEW_A, PURE_VIEW_B } from '../living-gallery/livingGalleryChrome.js'
import { OPTICAL_AUTO } from '../core/photoComposition.js'
import { RESIDUE_OFF, residuePresetParams } from '../memory-residue/memoryResiduePresets.js'
import { GALLERY_KIND_SHOW, GALLERY_SIZE_SET } from '../fixtures/galleryContexts.js'
import { SHEET_RAIL, THUMB_NATIVE } from '../living-gallery/livingGalleryThumbnails.js'

export function createLabComparisonState() {
  return {
    pureVariant: PURE_VIEW_A,
    chromeVariant: CHROME_HIERARCHICAL,
    contextOn: true,
    opticalMode: OPTICAL_AUTO,
    opticalOffset: 0,
    matrixSlot: 'portrait-2-3',
    matrixNote: '',
    residuePreset: RESIDUE_OFF,
    transition: 'print',
    residueOnNext: false,
    idleHide: true,
    afterlight: true,
    afterlightStrength: 'B',
    residueParams: null,
    galleryKind: GALLERY_KIND_SHOW,
    gallerySize: GALLERY_SIZE_SET,
    sheetVariant: SHEET_RAIL,
    thumbGeometry: THUMB_NATIVE,
    sheetAutoRecede: false,
  }
}

export function labResidueParams(state) {
  const preset = residuePresetParams(state?.residuePreset)
  if (!preset) return null
  return { ...preset, ...(state?.residueParams || {}) }
}

export { PURE_VIEW_A, PURE_VIEW_B, RESIDUE_OFF, CHROME_HIERARCHICAL }
