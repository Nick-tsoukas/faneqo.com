/**
 * Attendee ordinal copy. Viewer.showOrdinal is backend truth only.
 */

export function formatShowOrdinal(value) {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) return null
  if (n === 1) return 'FIRST'
  const mod100 = n % 100
  const mod10 = n % 10
  let suffix = 'TH'
  if (mod100 < 11 || mod100 > 13) {
    if (mod10 === 1) suffix = 'ST'
    else if (mod10 === 2) suffix = 'ND'
    else if (mod10 === 3) suffix = 'RD'
  }
  return `${n}${suffix}`
}

export function yourShowOrdinalCopy({ showOrdinal, artistName } = {}) {
  const artist = String(artistName || '').trim()
  const label = artist || 'THIS ARTIST'
  const n = Number(showOrdinal)
  if (!Number.isInteger(n) || n < 1) return null
  if (n === 1) return `YOUR FIRST ${label} SHOW`
  return `YOUR ${formatShowOrdinal(n)} ${label} SHOW`
}

export function yourShowOrdinalSentence({ showOrdinal, artistName } = {}) {
  const artist = String(artistName || '').trim() || 'this artist'
  const n = Number(showOrdinal)
  if (!Number.isInteger(n) || n < 1) return null
  if (n === 1) return `Your first ${artist} show`
  const token = formatShowOrdinal(n)
  return token ? `Your ${token.toLowerCase()} ${artist} show` : null
}
