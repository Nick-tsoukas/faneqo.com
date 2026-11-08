# Faneqo Messaging + Galleries Product Convergence Plan

Updated 2026-09-01. Historical execution plan.

**Superseded for product direction.** Read `docs/FANEQO_DESIGN_NORTH_STAR.md`, `docs/FANEQO_MASTER_PRODUCT_ROADMAP.md`, `docs/FANEQO_CURRENT_PHASE.md`, and `docs/FANEQO_NEXT_AGENT_HANDOFF.md` first. Artist-facing IA is **Inbox / Sent**, not Conversations / Campaigns. Gallery browsing is mature; Gallery create / edit is a later premium pass. Do not use this file to reopen locked Night / Gallery / Check-In surfaces.

Status: Phases 1, the safe core of 2/3, 4, and 5 are implemented in the 2026-09-01 convergence slice. Production smoke testing and later edit/archive/analytics work remain.

This file retains historical context for messaging, galleries, Show Recaps, FanPassport, sharing, and relationship intelligence.

Read this before changing messaging, Artist Updates, protected media, galleries, FanPassport, Show Recaps, or Rive presentation.

## 1. Product thesis

Faneqo should not feel like a collection of a smart page, fan list, chat, email sender, Show Mode, and photo tools.

The product loop is:

1. capture a real fan relationship;
2. create something worth returning to;
3. choose exactly who should receive it;
4. deliver it privately or publicly with honest access rules;
5. let fans reply, share, and preserve the memory;
6. show the band what the relationship produced.

The clearest differentiated experience is:

> A band creates a gallery from a show, sends it privately to the people who were there, receives replies, sees fans save it to FanPassport, and understands the resulting relationship activity.

This plan also makes galleries useful outside Show Mode without weakening verified-attendance truth.

## 2. Outcomes

### Band outcome

A band can create a polished gallery without understanding Faneqo's internal data model, distribute it to one fan, all fans, or verified show attendees, and understand opens, saves, shares, and replies.

### Fan outcome

A fan receives a beautiful, private, artist-owned memory; can view it reliably on mobile; can reply naturally; can share it safely; and can save the same protected source gallery to FanPassport.

### Faneqo outcome

Messaging, galleries, Show Mode, Fan Intelligence, and FanPassport reinforce one another instead of behaving like separate products. This becomes a concrete reason to choose Faneqo over a generic link-in-bio tool.

## 3. Existing foundation — preserve it

The following is already merged and must be extended rather than replaced:

- one canonical band × fan conversation;
- direct messages with text, read state, requests, blocking, idempotency, and up to 4 images;
- private in-app broadcasts to all fans or checked-in show attendees;
- email campaigns as a separate delivery channel;
- campaign recipient snapshots, durable worker delivery, cooldowns, history, and aggregate status;
- shared MediaItem normalization, upload queue, picker, preview, grid, and lightbox;
- ArtistUpdate as canonical image/gallery ownership;
- up to 60 gallery photos, 8 MB each;
- protected media and canonical attendee authorization;
- show-scoped Night Story presentation;
- gallery-reference cards inside individual artist-to-fan DMs;
- FanPassport reference save/remove;
- protected sharing with authorization rechecked at read time;
- Rive memory-feedback integration with a static fallback;
- owner-only messaging and existing team-access permissions.

## 4. Non-negotiable architecture

1. Campaigns and direct conversations remain separate backend lanes.
2. An inbox broadcast creates separate private 1:1 messages. It is never a group chat.
3. ArtistUpdate remains the only gallery owner.
4. ConversationMessage remains the owner of ordinary DM image attachments.
5. FanPassport stores an authorized artistUpdateId reference and never copies gallery media.
6. Strapi Upload and private S3 objects remain file truth.
7. Canonical unsuppressed attendance remains verified show-attendee truth.
8. Possessing a message or shared link never grants attendee access.
9. Reuse the existing media queue, picker, grid, and lightbox.
10. No MediaAsset, second gallery, copied Passport photo library, public DM fallback, badge wall, or fabricated relationship history.
11. Show Mode is required for verified attendee access, not for every gallery.
12. No schema or production-environment change without an explicit audit and stop gate.
13. Read and send authorization must remain server-side; query parameters and hidden frontend routes are not authorization.
14. Database reads must be bounded before realtime transport is added.

## 5. Current UX audit

### Messaging entry points

Bands currently encounter messaging through:

- Messages → Direct;
- Messages → Broadcasts;
- Fan Intelligence → Messages;
- Show Recap → Message the Room;
- Artist × Fan → direct conversation;
- the gallery picker inside an individual DM.

The backend separation is correct. The UX is fragmented.

The Broadcasts composer starts with all_fans, while show_attendees is primarily exposed through Show Recap. The two campaign experiences use different frontend composers. Bands must remember where a capability lives instead of choosing the audience they intend to reach.

### Gallery entry points

The canonical protected show-gallery flow is Show Recap → Share photos from tonight → Labs route. The Messages empty-state link currently points to /updates/new, which is intentionally redirected by hide-artist-updates middleware and does not carry a Show Recap identity.

Even if that route were unhidden, it would open generic public-update mode rather than a verified attendee gallery. This is a route and product-contract defect, not merely a redirect typo.

### Gallery management

The underlying model has public, fan_list, and show_attendees visibility and draft/published status, but the visible product lacks:

- a first-class Galleries home;
- reliable non-Labs creation;
- a clear draft workflow;
- edit/add/remove/cover management after publish;
- archive or unpublish semantics;
- gallery performance reporting;
- a safe path for general and event galleries;
- gallery attachment in campaign broadcasts.

### Fan experience

The gallery DM card, lightbox, save, share, and reference-only FanPassport behavior are the right foundation. The larger Passport product and its relationship chronology remain incomplete. The current experience should be strengthened without adding gamification or copying media.

## 6. Target information architecture

### Messages

Messages remains the single communication home:

- Conversations — private one-to-one inbox;
- Campaigns — one message sent privately to a selected audience.

Contextual entry points continue to exist, but they open the same campaign experience with context preselected.

### Galleries

Add a first-class Galleries area for band users:

- All;
- Drafts;
- Published;
- archived only after archive semantics are designed.

Each gallery card should show:

- cover;
- title;
- show/event/general context;
- audience;
- photo count;
- status;
- publish date;
- high-value outcomes when available.

Primary actions:

- Create gallery;
- View;
- Share;
- Send to fans;
- Edit;
- Archive only after reference behavior is approved.

## 7. Gallery contexts

All three contexts reuse ArtistUpdate.

### A. Verified Show Gallery

Source: an owned Show Recap with canonical attendance.

Allowed audiences, subject to backend readiness:

- people who checked in;
- all fans;
- public.

Capabilities:

- verified show identity;
- attendee-only access;
- "You were there" presentation;
- Message the Room;
- FanPassport show memory;
- show-specific outcomes.

### B. Event Gallery

Source: an owned Event without verified attendance.

Allowed audiences:

- all fans;
- public.

It may display event, venue, city, and date, but it cannot claim verified attendance and cannot use show_attendees access.

### C. General Artist Gallery

Source: no event required.

Examples:

- rehearsal;
- studio;
- backstage;
- release day;
- tour diary;
- festival weekend;
- photo shoot.

Allowed audiences:

- public;
- fan list only after fan_list authorization and protected-delivery semantics pass a backend audit.

### Truth rule

Show Mode or a canonical Show Recap is necessary only for verified-attendee language and attendee-restricted delivery. It must not be required to create a useful artist gallery.

## 8. Target creation experience

The first question is:

> What is this gallery from?

Choices:

- A show;
- An event;
- Something else.

The composer then derives the allowed context and audience instead of asking the band to understand internal visibility enums.

Required UX:

1. select up to 60 supported images;
2. background upload with clear preparing, uploading, ready, failed, and retry states;
3. reorder photos;
4. first photo remains the cover initially;
5. add a short title and optional caption;
6. confirm show/event context;
7. choose from only valid audiences;
8. preview the fan-facing gallery;
9. publish with idempotency;
10. choose the next action:
   - Message people from this show;
   - Message all fans;
   - Share;
   - Return to the originating conversation with the gallery selected.

Later improvements, after the core path is reliable:

- explicit cover selection;
- draft autosave;
- safe HEIC conversion with matching client/server validation;
- paste and drag/drop;
- measured upload progress.

Short video is not part of this plan. Photo reliability and value come first.

## 9. Target campaign experience

Use one frontend campaign flow while preserving separate backend campaign and conversation systems.

### Step 1 — Audience

- One fan routes to a direct conversation;
- All fans;
- Fans from a show.

A show row should display:

- show identity;
- date and place;
- checked-in count;
- reachable Faneqo inbox count;
- reachable email count.

### Step 2 — Delivery

- Faneqo inbox;
- Email.

Changing the channel must request a fresh server preview. There is no silent fallback.

### Step 3 — Content

- message text;
- emoji;
- existing gallery;
- create gallery;
- ordinary DM images remain limited to direct conversations unless a separate campaign-image design is approved.

### Step 4 — Review

Show:

- audience;
- channel;
- exact eligible count;
- cooldown/skipped count;
- attached gallery;
- clear private-delivery language;
- confirmation before send.

### Step 5 — Result

Show only proven states:

- queued;
- sending;
- private messages added/sent;
- skipped;
- failed;
- email delivered only when provider data proves it;
- seen only when canonical conversation state proves it.

## 10. Gallery-reference campaign contract

This is the highest-value missing connection.

The target behavior:

1. the artist selects a published gallery;
2. the server validates band ownership and sender permission;
3. for a show-attendee campaign, gallery/show/audience context must be compatible;
4. the campaign snapshots eligible recipients;
5. the worker creates or reuses one private conversation per fan;
6. each message references the same ArtistUpdate;
7. no media is copied;
8. every read rechecks current viewer access;
9. revoked access renders the existing locked placeholder;
10. replies return to the normal Messages inbox.

Before implementation, audit how the campaign durably stores the artistUpdateId. Do not overload body text or add a schema field casually. If a schema change is the cleanest contract, stop and document migration, rollback, boot, and compatibility requirements first.

## 11. FanPassport and Rive direction

FanPassport remains private-by-default, cinematic, personal, collectible, and relationship-centered.

Possible presentation sections using the same reference system:

- Nights I Was There — verified show memories;
- Saved From Artists — only after the product meaning and authorization of general galleries are approved.

Do not create separate storage systems for these sections.

Rive remains presentation only. Appropriate uses:

- memory-captured confirmation;
- opening a verified night;
- subtle relationship-state transitions.

Rive must never block authorization, gallery loading, saving, sharing, reduced motion, or visible text. The branded .riv asset still needs to satisfy the existing runtime contract and acceptance checks.

## 12. Analytics vocabulary — audit before instrumentation

Do not add ad hoc events merely because a button exists.

The vocabulary audit must define:

- actor;
- subject;
- band;
- gallery;
- show/event context;
- campaign/conversation context;
- timestamp;
- privacy classification;
- idempotency/deduplication;
- whether the event is intent, attempted action, successful outcome, or verified relationship fact.

Candidate high-value outcomes:

- authorized gallery opened;
- gallery saved to FanPassport;
- save removed;
- gallery shared;
- gallery sent in a direct message;
- gallery sent through a campaign;
- fan replied after receiving a gallery;
- fan account claimed from a gallery journey.

Band-facing reporting should answer questions such as:

> 184 fans opened the Nashville gallery, 37 saved it, 21 shared it, and 12 replied.

Never log protected URLs, signed capabilities, captions, message bodies, or recipient PII as analytics metadata.

## 13. Execution roadmap

Each phase should be a small reviewable slice. Do not begin the next phase until acceptance criteria for the current phase pass.

### 2026-09-01 implementation checkpoint

Implemented:

- stable authenticated `/galleries/new` creation with a verified Show Recap selector or truthful public general-gallery mode;
- first-class `/galleries` home, filters, navigation, and View / Send / Share actions;
- broken `/updates/new` and Labs create-gallery paths removed from the production journey;
- Show Recap messaging now opens the same campaign composer used by Messages;
- Messages language converged on Conversations and Campaigns;
- Inbox campaigns can carry one durable `ArtistUpdate` relation and can be gallery-only;
- server validation requires same-band ownership, published status, media, and exact audience compatibility;
- show campaigns require the exact Show Recap and attendee visibility; all-fans campaigns require public visibility;
- the worker fans the reference into separate private conversations, reusing the existing server-generated gallery envelope and read-time authorization;
- campaign history and detail disclose an attached gallery without copying protected media.

Still gated:

- `fan_list` gallery exposure;
- Event gallery selection beyond the verified Show Recap/general choice;
- gallery editing, cover selection, drafts, archive/delete, and reference-revocation product semantics;
- outcome analytics and branded Rive work;
- authenticated production smoke coverage at 390, 430, and 1280 widths.

Backend migration note: `MessageCampaign.artistUpdate` is a nullable many-to-one relation. Existing campaigns remain valid with `null`; rollback removes only the campaign relation after any queued gallery campaigns have drained. Delivered conversation messages retain their canonical server-generated reference envelope.

### Phase 0 — Visual proof and contract audit

Goal: validate the real production UX before redesigning.

Deliverables:

- screenshot set at mobile and desktop;
- map of every messaging/gallery entry point;
- current-state journey for owner, manager, viewer, account fan, and email-only fan;
- production controlled-account media/gallery smoke results;
- final naming decision: Conversations/Campaigns/Galleries;
- public and fan_list authorization audit;
- decision log for archive/delete/edit semantics.

Acceptance:

- no unidentified route into messaging or gallery creation;
- no proposed audience without a proven backend access rule;
- screenshots capture every broken, empty, loading, success, and denied state.

### Phase 1 — Repair and graduate show-gallery creation

Goal: make the already-proven verified Show Gallery easy to create without globally exposing Artist Updates.

Deliverables:

- stable authenticated non-Labs creation route tied to a Show Recap;
- remove the broken /updates/new empty-state path;
- Messages empty state chooses a Show Recap before creation;
- Show Recap and Galleries entry points use the same route;
- publish stays on a valid gallery surface;
- safe return to origin;
- originating DM can recover/select the newly published gallery;
- owner/manager/viewer states match editBand permissions.

Acceptance:

- no homepage/dashboard bounce;
- no query parameter treated as authorization;
- verified gallery always has canonical recap/show context;
- publish, retry, refresh, back, and duplicate-submit behavior pass;
- 1-photo and 60-photo paths pass at 390, 430, and 1280 widths.

### Phase 2 — First-class Galleries home

Goal: make galleries an understandable repeat-use band feature.

Deliverables:

- Galleries navigation and index;
- draft/published filters;
- context and audience labels;
- create flow entry;
- view/share/send actions;
- empty, loading, error, and no-permission states;
- design for edit, cover, archive, and references before implementing destructive actions.

Acceptance:

- a first-time band can find and create a gallery without Show Mode knowledge;
- no attendee claim appears for event/general galleries;
- protected and public presentation remains truthful;
- no copied media or second gallery implementation.

### Phase 3 — General and Event gallery creation

Goal: let bands use galleries throughout their creative life.

Deliverables:

- context chooser;
- Event selection;
- general-gallery mode;
- conditional audience chooser;
- explicit protected-delivery readiness and authorization;
- share/view surfaces appropriate to each context.

Stop gate:

- do not expose fan_list until backend authorization, list/detail access, share-link behavior, revocation, and tests are approved.

Acceptance:

- Event without attendance cannot become attendee-only;
- General gallery requires no fake show;
- shared links reveal only currently authorized content;
- public galleries do not weaken protected-media paths.

### Phase 4 — Unified campaign UX

Goal: remove the need to remember separate messaging locations.

Deliverables:

- shared audience/channel/content/review/result shell;
- All Fans and Show Attendees supported;
- contextual Message the Room preselection;
- separate Inbox/Email previews and counts;
- consistent drafts, confirmation, errors, and status language;
- owner-only enforcement remains server-side.

Acceptance:

- one visual system at mobile and desktop;
- every inbox recipient receives a separate private conversation;
- no silent email fallback;
- history accurately names audience and channel;
- email and inbox metrics remain distinct.

### Phase 5 — Gallery-powered campaigns

Goal: let a gallery become a private fan-engagement object.

Deliverables:

- gallery picker inside campaign composition;
- show-compatible filtering;
- durable gallery reference on the campaign;
- per-recipient validation and idempotent fanout;
- rich gallery card in each conversation;
- save/share/reply journey;
- revoked-access behavior.

Acceptance:

- no group chat;
- no media copies;
- no cross-band or cross-show leak;
- ineligible and cooling fans are skipped honestly;
- retries do not duplicate messages;
- FanPassport save still references the source ArtistUpdate.

### Phase 6 — Fan experience and branded memory

Goal: make receiving and keeping a gallery emotionally strong.

Deliverables:

- elite mobile gallery detail;
- consistent artist/show identity;
- clear view/save/share/reply actions;
- FanPassport chronology integration using canonical relationship data;
- branded Rive asset after acceptance;
- account-required and access-revoked states.

Acceptance:

- static fallback is complete;
- reduced motion is respected;
- fan can reopen after reload;
- shared link never grants access;
- inaccessible gallery exposes no protected metadata or media.

### Phase 7 — Relationship outcomes

Goal: prove value to bands without vanity analytics.

Deliverables:

- approved analytics vocabulary;
- idempotent outcome producers;
- gallery reporting;
- campaign-to-gallery-to-reply relationship view;
- privacy review.

Acceptance:

- reports use proven events;
- duplicate opens and retries are handled intentionally;
- protected content/PII is absent from analytics metadata;
- a band can understand reach, saves, shares, and replies.

### Phase 8 — Reliability, scale, and realtime decision

Goal: make the product operationally dependable before adding more interaction features.

Deliverables:

- authenticated production media matrix;
- capability refresh for expired protected images;
- deterministic blob URL cleanup;
- abandoned-upload cleanup;
- database cursor pagination;
- bounded unread aggregation and server search;
- 10/100/500 conversation load measurements;
- shared rate limiter before horizontal scaling;
- offline/reconnect and accessibility audit.

Acceptance:

- uploads, sends, reloads, lightboxes, and authorization pass consistently;
- query work is bounded;
- realtime transport is chosen only with measured need;
- failure states remain retryable and honest.

## 14. Product success measures

### Activation

- percentage of eligible bands that create a first gallery;
- median time from opening Create Gallery to publish;
- percentage that send or share the gallery after publish;
- percentage of Show Recaps that produce a gallery.

### Band retention/value

- galleries created per active band;
- campaigns containing a gallery;
- replies generated after gallery sends;
- repeat gallery creation;
- time saved versus rebuilding posts elsewhere.

### Fan value

- authorized opens;
- FanPassport saves;
- shares;
- replies;
- repeat visits to saved nights;
- account claims after meaningful gallery engagement.

### Reliability

- upload success rate;
- p50/p95 selection-to-ready time;
- send success rate;
- protected stream failure rate;
- expired-capability recovery rate;
- duplicate-prevention rate.

Metrics are directional until their event definitions and privacy rules are approved.

## 15. Screen-review checklist

Collect mobile and desktop screenshots for:

1. Messages Direct list, empty, loading, error, and active thread;
2. fan selector and message request;
3. DM with 1 and 4 images;
4. gallery picker empty and populated;
5. gallery preview before DM send;
6. sent gallery card as artist and fan;
7. Broadcasts empty, list, compose, review, sending, complete, and failed;
8. Show Recap and Message the Room for inbox/email/zero recipients;
9. broken Create Gallery redirect;
10. Show Gallery composer empty/uploading/failed/ready/published;
11. full gallery and lightbox;
12. FanPassport empty/list/detail/save/share/remove;
13. owner, manager, viewer, signed-out, and revoked-access states;
14. widths 390, 430, and 1280.

Every screen review should classify findings as:

- MUST FIX — blocks the core journey, truth, access, or reliability;
- SHOULD FIX — materially improves comprehension or conversion;
- LATER — valuable but not required for the current phase;
- REJECT — duplicates architecture or weakens product truth.

## 16. Process for every phase

1. read this plan, FANEQO_CURRENT_PHASE.md, and FANEQO_NEXT_AGENT_HANDOFF.md;
2. inspect both musicbizqr and qrserver before changing contracts;
3. write a scoped implementation brief and explicit exclusions;
4. identify schema, environment, permission, privacy, and migration stop gates;
5. implement the smallest end-to-end slice;
6. run focused tests;
7. run full Nuxt build and Strapi boot/test gates when affected;
8. perform adversarial authorization and mobile UX review;
9. update docs and handoff;
10. open a PR and squash-merge only after required checks pass.

## 17. Immediate next conversation

Do not begin with a broad redesign.

Begin with the screenshots and Phase 0 journey review. Then scope Phase 1 as the first implementation slice:

> Fix and graduate verified Show Gallery creation, connect the Messages empty state to a real Show Recap selector, and return the published gallery to the originating conversation.

That delivers visible value while preserving every locked architecture decision.
