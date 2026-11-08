/**
 * Routes where app chrome (mobile header / bottom nav / extra padding)
 * should get out of the way of a full-screen composer or thread.
 */
export function isImmersiveMessagesPath(path) {
  const p = String(path || '').split('?')[0]
  return (
    p === '/messages/compose' ||
    /^\/messages\/inbox\//.test(p) ||
    /^\/fan\/messages\/[^/]+/.test(p)
  )
}

/**
 * Inbox / Sent workspace routes that own the viewport below global nav.
 * These handle their own mobile bottom-nav inset — do not also pad the layout.
 */
export function isMessagesWorkspacePath(path) {
  const p = String(path || '').split('?')[0]
  return (
    p === '/messages' ||
    /^\/messages\/inbox(\/|$)/.test(p) ||
    p === '/fan/messages' ||
    /^\/fan\/messages(\/|$)/.test(p)
  )
}
