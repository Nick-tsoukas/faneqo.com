# Faneqo private in-app broadcasts

Status: backend delivery foundation

## Product contract

A band can message:

- one fan through the existing direct-message selector;
- all eligible Faneqo fans for the band;
- eligible Faneqo fans who checked in to one show.

Bulk sends are never group chats. Each recipient receives the message in the existing private band-to-fan conversation. Replies return to the band's normal inbox.

## Audience and privacy rules

- `all_fans` is always scoped by `bandId` on the server.
- `show_attendees` comes from canonical, unsuppressed `fan-show-attendance` rows for the selected campaign.
- In-app recipients must have an `accountUser` and must not be the sending artist.
- Multiple fan rows for one account are collapsed to one recipient.
- Removed fan relationships are excluded.
- Email unsubscribe, bounce, complaint, or missing email does not disable in-app messaging.
- A fan-level block is rechecked by the direct-message service immediately before persistence.
- The sender must still have `sendFanMessages` permission when the worker starts.

## Delivery architecture

The existing `message-campaign` and `message-recipient` queue remains the only broadcast engine.

- `channel=email` uses Resend and the existing email suppression rules.
- `channel=in_app` uses the Faneqo inbox service.
- The worker authorizes the campaign actor once, then reuses the inbox service for the batch.
- The inbox service preserves conversation access, relationship/block checks, transactions, and relationship-event production.
- Worker delivery does not consume the interactive DM rate-limit budget.
- Client message id `campaign:<campaignId>:fan:<fanId>` makes retries idempotent.
- Recipient rows remain the durable source of truth across worker restarts.

## Frequency and failure behavior

Email and inbox broadcasts have separate 24-hour fan cooldowns:

- email: `fan.lastMessagedAt`
- inbox: `fan.lastInboxBroadcastAt`

A recipient that becomes removed, blocked, anonymous, self-targeted, or cooling before delivery is suppressed. Unexpected persistence failures are marked failed and remain visible in aggregate campaign counters. No recipient PII is returned by preview, history, detail, or status APIs.

## Frontend contract

Campaign preview and create accept:

```json
{
  "bandId": 123,
  "audienceType": "all_fans",
  "channel": "in_app",
  "bodyText": "Thanks for being here. New music Friday."
}
```

For a show audience, use `audienceType=show_attendees` with its canonical campaign reference, or the existing show-recap message route with `channel=in_app`.

The composer must clearly say that only fans with Faneqo accounts receive inbox delivery. It must show the server preview count before enabling send and must not imply an email fallback.

## Verification gates

- Run `npm test`.
- Run `npm run build` because the schemas are boot-critical.
- Confirm retry idempotency and that interactive DM throttling remains active.
- After deployment, require `GET /api/health` to return HTTP 200 before enabling the frontend control.
