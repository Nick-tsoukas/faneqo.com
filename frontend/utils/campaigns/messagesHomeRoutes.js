/**
 * Artist-facing Messages home routes.
 * Compose still uses the existing campaign composer. Internal tab value
 * `campaigns` remains so history loading does not change.
 */

export function isSentTab(queryTab, initialTab) {
  return queryTab === 'sent'
    || queryTab === 'campaigns'
    || initialTab === 'sent'
    || initialTab === 'campaigns'
}

export function sentMessagesPath(refresh = false) {
  return {
    path: '/messages',
    query: refresh ? { tab: 'sent', refresh: '1' } : { tab: 'sent' },
  }
}

export function allFansComposeTo(bandId, from = 'messages') {
  return {
    path: '/messages/compose',
    query: {
      from,
      audienceType: 'all_fans',
      ...(bandId ? { bandId: String(bandId) } : {}),
    },
  }
}

export function showComposeTo(recapId, bandId, from = 'messages') {
  return {
    path: '/messages/compose',
    query: {
      from,
      audienceType: 'show_attendees',
      recapId: String(recapId),
      channel: 'in_app',
      ...(bandId ? { bandId: String(bandId) } : {}),
    },
  }
}
