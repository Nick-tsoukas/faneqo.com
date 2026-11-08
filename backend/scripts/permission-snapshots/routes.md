# Route Inventory Report

Generated: 2026-09-12T23:14:31.874Z

**Total Routes:** 483

## API Routes

### api::album

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/albums` | album.find | default | - |
| POST | `/api/albums` | album.create | default | - |
| GET | `/api/albums/:id` | album.findOne | default | - |
| PUT | `/api/albums/:id` | album.update | default | - |
| DELETE | `/api/albums/:id` | album.delete | default | - |

### api::analytics

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/analytics/dashboard-glance` | analytics.dashboardGlance | default | plugin::users-permissions.isAuthenticated |
| GET | `/analytics/event-devices` | analytics.eventDevices | 🔓 PUBLIC | - |
| GET | `/analytics/event-geo` | analytics.eventGeo | 🔓 PUBLIC | - |
| GET | `/analytics/event-rollups` | analytics.eventRollups | 🔓 PUBLIC | - |
| GET | `/analytics/event-sources` | analytics.eventSources | 🔓 PUBLIC | - |
| GET | `/analytics/follows` | analytics.follows | 🔓 PUBLIC | - |
| GET | `/analytics/geo` | analytics.geo | 🔓 PUBLIC | - |
| GET | `/analytics/geo-states` | analytics.geoStates | 🔓 PUBLIC | - |
| GET | `/analytics/pulse` | analytics.pulse | 🔓 PUBLIC | - |
| GET | `/analytics/push/dry-run` | analytics.pushDryRun | 🔓 PUBLIC | - |
| GET | `/analytics/qr-devices` | analytics.qrDevices | 🔓 PUBLIC | - |
| GET | `/analytics/qr-geo` | analytics.qrGeo | 🔓 PUBLIC | - |
| GET | `/analytics/qr-rollups` | analytics.qrRollups | 🔓 PUBLIC | - |
| GET | `/analytics/qr-sources` | analytics.qrSources | 🔓 PUBLIC | - |
| GET | `/analytics/rollups` | analytics.rollups | 🔓 PUBLIC | - |
| GET | `/analytics/transitions` | analytics.transitions | 🔓 PUBLIC | - |
| GET | `/image-proxy` | analytics.imageProxy | 🔓 PUBLIC | - |
| GET | `/pulse/shareables` | shareables.getShareables | 🔓 PUBLIC | - |
| POST | `/pulse/shareables/track` | shareables.trackShare | 🔓 PUBLIC | - |
| GET | `/pulse/whats-hot` | analytics.whatsHot | 🔓 PUBLIC | - |
| POST | `/push/opt-in` | analytics.pushOptIn | default | - |
| GET | `/push/opt-in/status` | analytics.pushOptInStatus | default | - |

### api::artist-fan-relationship

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/artist-fan-relationships/:fanId` | artist-fan-relationship.findOne | default | - |

### api::artist-update

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| PUT | `/api/artist-updates/:id` | artist-update.update | default | - |
| DELETE | `/api/artist-updates/:id` | artist-update.delete | default | - |
| GET | `/artist-updates` | artist-update.listPublic | 🔓 PUBLIC | - |
| POST | `/artist-updates` | artist-update.create | 🔓 PUBLIC | - |
| GET | `/artist-updates/:id` | artist-update.detail | 🔓 PUBLIC | - |
| PATCH | `/artist-updates/:id/detach-recap` | artist-update.detachRecap | 🔓 PUBLIC | - |
| PATCH | `/artist-updates/:id/hide` | artist-update.hide | 🔓 PUBLIC | - |
| GET | `/artist-updates/:id/media/:mediaId` | artist-update.streamMedia | 🔓 PUBLIC | - |
| PATCH | `/artist-updates/:id/restore` | artist-update.restore | 🔓 PUBLIC | - |
| PATCH | `/artist-updates/:id/visibility` | artist-update.updateVisibility | 🔓 PUBLIC | - |
| GET | `/artist-updates/by-slug` | artist-update.bySlug | 🔓 PUBLIC | - |
| GET | `/artist-updates/delivery` | artist-update.delivery | 🔓 PUBLIC | - |
| GET | `/artist-updates/manage` | artist-update.listMine | 🔓 PUBLIC | - |
| POST | `/artist-updates/media` | artist-update.uploadMedia | 🔓 PUBLIC | - |
| GET | `/artist-updates/shows` | artist-update.shows | 🔓 PUBLIC | - |
| GET | `/public/bands/:bandSlug/galleries/:gallerySlug` | artist-update.publicGallery | 🔓 PUBLIC | - |

### api::auth

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/auth/confirm-email` | email-confirmation.confirmEmail | 🔓 PUBLIC | - |

### api::band

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/bands` | band.find | 🔓 PUBLIC | - |
| POST | `/bands` | band.create | default | plugin::users-permissions.isAuthenticated, global::subscription-active, api::band.only-one-band |
| GET | `/bands/:id` | band.findById | 🔓 PUBLIC | - |
| PUT | `/bands/:id` | band.update | default | plugin::users-permissions.isAuthenticated, global::subscription-active, [object Object] |
| DELETE | `/bands/:id` | band.delete | default | plugin::users-permissions.isAuthenticated, global::subscription-active, api::band.owns-band |
| POST | `/bands/:id/invites` | band-team.createInvite | default | plugin::users-permissions.isAuthenticated, api::band.owns-band |
| POST | `/bands/:id/invites/:inviteId/resend` | band-team.resendInvite | default | plugin::users-permissions.isAuthenticated, api::band.owns-band |
| POST | `/bands/:id/invites/:inviteId/revoke` | band-team.revokeInvite | default | plugin::users-permissions.isAuthenticated, api::band.owns-band |
| GET | `/bands/:id/live-signals` | live-signals.getLiveSignals | 🔓 PUBLIC | - |
| POST | `/bands/:id/members/:memberId/remove` | band-team.removeMember | default | plugin::users-permissions.isAuthenticated, api::band.owns-band |
| POST | `/bands/:id/members/:memberId/role` | band-team.updateMemberRole | default | plugin::users-permissions.isAuthenticated, api::band.owns-band |
| POST | `/bands/:id/payments/checkout` | checkout.create | 🔓 PUBLIC | - |
| POST | `/bands/:id/payments/onboard` | payments.onboard | default | plugin::users-permissions.isAuthenticated, api::band.owns-band |
| GET | `/bands/:id/payments/summary` | payments.summary | default | plugin::users-permissions.isAuthenticated, api::band.owns-band |
| GET | `/bands/:id/show-mode` | show-mode.getStatus | default | plugin::users-permissions.isAuthenticated |
| POST | `/bands/:id/show-mode/activate-now` | show-mode.activateNow | default | plugin::users-permissions.isAuthenticated |
| POST | `/bands/:id/show-mode/deactivate` | show-mode.deactivate | default | plugin::users-permissions.isAuthenticated |
| POST | `/bands/:id/show-mode/from-event` | show-mode.activateFromEvent | default | plugin::users-permissions.isAuthenticated |
| POST | `/bands/:id/show-mode/manual` | show-mode.activateManual | default | plugin::users-permissions.isAuthenticated |
| PATCH | `/bands/:id/show-mode/timing` | show-mode.updateTiming | default | plugin::users-permissions.isAuthenticated |
| GET | `/bands/:id/team` | band-team.getTeam | default | plugin::users-permissions.isAuthenticated, api::band.owns-band |
| GET | `/bands/search` | band.search | 🔓 PUBLIC | - |
| GET | `/bands/slug/:slug` | band.findBySlug | 🔓 PUBLIC | - |
| GET | `/health` | health.check | 🔓 PUBLIC | - |
| POST | `/invites/accept` | band-team.acceptInvite | default | plugin::users-permissions.isAuthenticated |
| GET | `/me/band-access` | band-team.getMyAccess | default | plugin::users-permissions.isAuthenticated |

### api::band-external-account

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/band-external-accounts` | band-external-account.find | 🔓 PUBLIC | - |
| POST | `/band-external-accounts` | band-external-account.create | 🔓 PUBLIC | - |
| GET | `/band-external-accounts/:id` | band-external-account.findOne | 🔓 PUBLIC | - |
| PUT | `/band-external-accounts/:id` | band-external-account.update | 🔓 PUBLIC | - |
| DELETE | `/band-external-accounts/:id` | band-external-account.delete | 🔓 PUBLIC | - |

### api::band-external-metric

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/band-external-metrics` | band-external-metric.find | 🔓 PUBLIC | - |
| POST | `/band-external-metrics` | band-external-metric.create | 🔓 PUBLIC | - |
| GET | `/band-external-metrics/:id` | band-external-metric.findOne | 🔓 PUBLIC | - |
| PUT | `/band-external-metrics/:id` | band-external-metric.update | 🔓 PUBLIC | - |
| DELETE | `/band-external-metrics/:id` | band-external-metric.delete | 🔓 PUBLIC | - |
| GET | `/band-external-metrics/latest` | band-external-metric.latest | 🔓 PUBLIC | - |
| POST | `/band-external-metrics/upsert` | band-external-metric.upsert | 🔓 PUBLIC | - |

### api::band-insight-daily

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/band-insights-daily` | band-insight-daily.find | default | - |
| POST | `/api/band-insights-daily` | band-insight-daily.create | default | - |
| GET | `/api/band-insights-daily/:id` | band-insight-daily.findOne | default | - |
| PUT | `/api/band-insights-daily/:id` | band-insight-daily.update | default | - |
| DELETE | `/api/band-insights-daily/:id` | band-insight-daily.delete | default | - |
| GET | `/band-insights-daily/compute` | band-insight-daily.compute | 🔓 PUBLIC | - |
| GET | `/band-insights-daily/debug` | band-insight-daily.debug | 🔓 PUBLIC | - |
| GET | `/muse` | band-insight-daily.muse | 🔓 PUBLIC | - |
| GET | `/muse/backfill` | band-insight-daily.backfill | 🔓 PUBLIC | - |
| GET | `/muse/insights` | band-insight-daily.insightsV2 | 🔓 PUBLIC | - |

### api::band-invite

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/band-invites` | band-invite.find | default | - |
| POST | `/api/band-invites` | band-invite.create | default | - |
| GET | `/api/band-invites/:id` | band-invite.findOne | default | - |
| PUT | `/api/band-invites/:id` | band-invite.update | default | - |
| DELETE | `/api/band-invites/:id` | band-invite.delete | default | - |

### api::band-member

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/band-members` | band-member.find | default | - |
| POST | `/api/band-members` | band-member.create | default | - |
| GET | `/api/band-members/:id` | band-member.findOne | default | - |
| PUT | `/api/band-members/:id` | band-member.update | default | - |
| DELETE | `/api/band-members/:id` | band-member.delete | default | - |

### api::band-page-view

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/band-page-views` | band-page-view.find | default | - |
| POST | `/api/band-page-views` | band-page-view.create | default | - |
| GET | `/api/band-page-views/:id` | band-page-view.findOne | default | - |
| PUT | `/api/band-page-views/:id` | band-page-view.update | default | - |
| DELETE | `/api/band-page-views/:id` | band-page-view.delete | default | - |

### api::band-share

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/band-shares` | band-share.find | default | - |
| POST | `/api/band-shares` | band-share.create | default | - |
| GET | `/api/band-shares/:id` | band-share.findOne | default | - |
| PUT | `/api/band-shares/:id` | band-share.update | default | - |
| DELETE | `/api/band-shares/:id` | band-share.delete | default | - |
| POST | `/band-shares/record` | band-share.record | 🔓 PUBLIC | - |

### api::band-ui-event

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/band-ui-events` | band-ui-event.find | default | - |
| POST | `/api/band-ui-events` | band-ui-event.create | default | - |
| GET | `/api/band-ui-events/:id` | band-ui-event.findOne | default | - |
| PUT | `/api/band-ui-events/:id` | band-ui-event.update | default | - |
| DELETE | `/api/band-ui-events/:id` | band-ui-event.delete | default | - |
| POST | `/band-ui-events/track` | band-ui-event.track | default | - |

### api::conversation

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| POST | `/api/conversations` | conversation.create | default | - |
| PUT | `/api/conversations/:id` | conversation.update | default | - |
| DELETE | `/api/conversations/:id` | conversation.delete | default | - |
| GET | `/conversations` | conversation.list | 🔓 PUBLIC | - |
| GET | `/conversations/:id` | conversation.detail | 🔓 PUBLIC | - |
| POST | `/conversations/:id/block` | conversation.block | 🔓 PUBLIC | - |
| POST | `/conversations/:id/media` | conversation.uploadMedia | 🔓 PUBLIC | - |
| GET | `/conversations/:id/messages` | conversation.messages | 🔓 PUBLIC | - |
| POST | `/conversations/:id/messages` | conversation.send | 🔓 PUBLIC | - |
| GET | `/conversations/:id/messages/:messageId/media/:mediaId` | conversation.streamMedia | 🔓 PUBLIC | - |
| POST | `/conversations/:id/read` | conversation.markRead | 🔓 PUBLIC | - |
| POST | `/conversations/:id/unblock` | conversation.unblock | 🔓 PUBLIC | - |
| GET | `/conversations/dm-candidates` | conversation.dmCandidates | 🔓 PUBLIC | - |
| GET | `/conversations/media/delivery` | conversation.mediaDelivery | 🔓 PUBLIC | - |
| GET | `/conversations/requests` | conversation.listRequests | 🔓 PUBLIC | - |
| GET | `/conversations/requests/:id` | conversation.requestDetail | 🔓 PUBLIC | - |
| POST | `/conversations/requests/:id/accept` | conversation.acceptRequest | 🔓 PUBLIC | - |
| POST | `/conversations/requests/:id/decline` | conversation.declineRequest | 🔓 PUBLIC | - |
| POST | `/conversations/start` | conversation.start | 🔓 PUBLIC | - |
| GET | `/conversations/unread-count` | conversation.unreadCount | 🔓 PUBLIC | - |

### api::conversation-message

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/conversation-messages` | conversation-message.find | default | - |
| POST | `/api/conversation-messages` | conversation-message.create | default | - |
| GET | `/api/conversation-messages/:id` | conversation-message.findOne | default | - |
| PUT | `/api/conversation-messages/:id` | conversation-message.update | default | - |
| DELETE | `/api/conversation-messages/:id` | conversation-message.delete | default | - |

### api::conversation-participant

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/conversation-participants` | conversation-participant.find | default | - |
| POST | `/api/conversation-participants` | conversation-participant.create | default | - |
| GET | `/api/conversation-participants/:id` | conversation-participant.findOne | default | - |
| PUT | `/api/conversation-participants/:id` | conversation-participant.update | default | - |
| DELETE | `/api/conversation-participants/:id` | conversation-participant.delete | default | - |

### api::conversation-request

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/conversation-requests` | conversation-request.find | default | - |
| POST | `/api/conversation-requests` | conversation-request.create | default | - |
| GET | `/api/conversation-requests/:id` | conversation-request.findOne | default | - |
| PUT | `/api/conversation-requests/:id` | conversation-request.update | default | - |
| DELETE | `/api/conversation-requests/:id` | conversation-request.delete | default | - |

### api::email-event

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| POST | `/email-events/resend` | email-event.resend | 🔓 PUBLIC | - |

### api::event

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/events` | event.find | 🔓 PUBLIC | - |
| POST | `/events` | event.create | default | plugin::users-permissions.isAuthenticated |
| GET | `/events/:id` | event.findOne | 🔓 PUBLIC | - |
| PUT | `/events/:id` | event.update | default | plugin::users-permissions.isAuthenticated |
| DELETE | `/events/:id` | event.delete | default | plugin::users-permissions.isAuthenticated |

### api::event-page-view

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/event-page-views` | event-page-view.find | default | - |
| POST | `/api/event-page-views` | event-page-view.create | default | - |
| GET | `/api/event-page-views/:id` | event-page-view.findOne | default | - |
| PUT | `/api/event-page-views/:id` | event-page-view.update | default | - |
| DELETE | `/api/event-page-views/:id` | event-page-view.delete | default | - |
| POST | `/event-page-views/track` | event-page-view.track | 🔓 PUBLIC | - |

### api::fan

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/fans` | fan.find | default | - |
| POST | `/api/fans` | fan.create | default | - |
| GET | `/api/fans/:id` | fan.findOne | default | - |
| PUT | `/api/fans/:id` | fan.update | default | - |
| DELETE | `/api/fans/:id` | fan.delete | default | - |
| GET | `/fans/:fanId/detail` | fan.fanDetail | default | plugin::users-permissions.isAuthenticated |
| POST | `/fans/:fanId/remove-from-list` | fan.removeFromList | default | plugin::users-permissions.isAuthenticated |
| POST | `/fans/add` | fan.add | default | plugin::users-permissions.isAuthenticated |
| GET | `/fans/export` | fan.export | default | plugin::users-permissions.isAuthenticated |
| POST | `/fans/import` | fan.import | default | plugin::users-permissions.isAuthenticated |
| GET | `/fans/my-fans` | fan.myFans | default | plugin::users-permissions.isAuthenticated |
| GET | `/fans/my-fans-analytics` | fan.myFansAnalytics | default | plugin::users-permissions.isAuthenticated |
| POST | `/fans/resubscribe` | fan.resubscribe | 🔓 PUBLIC | - |
| POST | `/fans/subscribe` | fan.subscribe | 🔓 PUBLIC | - |
| POST | `/fans/unsubscribe` | fan.unsubscribe | 🔓 PUBLIC | - |

### api::fan-account

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/fan-account/artists` | fan-account.artists | 🔓 PUBLIC | - |
| POST | `/fan-account/artists/:bandId/follow` | fan-account.follow | 🔓 PUBLIC | - |
| POST | `/fan-account/artists/:bandId/unfollow` | fan-account.unfollow | 🔓 PUBLIC | - |
| POST | `/fan-account/avatar` | fan-account.uploadAvatar | 🔓 PUBLIC | - |
| DELETE | `/fan-account/avatar` | fan-account.deleteAvatar | 🔓 PUBLIC | - |
| GET | `/fan-account/conversations` | fan-account.listConversations | 🔓 PUBLIC | - |
| GET | `/fan-account/conversations/unread-count` | fan-account.conversationsUnreadCount | 🔓 PUBLIC | - |
| POST | `/fan-account/dismiss` | fan-account.dismiss | 🔓 PUBLIC | - |
| POST | `/fan-account/eligibility` | fan-account.eligibility | 🔓 PUBLIC | - |
| GET | `/fan-account/me` | fan-account.me | 🔓 PUBLIC | - |
| GET | `/fan-account/message-requests` | fan-account.listMessageRequests | 🔓 PUBLIC | - |
| POST | `/fan-account/message-requests` | fan-account.createMessageRequest | 🔓 PUBLIC | - |
| GET | `/fan-account/message-status` | fan-account.messageStatus | 🔓 PUBLIC | - |
| GET | `/fan-account/profile` | fan-account.getProfile | 🔓 PUBLIC | - |
| PATCH | `/fan-account/profile` | fan-account.patchProfile | 🔓 PUBLIC | - |
| POST | `/fan-account/profile` | fan-account.updateProfile | 🔓 PUBLIC | - |
| POST | `/fan-account/prompt-shown` | fan-account.promptShown | 🔓 PUBLIC | - |
| POST | `/fan-account/request-link` | fan-account.requestLink | 🔓 PUBLIC | - |
| POST | `/fan-account/verify` | fan-account.verify | 🔓 PUBLIC | - |

### api::fan-account-link

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/fan-account-links` | fan-account-link.find | default | - |
| POST | `/api/fan-account-links` | fan-account-link.create | default | - |
| GET | `/api/fan-account-links/:id` | fan-account-link.findOne | default | - |
| PUT | `/api/fan-account-links/:id` | fan-account-link.update | default | - |
| DELETE | `/api/fan-account-links/:id` | fan-account-link.delete | default | - |

### api::fan-interaction

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/fan-interactions` | fan-interaction.find | default | - |
| POST | `/api/fan-interactions` | fan-interaction.create | default | - |
| GET | `/api/fan-interactions/:id` | fan-interaction.findOne | default | - |
| PUT | `/api/fan-interactions/:id` | fan-interaction.update | default | - |
| DELETE | `/api/fan-interactions/:id` | fan-interaction.delete | default | - |
| GET | `/fan-interactions/breakdown/:bandId` | fan-interaction.breakdown | default | - |
| POST | `/fan-interactions/check-in` | fan-interaction.checkIn | 🔓 PUBLIC | - |
| GET | `/fan-interactions/check-in-status` | fan-interaction.checkInStatus | 🔓 PUBLIC | - |
| GET | `/fan-interactions/recent/:bandId` | fan-interaction.recent | default | - |
| GET | `/fan-interactions/session/:bandId` | fan-interaction.session | default | - |
| POST | `/fan-interactions/track` | fan-interaction.track | 🔓 PUBLIC | - |

### api::fan-moment

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/fan-moments` | fan-moment.find | default | - |
| POST | `/api/fan-moments` | fan-moment.create | default | - |
| GET | `/api/fan-moments/:id` | fan-moment.findOne | default | - |
| PUT | `/api/fan-moments/:id` | fan-moment.update | default | - |
| DELETE | `/api/fan-moments/:id` | fan-moment.delete | default | - |
| GET | `/fan-moments/active` | fan-moment.active | 🔓 PUBLIC | - |
| GET | `/fan-moments/auto-active` | fan-moment.autoActive | 🔓 PUBLIC | - |
| POST | `/fan-moments/earn` | fan-moment.earn | 🔓 PUBLIC | - |
| POST | `/fan-moments/evaluate-auto` | fan-moment.evaluateAuto | 🔓 PUBLIC | - |
| POST | `/fan-moments/evaluate-recap` | fan-moment.evaluateRecap | 🔓 PUBLIC | - |
| GET | `/fan-moments/recap-active` | fan-moment.recapActive | 🔓 PUBLIC | - |
| POST | `/fan-moments/shared` | fan-moment.shared | 🔓 PUBLIC | - |
| GET | `/fan-moments/system-status` | fan-moment.systemStatus | 🔓 PUBLIC | - |

### api::fan-profile

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/fan-profiles` | fan-profile.find | default | - |
| POST | `/api/fan-profiles` | fan-profile.create | default | - |
| GET | `/api/fan-profiles/:id` | fan-profile.findOne | default | - |
| PUT | `/api/fan-profiles/:id` | fan-profile.update | default | - |
| DELETE | `/api/fan-profiles/:id` | fan-profile.delete | default | - |

### api::fan-show-attendance

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/fan-show-attendances` | fan-show-attendance.find | default | - |
| POST | `/api/fan-show-attendances` | fan-show-attendance.create | default | - |
| GET | `/api/fan-show-attendances/:id` | fan-show-attendance.findOne | default | - |
| PUT | `/api/fan-show-attendances/:id` | fan-show-attendance.update | default | - |
| DELETE | `/api/fan-show-attendances/:id` | fan-show-attendance.delete | default | - |

### api::fan-visitor

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/fan-visitors` | fan-visitor.find | default | - |
| POST | `/api/fan-visitors` | fan-visitor.create | default | - |
| GET | `/api/fan-visitors/:id` | fan-visitor.findOne | default | - |
| PUT | `/api/fan-visitors/:id` | fan-visitor.update | default | - |
| DELETE | `/api/fan-visitors/:id` | fan-visitor.delete | default | - |
| POST | `/fan-identity/session` | fan-visitor.session | 🔓 PUBLIC | - |

### api::feature-enrollment

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/feature-enrollments` | feature-enrollment.find | default | - |
| POST | `/api/feature-enrollments` | feature-enrollment.create | default | - |
| GET | `/api/feature-enrollments/:id` | feature-enrollment.findOne | default | - |
| PUT | `/api/feature-enrollments/:id` | feature-enrollment.update | default | - |
| DELETE | `/api/feature-enrollments/:id` | feature-enrollment.delete | default | - |

### api::funtest

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/funtests` | funtest.find | default | - |
| POST | `/api/funtests` | funtest.create | default | - |
| GET | `/api/funtests/:id` | funtest.findOne | default | - |
| PUT | `/api/funtests/:id` | funtest.update | default | - |
| DELETE | `/api/funtests/:id` | funtest.delete | default | - |

### api::howtovideo

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/howtovideos` | howtovideo.find | default | - |
| POST | `/api/howtovideos` | howtovideo.create | default | - |
| GET | `/api/howtovideos/:id` | howtovideo.findOne | default | - |
| PUT | `/api/howtovideos/:id` | howtovideo.update | default | - |
| DELETE | `/api/howtovideos/:id` | howtovideo.delete | default | - |

### api::image-proxy

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/image-proxies` | image-proxy.find | default | - |
| POST | `/api/image-proxies` | image-proxy.create | default | - |
| GET | `/api/image-proxies/:id` | image-proxy.findOne | default | - |
| PUT | `/api/image-proxies/:id` | image-proxy.update | default | - |
| DELETE | `/api/image-proxies/:id` | image-proxy.delete | default | - |
| GET | `/image-proxy` | image-proxy.proxy | 🔓 PUBLIC | - |

### api::labs

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/labs/features` | labs.features | 🔓 PUBLIC | - |
| GET | `/labs/integrity` | labs.integrity | 🔓 PUBLIC | - |
| GET | `/labs/relationship` | labs.artistFanProgression | 🔓 PUBLIC | - |
| GET | `/labs/relationship-fans` | labs.relationshipFans | 🔓 PUBLIC | - |
| GET | `/labs/relationships` | labs.relationshipTimeline | 🔓 PUBLIC | - |
| GET | `/labs/status` | labs.status | 🔓 PUBLIC | - |

### api::link-click

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/link-clicks` | link-click.find | default | - |
| POST | `/api/link-clicks` | link-click.create | default | - |
| GET | `/api/link-clicks/:id` | link-click.findOne | default | - |
| PUT | `/api/link-clicks/:id` | link-click.update | default | - |
| DELETE | `/api/link-clicks/:id` | link-click.delete | default | - |
| GET | `/link-clicks/band/:bandId` | link-click.getBandClicks | default | - |
| POST | `/link-clicks/track` | link-click.trackClick | default | - |

### api::marketer

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/marketers` | marketer.find | default | - |
| POST | `/api/marketers` | marketer.create | default | - |
| GET | `/api/marketers/:id` | marketer.findOne | default | - |
| PUT | `/api/marketers/:id` | marketer.update | default | - |
| DELETE | `/api/marketers/:id` | marketer.delete | default | - |
| GET | `/marketer/by-code/:code` | marketer.findByCode | 🔓 PUBLIC | - |
| GET | `/marketer/me/stats` | marketer.myStats | default | plugin::users-permissions.isAuthenticated |
| GET | `/marketer/me/users` | marketer.myUsers | default | plugin::users-permissions.isAuthenticated |
| POST | `/marketer/track-click/:code` | marketer.trackClick | 🔓 PUBLIC | - |

### api::media-play

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| POST | `/api/media-plays` | media-play.create | default | - |
| PUT | `/api/media-plays/:id` | media-play.update | default | - |
| DELETE | `/api/media-plays/:id` | media-play.delete | default | - |
| GET | `/media-plays` | api::media-play.media-play.find | default | - |
| GET | `/media-plays/:id` | api::media-play.media-play.findOne | default | - |
| POST | `/media-plays/track` | media-play.track | default | - |
| POST | `/media-plays/track` | api::media-play.media-play.track | default | - |

### api::merch-concierge

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| POST | `/merch-concierge/create-checkout` | merch-concierge.createCheckout | 🔓 PUBLIC | - |
| GET | `/merch-concierge/order/:orderCode` | merch-concierge.getOrder | 🔓 PUBLIC | - |

### api::merch-order

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/merch-orders` | merch-order.find | default | - |
| POST | `/api/merch-orders` | merch-order.create | default | - |
| GET | `/api/merch-orders/:id` | merch-order.findOne | default | - |
| PUT | `/api/merch-orders/:id` | merch-order.update | default | - |
| DELETE | `/api/merch-orders/:id` | merch-order.delete | default | - |

### api::message-campaign

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/message-campaigns` | message-campaign.find | default | - |
| PUT | `/api/message-campaigns/:id` | message-campaign.update | default | - |
| DELETE | `/api/message-campaigns/:id` | message-campaign.delete | default | - |
| POST | `/message-campaigns` | message-campaign.create | default | - |
| GET | `/message-campaigns/:id` | message-campaign.detail | default | - |
| GET | `/message-campaigns/:id/status` | message-campaign.status | default | - |
| GET | `/message-campaigns/history` | message-campaign.history | default | - |
| POST | `/message-campaigns/preview` | message-campaign.preview | default | - |

### api::message-recipient

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/message-recipients` | message-recipient.find | default | - |
| POST | `/api/message-recipients` | message-recipient.create | default | - |
| GET | `/api/message-recipients/:id` | message-recipient.findOne | default | - |
| PUT | `/api/message-recipients/:id` | message-recipient.update | default | - |
| DELETE | `/api/message-recipients/:id` | message-recipient.delete | default | - |

### api::milestone

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/milestones` | milestone.find | default | - |
| POST | `/api/milestones` | milestone.create | default | - |
| GET | `/api/milestones/:id` | milestone.findOne | default | - |
| PUT | `/api/milestones/:id` | milestone.update | default | - |
| DELETE | `/api/milestones/:id` | milestone.delete | default | - |

### api::moment

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/moments` | moment.find | default | - |
| POST | `/api/moments` | moment.create | default | - |
| GET | `/api/moments/:id` | moment.findOne | default | - |
| PUT | `/api/moments/:id` | moment.update | default | - |
| DELETE | `/api/moments/:id` | moment.delete | default | - |

### api::muse

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/muse/aggregate` | muse.aggregate | 🔓 PUBLIC | - |
| POST | `/muse/backfill` | muse.backfill | 🔓 PUBLIC | - |
| POST | `/muse/run` | muse.run | 🔓 PUBLIC | - |

### api::night-recording

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/night-recordings` | night-recording.find | default | - |
| POST | `/api/night-recordings` | night-recording.create | default | - |
| PUT | `/api/night-recordings/:id` | night-recording.update | default | - |
| GET | `/night-recordings/:id` | night-recording.detail | 🔓 PUBLIC | - |
| PATCH | `/night-recordings/:id` | night-recording.update | 🔓 PUBLIC | - |
| DELETE | `/night-recordings/:id` | night-recording.remove | 🔓 PUBLIC | - |
| GET | `/show-recaps/:id/recordings` | night-recording.listForNight | 🔓 PUBLIC | - |
| POST | `/show-recaps/:id/recordings` | night-recording.createForNight | 🔓 PUBLIC | - |

### api::notification

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| POST | `/api/notifications` | notification.create | default | - |
| GET | `/api/notifications/:id` | notification.findOne | default | - |
| PUT | `/api/notifications/:id` | notification.update | default | - |
| DELETE | `/api/notifications/:id` | notification.delete | default | - |
| GET | `/notifications` | notification.find | default | - |
| POST | `/notifications/:id/read` | notification.markRead | default | - |
| GET | `/notifications/unread-count` | notification.unreadCount | default | - |

### api::passport-gallery-save

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/passport-gallery-saves` | passport-gallery-save.find | default | - |
| POST | `/api/passport-gallery-saves` | passport-gallery-save.create | default | - |
| GET | `/api/passport-gallery-saves/:id` | passport-gallery-save.findOne | default | - |
| PUT | `/api/passport-gallery-saves/:id` | passport-gallery-save.update | default | - |
| DELETE | `/api/passport-gallery-saves/:id` | passport-gallery-save.delete | default | - |
| GET | `/fan-passport/galleries` | passport-gallery-save.list | 🔓 PUBLIC | - |
| POST | `/fan-passport/galleries/:id/save` | passport-gallery-save.save | 🔓 PUBLIC | - |
| DELETE | `/fan-passport/galleries/:id/save` | passport-gallery-save.remove | 🔓 PUBLIC | - |
| GET | `/fan-passport/memories` | passport-gallery-save.listMemories | 🔓 PUBLIC | - |
| GET | `/fan-passport/memories/:id` | passport-gallery-save.getMemory | 🔓 PUBLIC | - |

### api::pulse-snapshot

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/pulse-snapshots` | pulse-snapshot.find | default | - |
| POST | `/api/pulse-snapshots` | pulse-snapshot.create | default | - |
| GET | `/api/pulse-snapshots/:id` | pulse-snapshot.findOne | default | - |
| PUT | `/api/pulse-snapshots/:id` | pulse-snapshot.update | default | - |
| DELETE | `/api/pulse-snapshots/:id` | pulse-snapshot.delete | default | - |

### api::push-device

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/push-devices` | push-device.find | default | - |
| POST | `/api/push-devices` | push-device.create | default | - |
| GET | `/api/push-devices/:id` | push-device.findOne | default | - |
| PUT | `/api/push-devices/:id` | push-device.update | default | - |
| DELETE | `/api/push-devices/:id` | push-device.delete | default | - |

### api::qr

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/qrs` | qr.find | 🔓 PUBLIC | - |
| POST | `/qrs` | qr.create | default | plugin::users-permissions.isAuthenticated, global::subscription-active, api::qr.only-one-qr |
| GET | `/qrs/:id` | qr.findOne | default | plugin::users-permissions.isAuthenticated, api::qr.can-view-qr |
| PUT | `/qrs/:id` | qr.update | default | plugin::users-permissions.isAuthenticated, global::subscription-active, api::qr.owns-qr |
| DELETE | `/qrs/:id` | qr.delete | default | plugin::users-permissions.isAuthenticated, global::subscription-active, api::qr.owns-qr |
| GET | `/qrs/:id/debug-band` | qr.debugBand | 🔓 PUBLIC | - |
| PUT | `/qrs/:id/fix-band/:bandId` | qr.fixBand | 🔓 PUBLIC | - |
| GET | `/qrs/lookup` | qr.lookup | 🔓 PUBLIC | - |

### api::relationship-event

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/relationship-events` | relationship-event.find | default | - |
| POST | `/api/relationship-events` | relationship-event.create | default | - |
| GET | `/api/relationship-events/:id` | relationship-event.findOne | default | - |
| PUT | `/api/relationship-events/:id` | relationship-event.update | default | - |
| DELETE | `/api/relationship-events/:id` | relationship-event.delete | default | - |

### api::scan

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/scans` | scan.find | default | - |
| POST | `/api/scans` | scan.create | default | - |
| GET | `/api/scans/:id` | scan.findOne | default | - |
| PUT | `/api/scans/:id` | scan.update | default | - |
| DELETE | `/api/scans/:id` | scan.delete | default | - |
| POST | `/scans/backfill` | scan.backfill | 🔓 PUBLIC | - |
| POST | `/scans/track` | scan.track | 🔓 PUBLIC | - |

### api::seo-page

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/seo-pages` | seo-page.find | default | - |
| POST | `/api/seo-pages` | seo-page.create | default | - |
| GET | `/api/seo-pages/:id` | seo-page.findOne | default | - |
| PUT | `/api/seo-pages/:id` | seo-page.update | default | - |
| DELETE | `/api/seo-pages/:id` | seo-page.delete | default | - |

### api::show-recap

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/show-recaps` | show-recap.find | default | - |
| POST | `/api/show-recaps` | show-recap.create | default | - |
| PUT | `/api/show-recaps/:id` | show-recap.update | default | - |
| DELETE | `/api/show-recaps/:id` | show-recap.delete | default | - |
| GET | `/public/bands/:bandSlug/nights/:nightSlug` | show-recap.publicNight | 🔓 PUBLIC | - |
| GET | `/show-recaps/:id` | show-recap.recapDetail | default | - |
| GET | `/show-recaps/:id/message` | show-recap.messagePreview | default | - |
| POST | `/show-recaps/:id/message` | show-recap.sendMessage | default | - |
| GET | `/show-recaps/:id/night` | show-recap.getNight | default | - |
| PATCH | `/show-recaps/:id/night` | show-recap.updateNight | default | - |
| POST | `/show-recaps/generate` | show-recap.generateRecap | default | - |
| GET | `/show-recaps/latest/me` | show-recap.latestRecap | default | - |
| GET | `/show-recaps/my-recaps` | show-recap.myRecaps | default | - |

### api::socialpage

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/socialpages` | socialpage.find | default | - |
| POST | `/api/socialpages` | socialpage.create | default | - |
| GET | `/api/socialpages/:id` | socialpage.findOne | default | - |
| PUT | `/api/socialpages/:id` | socialpage.update | default | - |
| DELETE | `/api/socialpages/:id` | socialpage.delete | default | - |

### api::stream

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/streams` | stream.find | default | - |
| POST | `/api/streams` | stream.create | default | - |
| GET | `/api/streams/:id` | stream.findOne | default | - |
| PUT | `/api/streams/:id` | stream.update | default | - |
| DELETE | `/api/streams/:id` | stream.delete | default | - |

### api::stripe

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/stripe/billing` | stripe.getBillingInfo | {"scope":[]} | - |
| POST | `/stripe/confirm-payment` | stripe.confirmPayment | default | - |
| POST | `/stripe/connect/webhook` | connect-webhook.handle | 🔓 PUBLIC | - |
| POST | `/stripe/create-billing-portal-session` | stripe.createBillingPortalSession | {"enabled":true} | - |
| POST | `/stripe/create-checkout-session` | stripe.createCheckoutSession | default | - |
| POST | `/stripe/create-customer` | stripe.createCustomer | default | - |
| GET | `/stripe/subscription-status` | stripe.subscriptionStatus | {"enabled":true} | - |
| GET | `/stripe/test` | stripe.testRoute | default | - |

### api::subscription

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| POST | `/stripe/create-billing-portal-session` | api::subscription.subscription.createBillingPortalSession | {"scope":[]} | - |
| POST | `/stripe/register` | api::subscription.subscription.register | 🔓 PUBLIC | - |
| GET | `/stripe/subscription-status` | api::subscription.subscription.subscriptionStatus | {"scope":[]} | - |
| POST | `/stripe/webhook` | api::subscription.subscription.webhook | 🔓 PUBLIC | - |
| POST | `/webhooks/stripe` | api::subscription.subscription.webhook | 🔓 PUBLIC | - |

### api::support-moment

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/support-moments` | support-moment.find | default | - |
| POST | `/api/support-moments` | support-moment.create | default | - |
| GET | `/api/support-moments/:id` | support-moment.findOne | default | - |
| PUT | `/api/support-moments/:id` | support-moment.update | default | - |
| DELETE | `/api/support-moments/:id` | support-moment.delete | default | - |
| GET | `/support-moments/:id/summary` | support-moment.summary | 🔓 PUBLIC | - |

### api::system-kv

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/system-kvs` | system-kv.find | default | - |
| POST | `/api/system-kvs` | system-kv.create | default | - |
| GET | `/api/system-kvs/:id` | system-kv.findOne | default | - |
| PUT | `/api/system-kvs/:id` | system-kv.update | default | - |
| DELETE | `/api/system-kvs/:id` | system-kv.delete | default | - |

### api::test-email

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/test-email` | test-email.send | 🔓 PUBLIC | - |

### api::tour

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/tours` | tour.find | default | - |
| POST | `/api/tours` | tour.create | default | - |
| GET | `/api/tours/:id` | tour.findOne | default | - |
| PUT | `/api/tours/:id` | tour.update | default | - |
| DELETE | `/api/tours/:id` | tour.delete | default | - |

### api::user-admin

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| PUT | `/user-admin/:id` | user-admin.update | 🔓 PUBLIC | - |
| GET | `/user-admin/by-email/:email` | user-admin.findByEmail | 🔓 PUBLIC | - |
| POST | `/user-admin/issue-jwt` | user-admin.issueJwt | 🔓 PUBLIC | - |
| POST | `/user-admin/register` | user-admin.register | 🔓 PUBLIC | - |

### api::video

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/videos` | video.find | default | - |
| POST | `/api/videos` | video.create | default | - |
| GET | `/api/videos/:id` | video.findOne | default | - |
| PUT | `/api/videos/:id` | video.update | default | - |
| DELETE | `/api/videos/:id` | video.delete | default | - |

### api::youtube

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/youtube/debug` | youtube.debug | 🔓 PUBLIC | - |
| GET | `/youtube/debug/channels` | youtube.debugChannels | 🔓 PUBLIC | - |
| GET | `/youtube/debug/env` | youtube.debugEnv | 🔓 PUBLIC | - |
| GET | `/youtube/debug/refresh` | youtube.debugRefresh | 🔓 PUBLIC | - |
| GET | `/youtube/debug/sync` | youtube.debugSync | 🔓 PUBLIC | - |
| GET | `/youtube/debug/tokeninfo` | youtube.debugTokenInfo | 🔓 PUBLIC | - |
| POST | `/youtube/disconnect` | youtube.disconnect | 🔓 PUBLIC | - |
| POST | `/youtube/oauth/callback` | youtube.oauthCallback | 🔓 PUBLIC | - |
| GET | `/youtube/oauth/init` | youtube.oauthInit | 🔓 PUBLIC | - |
| POST | `/youtube/purge` | youtube.purge | 🔓 PUBLIC | - |
| POST | `/youtube/select-channel` | youtube.selectChannel | 🔓 PUBLIC | - |
| POST | `/youtube/sync` | youtube.sync | 🔓 PUBLIC | - |
| GET | `/youtube/sync` | youtube.sync | 🔓 PUBLIC | - |

## Plugin Routes

### plugin::upload

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| POST | `/api/upload` | content-api.upload | default | - |
| GET | `/api/upload/files` | content-api.find | default | - |
| GET | `/api/upload/files/:id` | content-api.findOne | default | - |
| DELETE | `/api/upload/files/:id` | content-api.destroy | default | - |

### plugin::users-permissions

| Method | Path | Handler | Auth Config | Policies |
|--------|------|---------|-------------|----------|
| GET | `/api/auth/:provider/callback` | auth.callback | default | - |
| POST | `/api/auth/change-password` | auth.changePassword | default | - |
| GET | `/api/auth/email-confirmation` | auth.emailConfirmation | default | - |
| POST | `/api/auth/forgot-password` | auth.forgotPassword | default | - |
| POST | `/api/auth/local` | auth.callback | default | - |
| POST | `/api/auth/local/register` | auth.register | default | - |
| POST | `/api/auth/reset-password` | auth.resetPassword | default | - |
| POST | `/api/auth/send-email-confirmation` | auth.sendEmailConfirmation | default | - |
| GET | `/api/users` | user.find | default | - |
| GET | `/api/users-permissions/roles` | role.find | default | - |
| GET | `/api/users-permissions/roles/:id` | role.findOne | default | - |
| GET | `/api/users/:id` | user.findOne | default | - |
| PUT | `/api/users/:id` | user.update | default | - |
| DELETE | `/api/users/:id` | user.destroy | default | - |
| GET | `/api/users/me` | user.me | default | - |

## Content Types

| UID | Singular | Plural | Kind | Draft & Publish |
|-----|----------|--------|------|------------------|
| api::album.album | album | albums | collectionType | true |
| api::artist-update.artist-update | artist-update | artist-updates | collectionType | false |
| api::band.band | band | bands | collectionType | false |
| api::band-external-account.band-external-account | band-external-account | band-external-accounts | collectionType | false |
| api::band-external-metric.band-external-metric | band-external-metric | band-external-metrics | collectionType | false |
| api::band-insight-daily.band-insight-daily | band-insight-daily | band-insights-daily | collectionType | false |
| api::band-invite.band-invite | band-invite | band-invites | collectionType | false |
| api::band-member.band-member | band-member | band-members | collectionType | false |
| api::band-page-view.band-page-view | band-page-view | band-page-views | collectionType | false |
| api::band-share.band-share | band-share | band-shares | collectionType | false |
| api::band-ui-event.band-ui-event | band-ui-event | band-ui-events | collectionType | false |
| api::conversation.conversation | conversation | conversations | collectionType | false |
| api::conversation-message.conversation-message | conversation-message | conversation-messages | collectionType | false |
| api::conversation-participant.conversation-participant | conversation-participant | conversation-participants | collectionType | false |
| api::conversation-request.conversation-request | conversation-request | conversation-requests | collectionType | false |
| api::event.event | event | events | collectionType | false |
| api::event-page-view.event-page-view | event-page-view | event-page-views | collectionType | false |
| api::fan.fan | fan | fans | collectionType | false |
| api::fan-account-link.fan-account-link | fan-account-link | fan-account-links | collectionType | false |
| api::fan-interaction.fan-interaction | fan-interaction | fan-interactions | collectionType | false |
| api::fan-moment.fan-moment | fan-moment | fan-moments | collectionType | false |
| api::fan-profile.fan-profile | fan-profile | fan-profiles | collectionType | false |
| api::fan-show-attendance.fan-show-attendance | fan-show-attendance | fan-show-attendances | collectionType | false |
| api::fan-visitor.fan-visitor | fan-visitor | fan-visitors | collectionType | false |
| api::feature-enrollment.feature-enrollment | feature-enrollment | feature-enrollments | collectionType | false |
| api::funtest.funtest | funtest | funtests | collectionType | true |
| api::howtovideo.howtovideo | howtovideo | howtovideos | collectionType | true |
| api::image-proxy.image-proxy | image-proxy | image-proxies | singleType | false |
| api::link-click.link-click | link-click | link-clicks | collectionType | true |
| api::marketer.marketer | marketer | marketers | collectionType | false |
| api::media-play.media-play | media-play | media-plays | collectionType | false |
| api::merch-order.merch-order | merch-order | merch-orders | collectionType | false |
| api::message-campaign.message-campaign | message-campaign | message-campaigns | collectionType | false |
| api::message-recipient.message-recipient | message-recipient | message-recipients | collectionType | false |
| api::milestone.milestone | milestone | milestones | collectionType | false |
| api::moment.moment | moment | moments | collectionType | false |
| api::night-recording.night-recording | night-recording | night-recordings | collectionType | false |
| api::notification.notification | notification | notifications | collectionType | false |
| api::passport-gallery-save.passport-gallery-save | passport-gallery-save | passport-gallery-saves | collectionType | false |
| api::pulse-snapshot.pulse-snapshot | pulse-snapshot | pulse-snapshots | collectionType | false |
| api::push-device.push-device | push-device | push-devices | collectionType | false |
| api::qr.qr | qr | qrs | collectionType | false |
| api::relationship-event.relationship-event | relationship-event | relationship-events | collectionType | false |
| api::scan.scan | scan | scans | collectionType | false |
| api::seo-page.seo-page | seo-page | seo-pages | collectionType | true |
| api::show-recap.show-recap | show-recap | show-recaps | collectionType | false |
| api::socialpage.socialpage | socialpage | socialpages | collectionType | true |
| api::stream.stream | stream | streams | collectionType | true |
| api::support-moment.support-moment | support-moment | support-moments | collectionType | true |
| api::system-kv.system-kv | system-kv | system-kvs | collectionType | false |
| api::tour.tour | tour | tours | collectionType | true |
| api::video.video | video | videos | collectionType | true |
