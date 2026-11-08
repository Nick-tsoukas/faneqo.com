/**
 * Map Faneqo string props to official Rive Fit / Alignment enums.
 */
export function resolveFit(Fit, fit) {
  const value = String(fit || 'contain')
  const match = Object.values(Fit).find((item) => item === value)
  return match || Fit.Contain
}

export function resolveAlignment(Alignment, alignment) {
  const value = String(alignment || 'center')
  const match = Object.values(Alignment).find((item) => item === value)
  return match || Alignment.Center
}
