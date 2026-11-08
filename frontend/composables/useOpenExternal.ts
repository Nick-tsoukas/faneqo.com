/**
 * Utility to open URLs in external browser from within PWA
 * Used when PWA scope is restricted and we need to open public pages
 */
export function useOpenExternal() {
  const openExternal = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return { openExternal }
}
