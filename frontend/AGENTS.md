# Faneqo agent guide

Short operating loop. Architecture is not here.

Repos: `musicbizqr` (Nuxt frontend) · `qrserver` (Strapi backend). Specialist implementation docs live in `qrserver/docs/`.

Before major work:

1. Read `docs/FANEQO_DESIGN_NORTH_STAR.md` (durable design / product principles)
2. Read `docs/FANEQO_MASTER_PRODUCT_ROADMAP.md` (durable product direction)
3. Read `docs/FANEQO_CURRENT_PHASE.md` (what is happening now)
4. Read `docs/FANEQO_NEXT_AGENT_HANDOFF.md` (exact next task)
5. Read `docs/FANEQO_RELATIONSHIP_PLATFORM.md` for architecture invariants only — it does not override the four docs above
6. Inspect existing implementation before coding
7. Preserve locked decisions
8. Reuse before creating (classify REUSE / EXTEND / REPLACE / DO NOT USE)
9. Audit → plan → implement → test → review → handoff
10. Separate canonical truth / derived data / read model / presentation
11. Do not add speculative infrastructure (no Redis / Kafka / microservices / MediaAsset V1 without measured need)
12. Check authorization and N+1
13. Challenge every new persisted object
14. Backend boot-critical changes require boot-path tests; after deploy, `GET /api/health` → 200 and inspect Railway logs
15. Do not deploy / push / commit / reset / restore / stash unless explicitly instructed
16. End phases with `docs/FANEQO_NEXT_AGENT_HANDOFF.md`
17. Report improvements as DO NOW / NEXT PHASE / LATER / REJECT

Frontend map (QR, PWA, auth, payments): `musicbizqr/docs/FANEQO_ARCHITECTURE.md`
