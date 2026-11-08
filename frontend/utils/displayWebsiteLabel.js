/**
 * Display-only website label. Never mutate href or stored URL.
 * Custom non-URL labels win. Query/hash never appear in the label.
 */

function parseForDisplay(raw) {
  const value = String(raw || '').trim()
  if (!value) return null
  try {
    return new URL(value)
  } catch {
    try {
      return new URL(`https://${value}`)
    } catch {
      return null
    }
  }
}

function looksLikeUrl(value) {
  const raw = String(value || '').trim()
  if (!raw || /\s/.test(raw)) return false
  if (/^(https?:)?\/\//i.test(raw) || /^www\./i.test(raw)) return true
  if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}([/?#].*)?$/i.test(raw)) return false
  const parsed = parseForDisplay(raw)
  return Boolean(parsed?.hostname && parsed.hostname.includes('.'))
}

function hostPathLabel(parsed) {
  const host = String(parsed.hostname || '').replace(/^www\./i, '')
  if (!host) return ''
  const path = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '')
  return `${host}${path}`
}

export function displayWebsiteLabel(href, customText) {
  const custom = String(customText || '').trim()
  if (custom && !looksLikeUrl(custom)) return custom

  const source = looksLikeUrl(custom) ? custom : href
  const parsed = parseForDisplay(source)
  const label = parsed ? hostPathLabel(parsed) : ''
  if (label) return label

  const fallback = String(source || custom || href || '').trim()
  if (!fallback || looksLikeUrl(fallback) || /[?#]/.test(fallback)) return 'Official website'
  return fallback
}
