# Faneqo agent guide — backend

Repos: `qrserver` (this repo, Strapi v4 backend — canonical data truth) · `musicbizqr` (Nuxt frontend).

The operating system is shared and lives in the frontend repo. Do not fork it here.

- Source precedence, operating loop, safety: `musicbizqr/AGENTS.md`
- Work modes, evidence, tool doctrine, handoff standard: `musicbizqr/docs/FANEQO_CURSOR_OPERATING_SYSTEM.md`
- Architecture invariants: `docs/FANEQO_RELATIONSHIP_PLATFORM.md` (and `.cursor/rules/faneqo-architecture.mdc`)
- Live product phase: `musicbizqr/docs/FANEQO_CURRENT_PHASE.md`. The `qrserver` copies of phase and handoff docs may lag and never override the frontend copies.

Backend work is almost always **ENGINEERING** mode: correctness, authorization, data integrity, idempotency, failure behavior, performance, tests.

## Backend specifics

1. Inspect the existing controller, service, policy, and schema before changing anything; smallest safe change
2. Do not invent a second source of truth in the frontend
3. Keep canonical truth, derived data, and read models separate; challenge every new persisted object
4. Check authorization and N+1 on every route you touch
5. Boot tests, deploy verification, and database safety are owned by `.cursor/rules/faneqo-backend-safety.mdc` — follow it rather than improvising
6. Do not commit, push, deploy, reset, restore, or stash unless explicitly instructed

Specialist implementation docs live in `docs/`.
