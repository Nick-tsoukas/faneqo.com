---
name: ag-build
description: Agent-skills build lifecycle. Implement tasks incrementally with TDD. Use for /ag-build, /build, or /build auto.
---

# ag-build

Custom Cursor wrapper for the agent-skills build lifecycle (upstream ships this as `.claude/commands/build.md`, not under `skills/`).

Invoke `.cursor/skills/incremental-implementation/SKILL.md` alongside `.cursor/skills/test-driven-development/SKILL.md`.

## Modes

- **`/ag-build`** or **`/build`** — implement the next pending task, then stop.
- **`/ag-build auto`** or **`/build auto`** — generate the plan if needed, get a single approval, then implement every task without stopping between them.

`$ARGUMENTS` selects the mode. Treat `auto` (canonical) or `all` as autonomous mode; anything else (or empty) is the default single-task mode.

## Default: one task

1. Read the task's acceptance criteria
2. Load relevant context
3. Write a failing test (RED)
4. Implement minimum code to pass (GREEN)
5. Run full test suite
6. Run the build
7. Commit with a descriptive message
8. Mark the task complete and stop

## Autonomous (`auto`)

1. Require a spec at `SPEC.md`, `docs/SPEC.md`, or under `spec/`. Else stop and tell user to run spec-driven-development first.
2. Clean git baseline (`git status --porcelain`); stop if unrelated dirty files.
3. If no `tasks/plan.md`, invoke planning-and-task-breakdown.
4. Present plan; wait for clear approve/go/yes only.
5. Execute every task in order with the default loop; one commit per task.
6. Stop and ask on test/build failure, ambiguity, or irreversible risk.
7. Summarize at end.
