# Faneqo Messaging and Relationship Frontend — Continuation Pointer

**Status:** active continuation guide  
**Canonical cross-repository guide:** `qrserver/docs/FANEQO_MESSAGING_RELATIONSHIP_START_HERE.md`

Read the backend guide before changing Messages, protected media, Labs, Artist × Fan progression, Signals, or Fan Passport. It contains the architecture locks, audit findings, risk register, safe delivery activation checklist, and execution phases.

## Frontend contracts to preserve

- Nuxt 3 Composition API remains the implementation style.
- Use the shared `MediaItem` normalization contract; Upload.file ID is identity.
- Use the existing shared media upload queue, grid, preview, and lightbox.
- Direct messages support at most four images; show galleries support at most sixty.
- Do not enable public-storage fallback for private message images.
- Labs previews are not proof that the production delivery environment is ready.
- Keep messaging and gallery UX mobile-first at 390/430px, then verify 1280px.
- Keep messaging connected to the relationship-journal direction rather than adding another score-first CRM surface.

## Focused checks

Run all frontend messaging/media/Labs checks:

```bash
npm test
```

Run one group:

```bash
npm run test:messaging
npm run test:media
npm run test:labs
```

Before handoff, also run:

```bash
npm run build
```

Do not merge or deploy when any focused test or build is failing.
