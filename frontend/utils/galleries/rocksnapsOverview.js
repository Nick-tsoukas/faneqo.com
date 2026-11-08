/**
 * Gallery-archive label. The server decides whether a card is on RockSnaps.
 * Missing state means this band is not the authorized photographer.
 */
export function rocksnapsOverviewLabel(item) {
  const state = item?.rocksnaps
  if (!state || typeof state.onRockSnaps !== 'boolean') return ''
  return state.onRockSnaps ? 'On RockSnaps' : 'Not on RockSnaps'
}
