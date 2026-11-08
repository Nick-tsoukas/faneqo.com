/**
 * Memory Residue experiment presets.
 * Signature direction: MR-B Exposure.
 * Not product UI. Default remains off.
 */

export const RESIDUE_OFF = 'off'
export const RESIDUE_RETINAL = 'MR-A'
export const RESIDUE_EXPOSURE = 'MR-B'
export const RESIDUE_CHEMICAL = 'MR-C'
export const RESIDUE_SIGNATURE = RESIDUE_EXPOSURE

export const MEMORY_RESIDUE_PRESETS = Object.freeze({
  [RESIDUE_RETINAL]: Object.freeze({
    id: RESIDUE_RETINAL,
    name: 'Retinal',
    role: 'supporting',
    decay: 0.84,
    persistence: 0.32,
    lumaThreshold: 0.26,
    edge: 0.14,
    colorRetention: 0.08,
    desaturation: 0.88,
    displace: 0.0005,
    noise: 0.006,
    durationMs: 680,
  }),
  [RESIDUE_EXPOSURE]: Object.freeze({
    id: RESIDUE_EXPOSURE,
    name: 'Exposure',
    role: 'signature',
    decay: 0.925,
    persistence: 0.54,
    lumaThreshold: 0.11,
    edge: 0.075,
    colorRetention: 0.40,
    desaturation: 0.34,
    displace: 0.0010,
    noise: 0.010,
    durationMs: 1280,
  }),
  [RESIDUE_CHEMICAL]: Object.freeze({
    id: RESIDUE_CHEMICAL,
    name: 'Chemical',
    role: 'experimental',
    decay: 0.90,
    persistence: 0.44,
    lumaThreshold: 0.17,
    edge: 0.16,
    colorRetention: 0.18,
    desaturation: 0.72,
    displace: 0.0036,
    noise: 0.022,
    durationMs: 1100,
  }),
})

export function residuePresetParams(id) {
  return MEMORY_RESIDUE_PRESETS[id] ? { ...MEMORY_RESIDUE_PRESETS[id] } : null
}

export function isResiduePreset(id) {
  return Boolean(MEMORY_RESIDUE_PRESETS[id])
}
