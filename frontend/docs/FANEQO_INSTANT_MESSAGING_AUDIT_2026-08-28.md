# Faneqo Instant Messaging Audit

**Date:** 2026-08-28  
**Scope:** private artist–fan messaging, image attachments, artist broadcasts, galleries, and the FanPassport boundary.

## Outcome

Faneqo already has a credible messaging foundation. Keep it and finish the production path instead of replacing it with a generic chat SDK.

The immediate image problem was partly a frontend availability bug: the composer disabled the photo picker when its readiness request was delayed or failed. The picker now stays usable whenever the conversation itself is usable. Selecting a photo re-checks protected delivery, uploads only through the participant-authorized endpoint, and shows a retryable failure if delivery is unavailable. Production public-upload fallback remains forbidden.

Live checks on 2026-08-28:

- `GET /api/health` returned 200.
- `GET /api/conversations/media/delivery` returned `ready: true`, `attachmentsEnabled: true`, and `reason: configured`.
- Frontend and backend main-branch CI were green before this fix.
- An authenticated production upload/send/stream test is still required; a public readiness response cannot prove S3 PUT, message persistence, or participant-only image delivery.

## Product model

Do not combine these lanes:

| Lane | Purpose | Owner |
| --- | --- | --- |
| Direct message | Private artist ↔ fan conversation | `ConversationMessage` |
| Private broadcast | Band sends to all fans or one show's attendees as separate 1:1 inbox messages | Existing campaign queue + conversations |
| Show gallery | A substantial shared concert memory, up to 60 photos | `ArtistUpdate` |
| FanPassport save | Fan saves an authorized gallery reference | `passport-gallery-save` |
| Email campaign | Reach fans outside the app with consent/suppression rules | Message campaign/recipient |

A DM may contain one to four conversational images. It must not become a second show-gallery store. A show gallery may be shared into a conversation, but FanPassport saves the authorized `ArtistUpdate` gallery reference, never copied DM media or signed URLs.

## What is strong today

- One canonical conversation per band × fan account.
- Artist and fan participants, message requests, block state, read state, and idempotent sends.
- Private broadcasts to all eligible fans or one show's attendees.
- Text-only and image-only messages.
- Up to four ordered DM images with preview, upload state, remove, retry, optimistic send, bubble grid, and lightbox.
- Participant authorization before upload, attachment binding, thread reads, and media streaming.
- Shared `MediaItem`, upload queue, grid, preview, and lightbox across Faneqo media surfaces.
- JPEG, PNG, and WebP validation with an 8 MB per-image limit.
- Protected 480/960/1600 WebP derivatives and short-lived delivery capabilities.
- Direct storage URLs are excluded from protected message DTOs.

This matches established attachment UX: visible uploading/failed/finished states plus remove and retry controls are standard in mature chat products ([Stream attachment preview guidance](https://getstream.io/chat/docs/sdk/react/v12/guides/theming/input-ui/)). Text plus multiple media in one conversation message is also a normal, proven model ([Twilio Conversations media guidance](https://www.twilio.com/docs/conversations-classic/sending-messages-and-media)).

## Findings

### P0 — finish the real production image path

1. The picker was coupled too tightly to a readiness GET. A transient status failure made the feature look permanently disabled. This fix decouples selection from status while keeping upload fail-closed.
2. Readiness currently proves configuration variables, not a successful private S3 write.
3. The authenticated matrix has not been completed in production.
4. Upload errors need to remain visible and retryable; do not clear the user's selected photo on failure.
5. New DM media must remain private. AWS recommends S3 Block Public Access for private storage ([AWS S3 guidance](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)), and OWASP recommends authentication, authorization, allowlisted types, and bounded size for uploads ([OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)).

### P1 — reliability and scale

1. Thread pagination still loads a large message set and slices it in memory.
2. Conversation unread/list reads can scan message history per conversation.
3. Active polling multiplies those costs.
4. Rate limits are process-local.
5. Signed image URLs expire after 15 minutes but the client does not yet refresh a stale image safely.
6. Optimistic blob URLs need deterministic cleanup after server confirmation.
7. Delivery state should distinguish: component ready, environment configured, authenticated smoke passed, and healthy now.

Do database cursor pagination and bounded unread aggregates before adding WebSockets. Realtime transport on top of expensive reads only makes the expensive path run faster and more often.

### P2 — product quality

- Add image upload progress that communicates bytes/progress when the transport exposes it.
- Keep one-tap retry and remove.
- Add safe expired-image refresh.
- Preserve image captions as the message body; do not add a separate caption schema.
- Add push notifications only after notification preferences, quiet hours, and deep links are designed.
- Keep typing indicators ephemeral; never persist them.
- Keep read status honest: sent, failed, and seen only when the data proves it.
- Support HEIC later through an explicit conversion path; do not silently accept files the server cannot decode.
- Route “View fan” to the canonical Artist × Fan relationship view, not the legacy score-first panel.

## Execution order

### DO NOW

1. Merge the picker fix after focused media/messaging tests and Nuxt build pass.
2. With controlled artist and fan accounts, test 1-photo and 4-photo sends in both directions.
3. Test image-only, text + images, retry, remove, blocked thread, and unrelated-user denial.
4. Confirm no S3/CDN URL appears in API responses or browser requests.
5. Record the exact server error if S3 upload fails; fix that concrete failure without enabling public fallback.

### NEXT PHASE

1. Refresh expired signed media by safely refreshing the thread/media capability.
2. Clean optimistic blob URLs after confirmation.
3. Move message pagination and unread counts into bounded database queries.
4. Measure 10, 100, and 500 conversation workloads.
5. Then choose SSE/WebSocket only if usage and latency justify it.
6. Let a band share an existing show gallery into a DM as a protected gallery card; FanPassport save continues to target the `ArtistUpdate` reference.

### LATER

- Push notifications and quiet hours.
- Search within a conversation.
- Message reactions/replies if real usage proves value.
- Rich gallery-share analytics.
- HEIC conversion and broader media types after image reliability is excellent.

### REJECT

- Public DM image fallback in production.
- A second upload queue, lightbox, gallery table, or `MediaAsset`.
- Copying show-gallery photos into FanPassport.
- Persisted typing state.
- “Delivered” or “seen” labels without canonical proof.
- WebSockets before fixing query cost.
- Turning private messaging into a public social feed.

## Minimum release matrix

| Scenario | Expected |
| --- | --- |
| Artist → fan, 1 image | Send, render, reopen, lightbox |
| Artist → fan, 4 images | Preserve order and render grid |
| Fan → artist, 1 and 4 images | Same behavior |
| Image-only message | Allowed |
| Text + images | Allowed |
| Fifth image | Rejected locally and server-side |
| JPEG/PNG/WebP ≤ 8 MB | Allowed |
| HEIC/GIF/PDF/oversize | Clear rejection |
| Remove during upload | Abort; never attach |
| Upload failure | Keep preview; offer retry |
| Duplicate send retry | One canonical message |
| Blocked/removed conversation | Upload/send denied |
| Other signed-in user | Cannot list, bind, or stream media |
| Anonymous/expired capability | Denied |
| Direct storage URL | Never exposed |
| Signed URL expiry | Recover without public fallback |


## 2026-08-29 follow-up

### Confirmed live

- The deployed composer contains the picker decoupling fix: photo selection is no longer disabled by the readiness flag.
- Protected-delivery status returns `ready: true` and `attachmentsEnabled: true`.
- The production upload-route CORS preflight accepts `POST`, `Authorization`, and `Content-Type` from `https://faneqo.com`.
- Therefore a remaining real-user failure is after selection: authenticated protected-object upload, the public-access safety probe, or message attachment binding.

### Confirmed thread-position defect

A conversation selection attempted to scroll before fetched history rendered. The later initial history batch was not considered “newer” because the prior message set was empty, leaving the viewport above the newest messages. The client now marks each selected conversation for one initial follow and performs an immediate bottom alignment only after history is resolved and rendered. Subsequent messages retain the existing near-bottom follow and “new messages” pill behavior.

### Required upload isolation

Capture the first failing authenticated request in this order:

1. `POST /api/conversations/:id/media`
2. `POST /api/conversations/:id/messages`
3. protected `GET /api/conversations/:conversationId/messages/:messageId/media/:mediaId`

If step 1 fails, inspect the returned error name/request ID and the corresponding protected-media log. In particular, `protected_object_public` means the configured bucket or protected prefix is still publicly readable and must be made private; do not bypass that guard. If step 1 succeeds and step 2 fails, inspect attachment ownership/binding. If both succeed and step 3 fails, inspect participant authorization or signed-media refresh.


## 2026-08-29 upload unblock and mint roadmap

### Merged safely

- Backend protected-image work no longer performs three derivative writes and public-access candidate probes serially. Writes and probes are bounded and concurrent; publicly readable protected objects are still deleted and rejected.
- The composer now explains a pending upload with `Uploading 1 photo…` or `Uploading N photos…`.
- A protected upload now ends after 60 seconds with `Upload took too long. Tap Retry.` instead of leaving Send disabled indefinitely. The selected preview and retry path remain available.
- Backend CI and frontend focused messaging/media tests plus the full Nuxt production build passed before squash merge.
- Public verification after merge: `/api/health` is healthy; protected-media delivery reports `ready: true`, `attachmentsEnabled: true`, and `publicFallbackAllowed: false`.

This removes the two confirmed causes visible in the production screenshot: an opaque pending state and serial network work in the protected upload path. It does not replace the required authenticated production send test.

### Current audit verdict

The messaging system should be completed, not rewritten. Its conversation identity, request/block/read rules, idempotent sending, private broadcast lane, and protected media authorization are the right foundation. The main remaining risks are production proof, query cost at scale, expiring media capabilities, and operational visibility.

### NOW — release gate

1. After both deployments finish, run the minimum authenticated matrix with controlled artist and fan accounts: 1 image, 4 images, image-only, text plus images, both directions, reload, lightbox, remove, and retry.
2. Verify blocked, removed, unrelated-user, and expired-capability denials.
3. If an upload fails, use the request ID and the new safe phases—`upload:processed`, `upload:stored`, and `upload:privacy_checked`—to fix the exact failing stage. Never enable public fallback.
4. Record upload success rate and p50/p95 time from selection to ready-to-send before adding more media features.

### NEXT — reliability and scale

1. Refresh expired protected-image capabilities without exposing storage URLs.
2. Revoke optimistic blob URLs deterministically and clean abandoned protected uploads.
3. Move thread cursor pagination and unread aggregation into bounded database queries.
4. Load-test 10, 100, and 500-conversation accounts and cap list/thread work.
5. Replace process-local rate limiting with a shared limiter before horizontal scaling.
6. Add honest offline/reconnect states, date and unread separators, and accessibility checks for keyboard, screen reader, lightbox, and error focus.

### THEN — elite product value

1. Add measured byte-level upload progress, paste, and drag/drop while retaining mobile picker behavior.
2. Add explicit HEIC conversion only when client and server validation agree.
3. Share an existing show gallery into a DM as a protected gallery card; do not copy its images into the message.
4. Let FanPassport save the authorized `ArtistUpdate` gallery reference.
5. Add push notifications with quiet hours, preferences, and deep links.
6. Choose SSE or WebSocket only after database work is bounded and measured.

### Definition of mint

A photo send is complete only when it uploads, sends, renders immediately, survives reload, opens in the lightbox, remains private to participants, recovers after capability expiry, and reports a useful retryable error within a bounded time. A green readiness endpoint alone is not that proof.
