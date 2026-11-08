# Faneqo Messages UX contract

Updated 2026-09-03. Artist-facing Messages IA contract.

The next messaging sprint is defined in `docs/FANEQO_MASTER_PRODUCT_ROADMAP.md` and `docs/FANEQO_CURRENT_PHASE.md`. If this file conflicts with the four canonical product docs, those four win. Conversations / Campaigns are not artist-facing navigation.

This is the artist-facing product contract for Messages. Backend names may stay as they are. Artists must not have to learn them.

Slice 1 is Messages home information architecture.
Slice 2 is the audience composer hierarchy/copy plus the show-picker heading contrast fix.
Slice 3 is review + final composer polish. Do not start a success-screen pass from this file.

---

## Product model

Faneqo Messages exists primarily so artists can communicate directly with their fanbase.

The two most important artist actions are:

1. **Message all fans**
2. **Message a show**

Private 1:1 conversations matter, especially when fans reply. They are secondary to those two audience actions.

Artists should not need to understand:

- Campaigns
- MessageCampaign
- recipient snapshots
- audience resolvers
- delivery workers
- conversation fan-out

### Artist-facing mental model

| Artist word | Meaning |
| --- | --- |
| **Message all fans** | Reach the artist's whole Faneqo fan audience. |
| **Message a show** | Reach the Faneqo fans associated with a specific show. |
| **Inbox** | Private fan replies and 1:1 conversations. |
| **Sent** | History and status of audience messages already sent. |

Do not use **Campaigns** as the primary artist-facing navigation concept.

The backend may continue using `MessageCampaign` internally.

---

## Audience delivery

When an artist sends to All Fans or a show audience:

- the artist writes once
- Faneqo resolves the authorized audience
- every eligible fan receives the message privately
- no group chat is created
- canonical artist/fan conversations are reused
- replies return to Messages

The UI must not repeatedly explain this mechanism.

One concise explanation is enough:

> Each fan receives this privately.

Do not call this a group message.

---

## Primary flows

### All fans

```
Messages → Message all fans → existing canonical All Fans composer → review → send → success
```

There is no required `Campaigns → New broadcast` detour.

Route: `/messages/compose?audienceType=all_fans`

### Show

```
Messages → Message a show → choose a recent eligible show → existing canonical show_attendees composer
```

Show Recap may bypass the picker:

```
Show Recap → Message this show → same canonical composer
```

Route: `/messages/compose?audienceType=show_attendees&recapId=...`

Multiple entry points must converge on the existing messaging architecture. Do not create a second audience model.

---

## Messages home

Replace the artist-facing fork:

- Was: Conversations / Campaigns
- Now: **Inbox / Sent**

**Inbox**

- private replies
- existing conversations
- ability to start a new private conversation

**Sent**

- history and status of messages sent to audiences
- existing campaign history architecture underneath

The two strongest actions on Messages home must be:

- Message all fans
- Message a show

Private messaging stays easy to reach. It must not visually compete with those two actions.

URL compatibility: `?tab=sent` is the artist-facing Sent URL. `?tab=campaigns` remains a supported alias so existing composer, recap, and detail links keep working.

---

## Desktop

Preserve useful parts of the current desktop inbox:

- conversation rail
- search
- selected conversation panel
- existing thread UI

Do not redesign the whole page.

When no conversation is selected, the large empty area must be productive. It should offer:

**Reach your fans**

- Message all fans
- Message a show

Do not leave the main panel as a mostly empty “select a conversation” state.

---

## Mobile

Mobile is a release gate. Test approximately **390px** and **430px**.

The two primary audience actions must be immediately obvious.

Do not force users into Sent first.
Do not make the page feel like a compressed admin dashboard.
Inbox conversations remain easy to reach.

---

## Slice boundaries

### Slice 1 — this work

Messages entry experience and information architecture only.

### Slice 2 — composer hierarchy

Artist-facing composer vocabulary:

- H1 is **Message all fans** or **Message a show**
- Compact reach: `N fans reachable` or `N fan(s) from this show`
- Message field is the dominant first-viewport content
- Compact Delivery control: **Faneqo Inbox** (default) or **Email**
- One privacy line: **Each fan receives this privately.**
- Media is secondary: **Add media**
- Primary compose action: **Review message**

Do not change in Slice 2:

- Messages home IA
- show picker architecture / routing
- review / send / success
- gallery backend
- backend cooldown or delivery behavior

### Slice 3 — review + composer polish

- Show identity persists after the picker: `the party · Sep 3`
- Delivery selected state is compact and visually distinct
- Add media is a compact action, not a heading
- Review is audience-first: show/audience, count, delivery, message, send
- Send CTA is recipient-aware: `Send to 1 fan`
- Mobile fan preview is secondary (`Preview as fan`)
- Success screen stays unchanged until a later pass

---

## Locks

- Conversation = private 1:1.
- Audience send = write once, private delivery per fan.
- No group conversation.
- No public DM fallback.
- Preview remains aggregate counts only. No fan PII.
- Owner-only messaging remains server-enforced.
- `ArtistUpdate` owns galleries. Do not expand Galleries in this work.
- Do not merge `codex/messages-campaign-ux` wholesale.
