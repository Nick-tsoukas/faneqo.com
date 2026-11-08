/**
 * Advanced Chat UI lab — isolated prototype only.
 * Not part of production Inbox. Campaigns remain at /messages.
 */

/** Force-enable the lab outside `import.meta.dev` (still not in main nav). */
export const FANEQO_CHAT_LAB_ENABLED = false

export function isChatLabEnabled() {
  if (import.meta.dev) return true
  return FANEQO_CHAT_LAB_ENABLED === true
}
