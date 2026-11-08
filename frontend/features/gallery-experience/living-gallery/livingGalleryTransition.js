/**
 * Gallery Page → Living Gallery transition experiments.
 * Founder chooses. Nothing here is APPROVED V1.
 *
 * print      — the photograph enlarges from its page bounds and returns there
 * hold       — the photograph stays; the room leaves
 * afterimage — print travel + Memory Residue (MR-B) on the threshold
 */

import { RESIDUE_EXPOSURE } from '../memory-residue/memoryResiduePresets.js'

export const GX_PRINT = 'print'
export const GX_HOLD = 'hold'
export const GX_AFTERIMAGE = 'afterimage'

export const GALLERY_TRANSITIONS = Object.freeze([
  Object.freeze({
    id: GX_PRINT,
    name: 'Print',
    thesis: 'The same photograph enlarges into the room and returns to its page.',
    showHide: 'zoom',
    openMs: 440,
    closeMs: 320,
    residue: false,
    residuePreset: 'off',
  }),
  Object.freeze({
    id: GX_HOLD,
    name: 'Hold',
    thesis: 'The photograph does not travel. The world around it goes away.',
    showHide: 'fade',
    openMs: 260,
    closeMs: 200,
    residue: false,
    residuePreset: 'off',
  }),
  Object.freeze({
    id: GX_AFTERIMAGE,
    name: 'Afterimage',
    thesis: 'The photograph travels, and a ghost of it lingers.',
    showHide: 'zoom',
    openMs: 480,
    closeMs: 360,
    residue: true,
    residuePreset: RESIDUE_EXPOSURE,
  }),
])

export function resolveGalleryTransition(id) {
  const key = String(id || '').trim().toLowerCase()
  return GALLERY_TRANSITIONS.find((row) => row.id === key) || GALLERY_TRANSITIONS[0]
}

export function galleryTransitionIds() {
  return GALLERY_TRANSITIONS.map((row) => row.id)
}
