/**
 * Canonical Faneqo brand configuration.
 *
 * Single source of truth shared by the PWA icon generator, favicon generator,
 * iOS splash generator, and (where practical) the wordmark generator.
 *
 * Colours are the EXACT homepage values. Tailwind only uses `theme.extend`, so
 * the default palette stands for pink/fuchsia/purple/cyan/emerald. The app
 * shell background is `#000` (see manifest background_color + bg-black usage);
 * icons use a slightly lifted near-black so the radial glows read as premium.
 */
const BRAND = {
  name: 'Faneqo',
  tagline: 'Music-first fan connection',
  colors: {
    background: '#0a0a0f', // premium near-black for full-bleed icon/splash
    black: '#000000', // pure app-shell black (manifest background_color)
    pink: '#f472b6', // pink-400
    fuchsia: '#e879f9', // fuchsia-400
    purple: '#c084fc', // purple-400
    cyan: '#67e8f9', // cyan-300
    emerald: '#6ee7b7', // emerald-300
    white: '#ffffff',
  },
  // Manifest values (icons should harmonise with these; not changed here).
  manifest: {
    theme_color: '#FF00FF', // current production value (left untouched)
    background_color: '#000000',
  },
}

// ── Colour helpers ─────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
}
function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b)
  const r = Math.round(A.r + (B.r - A.r) * t)
  const g = Math.round(A.g + (B.g - A.g) * t)
  const bl = Math.round(A.b + (B.b - A.b) * t)
  return `rgb(${r},${g},${bl})`
}
function rgba(hex, a) {
  const c = hexToRgb(hex)
  return `rgba(${c.r},${c.g},${c.b},${a})`
}

module.exports = { BRAND, hexToRgb, mix, rgba }
