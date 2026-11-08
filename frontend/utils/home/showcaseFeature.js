/**
 * Homepage artist-feature presentation.
 * Crops and lines live here so an artist's saved page settings stay untouched.
 */

/** Spoken name in the explore link. Shannon is the only first-name shortening. */
export function exploreArtistLabel(name) {
  const clean = String(name || '').trim()
  if (!clean) return 'Explore the page'
  const spoken = clean.toLowerCase() === 'shannon tehya' ? 'Shannon' : clean
  return `Explore ${spoken}’s page`
}

/**
 * Cover and avatar crops.
 *
 * Shannon’s file is a real 800×1000 portrait. Moon Dough’s is a 2047×1151
 * stage photo — cover-cropped, not stretched. Emerge’s only file is a square
 * poster with the word EMERGE burned across the band and blurred bars above
 * and below. The rectangle is the face band above that wordmark.
 */
export const SHOWCASE_PRINTS = {
  shannontehya: {
    ratio: '4 / 5',
    fit: 'cover',
    // Source is already a 4/5 portrait. These only shift the window when the
    // frame is shorter than the file: face first, guitar kept on the right.
    position: '58% 22%',
    mobilePosition: '50% 12%',
    avatarPosition: '50% 12%',
  },
  moondough: {
    ratio: '3 / 2',
    fit: 'cover',
    position: '64% 36%',
    avatarPosition: '64% 38%',
  },
  emerge: {
    ratio: '1000 / 270',
    fit: 'rect',
    crop: { x: 180 / 1300, y: 250 / 1300, w: 1000 / 1300, h: 270 / 1300 },
    avatarCrop: { x: 380 / 1300, y: 250 / 1300, w: 280 / 1300, h: 280 / 1300 },
  },
}

export function showcasePrint(slug) {
  const key = String(slug || '').trim().toLowerCase()
  return SHOWCASE_PRINTS[key] || {
    ratio: '4 / 5',
    fit: 'cover',
    position: 'center 30%',
    avatarPosition: 'center 30%',
  }
}

/** Absolute placement that maps a source rectangle onto the frame. No rescale stretch. */
export function cropImageStyle(crop) {
  if (!crop?.w || !crop?.h) return null
  return {
    width: `${100 / crop.w}%`,
    height: `${100 / crop.h}%`,
    left: `${(-crop.x / crop.w) * 100}%`,
    top: `${(-crop.y / crop.h) * 100}%`,
  }
}
