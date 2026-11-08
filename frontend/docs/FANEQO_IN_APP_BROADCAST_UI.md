# Faneqo private broadcast UI

Status: implemented frontend contract

## What bands can send

| Audience | Faneqo inbox | Email |
| --- | --- | --- |
| One fan | Existing Direct Messages selector | Not a campaign action |
| All fans | One private conversation per eligible Faneqo member | One email per eligible subscriber |
| Show attendees | One private conversation per eligible checked-in Faneqo member | One email per eligible checked-in subscriber |

An inbox broadcast is never a group chat. A fan sees only their existing private conversation with the band and can reply there.

## Composer behavior

- `/messages/compose` defaults to `in_app` because direct fan relationships are the primary product path.
- The artist can explicitly switch to `email` before review.
- Every channel change requests a fresh server preview; no local fan count is trusted.
- Inbox copy states that only Faneqo members qualify and that delivery is private.
- Email keeps its subject, unsubscribe, account-email reply, and production test-mode behavior.
- Inbox requires message body only; email still requires subject and body.
- Drafts are separated by audience and channel.
- Success, history, detail, and progress UI name the actual delivery channel.

## Message the Room

The show recap composer uses the same `in_app` / `email` choice. Preview requests include the channel, and send requests echo that channel. The backend remains responsible for canonical attendance, account eligibility, dedupe, cooldown, show age, double-send protection, permissions, and final delivery checks.

## Privacy and fallback

- The UI never receives fan email addresses or account ids.
- There is no silent email fallback when an inbox recipient is unavailable.
- Removed, blocked, self, anonymous, duplicate, and cooling recipients are handled server-side.
- Aggregate skipped/failed counters may continue updating while the durable worker runs.

## Verification

- Run `npm run test:messaging`.
- Run `npm run build`.
- Verify both delivery previews on All Fans and Message the Room.
- Confirm an inbox broadcast creates separate fan conversations and replies land in Messages.
