/**
 * Dashboard module hierarchy.
 *
 * Artist Pages are the first major product block. Show Mode is the one module
 * allowed to outrank them, and only while a show is genuinely time-sensitive.
 */

export const DASHBOARD_MODULE_ORDER = [
  'artistPages',
  'showMode',
  'fanIntelligence',
  'events',
  'qrCodes',
  'teamAccess',
]

/**
 * @param {{ isLive?: boolean } | null} status
 *   Canonical show-mode status as published by ShowModeCard.
 *   Scheduled leftover is not a dashboard-priority state.
 */
export function showModeTakesPriority(status) {
  return !!status?.isLive
}

export function dashboardModuleOrder(status) {
  if (!showModeTakesPriority(status)) return [...DASHBOARD_MODULE_ORDER]

  const rest = DASHBOARD_MODULE_ORDER.filter(
    (key) => key !== 'showMode' && key !== 'artistPages'
  )
  return ['showMode', 'artistPages', ...rest]
}
