# Faneqo Cursor operating system

How agents work on Faneqo: which mode a task is in, how visual quality is proven, which tools to reach for, and what a handoff must contain.

Source precedence lives in `AGENTS.md` and is not repeated here. Product doctrine lives in `docs/FANEQO_DESIGN_NORTH_STAR.md`. This file owns process only.

---

## Work modes

Pick one mode before starting. Say which one you picked. Do not run the signature-design workflow on a bug fix, and do not ship a signature surface on engineering verification alone.

| Mode | Use when | Emphasis | Done means |
| --- | --- | --- | --- |
| **ENGINEERING** | Server routes, Strapi APIs, data, billing, auth, QR, jobs, migrations, refactors, bug fixes | Correctness, authorization, data integrity, idempotency, failure behavior, performance, tests | Relevant tests/scripts pass; boot path proven when boot-critical; failure and duplicate-run behavior described |
| **PRODUCT / UX** | A flow, state, or screen that must work well but is not a signature surface: forms, settings, management screens, empty and error states, small visual corrections | User goal, flow, state coverage, mobile behavior, failure states, copy clarity | The real flow was exercised in a browser at mobile and desktop width, including at least one failure state |
| **SIGNATURE DESIGN** | Surfaces that carry Faneqo's quality: Living Gallery, Gallery Page, Public Night, Passport, Artist Page, Messaging, Homepage, Show Mode, auth, Night Story | Art direction, composition, hierarchy, photography, typography, space, interaction, motion | Rendered evidence exists at the required viewports and states, and an independent Visual Critic pass has no open BLOCKER or MUST FIX |

Mixed work is normal. A Gallery slice can be ENGINEERING for the adapter and SIGNATURE DESIGN for the chrome. Name both and satisfy both bars.

---

## Signature design loop

1. **Inspect** the current rendered screen and the components it already uses
2. **Understand** the surface mode, audience, task, locked composition, required viewports and states
3. **Research selectively** — only when a specific question would otherwise be guesswork
4. **Explore** two or three directions cheaply before committing to one
5. **Render early** — get a real state on screen before polishing anything
6. **Critique your own candidates** and choose one; say why the others lost
7. **Implement** the smallest coherent version of the chosen direction
8. **Render repeatedly** as you work, at the required viewports, with real content
9. **Independent Visual Critic pass** — `.cursor/agents/faneqo-visual-critic.md`, read-only, given the rendered evidence
10. **Repair BLOCKER and MUST FIX only**, then one verification pass
11. **Technical verification** — build/tests still pass, no product contract broken
12. **Handoff**

The UI Director creates. The Critic judges. Self-critique is required during the work and never replaces the independent pass. Do not keep redesigning after verification to chase taste.

### Who approves what

| Decision | Authority |
| --- | --- |
| Composition is defect-free and coherent | Visual Critic ruling (NOT READY / READY WITH NOTES / SIGNATURE — LOCK) |
| SHOULD FIX and EXPERIMENT items | Product judgment; never auto-implemented |
| Surface is APPROVED V1 / composition FROZEN | Founder only, on real content and — for touch surfaces — a real device |
| Reopening a locked composition | A real defect, or an explicit founder decision |

An agent may not self-certify a signature surface, and emulator capture is never a substitute for real-device sign-off on gesture-driven surfaces.

---

## Rendered evidence

For signature visual work, source code does not establish visual quality. Screenshots of the rendered surface do.

Capture to a local, git-ignored folder:

```
.visual-review/<surface>/<pass>/
  <viewport>-<state>.png
  EVIDENCE.md
```

`EVIDENCE.md` states, in a few lines:

- **Surface** and route (including lab vs production route)
- **Pass** — what this pass changed
- **Viewports** captured, with height where it matters (sheets, dialogs, full-bleed)
- **States** captured — default, open, loading, empty, error, zoomed, reduced-motion, whatever the surface has
- **Fixture or real data** — which, and whether the media is representative (resolution, aspect ratios, longest/shortest names)
- **Real device vs emulated** — say which, per capture
- **Known limitations** — what the evidence cannot prove

Rules:

- Name captures so the Critic can cite one exactly.
- Missing evidence for a required viewport or state is reported as missing, not inferred.
- Do not commit `.visual-review/`. It is working evidence, not product history. Durable conclusions belong in the feature's `CURRENT_PHASE`, `DECISIONS`, or `QUALITY_DEBT`.

Small PRODUCT / UX passes do not need a folder. A described browser check at mobile and desktop width is enough.

---

## Tool doctrine

Tools serve Faneqo product truth. None of them outrank it, and no task fails because an optional integration is unavailable — say what you could not verify instead.

| Tool | Use for | Not for |
| --- | --- | --- |
| **Browser** | Rendered truth: the surface as a person sees it, at real viewports and states | Proving physics that only a finger on glass can prove |
| **Playwright** | Repeatable flow and state evidence where it already exists in the repo | Introducing a new test framework mid-task |
| **Chrome DevTools** | Diagnosing rendering, layout, network, performance, and accessibility problems you can already see | Speculating about runtime cost without a measurement |
| **Mobbin** | Targeted reference research on a specific interaction question | Copying a competitor's layout, or generic inspiration browsing |
| **Superdesign** | Optional divergent exploration for a high-value signature surface | Producing the shipped implementation, or exploring low-stakes screens |
| **Figma** | Design-system, token, and reference work where a file exists | Inventing a second design language outside the North Star |
| **Context7 / docs research** | Library and API behavior you are unsure about | Replacing inspection of this repo's actual implementation |

Extract principles from references, never pixels. If a reference conflicts with the North Star, the North Star wins.

---

## Handoff standard

Scale the handoff to the work. A small fix needs a short report; a phase needs the full set. Use these headings when they carry information — do not pad empty ones.

- **STATUS** — what state the work is in, honestly (`IMPLEMENTED / NOT APPROVED` is a real status)
- **WHAT CHANGED** — files and behavior
- **WHAT IS LOCKED** — what the next agent must not reopen
- **WHAT WAS REJECTED** — considered and refused, so it is not re-proposed
- **PRODUCT / VISUAL EVIDENCE** — tests run, browser checks, `.visual-review` path, Critic ruling
- **TESTS** — commands and results
- **REAL DEVICE VS EMULATED** — never blur these
- **KNOWN DEFECTS** — including quality debt with a revisit trigger
- **UNRELATED DIRTY WORK** — what was already dirty and must be preserved
- **NEXT RECOMMENDED SLICE**
- **DO NOT DO NEXT**
- **GIT STATE** — `git status --short`

---

## Model capability

Do not hardcode model names into durable Faneqo docs; they go stale faster than the product.

- **Signature design** — the highest-capability design and reasoning model reasonably available, high reasoning effort, expanded context when the surface justifies it
- **Routine implementation, tests, refactors** — an efficient capable coding model
- **Independent critique** — must run as its own pass, not as a continuation of the implementation turn

Session-specific model preferences belong in a local, non-canonical note, not in rules or canonical docs.
