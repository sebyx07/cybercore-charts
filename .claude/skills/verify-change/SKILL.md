---
name: verify-change
description: Use when proving a change in cybercore-charts before a commit or pull request, when bin/check, eslint, prettier, tsc, vitest, the build, the size budget or a visual test fails, when a script exits 75, or when asked how to run the tests, the linters, the demo site, or how to check that the public API or the docs did not break.
---

# Verify a change

`bin/check` is the gate. CI runs the same steps, so green locally is green there (`bin/repo-guards` fails when the two drift).

| Tier | Command | When |
|---|---|---|
| tightest | `bin/check files <paths>` | after each edit; the only tier allowed when agents share the checkout |
| fast | `bin/check fast` | after a slice works |
| full | `bin/check` | once, before the pull request |

`bin/check --help` lists exactly what each tier runs and what `fast` and `files` do not see.

Other commands: `bin/docs-check [files]` (every snippet in README and `llms.txt` type-checks against `src/`, every option they name exists; part of the full tier) · `bin/api-diff [version]` (exports, options and members removed, changed or added against the published package) · `bin/setup` (install, idempotent) · `bin/dev [--detach]` (the demo, http://127.0.0.1:5173/cybercore-charts/) · `bin/stop`.

## Exit codes

| Exit | Means | Do |
|---|---|---|
| 0 | green | commit |
| 75 | environment missing: Node, `node_modules`, the registry. Nothing was graded | `bin/setup`, rerun. Never treat it as a failing change |
| other | a check ran and is red | read the `failing command` / `rerun` lines at the end of the output |

## Rules

1. Run from anywhere; the scripts `cd` to the repo root and pick the Node from `.nvmrc`.
2. Changed `package.json` or `package-lock.json` → `bin/setup` before `bin/check` (otherwise exit 75).
3. Fail one, fix one: rerun only the failing step (`npx eslint <file>`, `npx vitest run <file>`, `npx vitest run <file> -t "<name>"`, `npx prettier --check <file>`), then the tier. `npm run lint:fix` and `npm run format` apply the autofixes.
4. A new option, export or chart gets a test of what it does. Write it first and see it fail: a green run that never went red proves nothing.
5. Changed `src/types.ts`, an export in an entry point, or a public or protected member of a chart class → `bin/api-diff`. Exit 1 means something callers rely on was removed or changed type: that is a breaking change, stop and say so, unless the two printed lines show a pure widening.
6. Changed an option, a method, an export or an import path → `bin/docs-check`, after updating `README.md` and `llms.txt`. Snippets there are real code: they are type-checked, so no `[...]` placeholders.
7. Red gate → fix the cause. Never an `eslint-disable`, `@ts-expect-error`, `any`, loosened rule, skipped test, raised size budget, or a step removed from `bin/check`.
8. Never trust a piped exit code: `bin/check | tail` reports `tail`. Run it bare, or read `${PIPESTATUS[0]}`.
9. Sharing the checkout with other agents: `bin/check files <your paths>` only. Never bare `bin/check` or `fast` (they grade everyone's uncommitted work and rebuild `dist/` under them), never `bin/dev` on the default port (`PORT=<free port> bin/dev --detach`).

## What the unit suite cannot see

Tests assert the SVG that is produced, not how it looks or behaves on a page. After `bin/check`, for a change to anything drawn or interactive:

1. `PORT=5199 bin/dev --detach`, open the changed chart's page with the browser tools at 1440 and 390 wide.
2. Hand it to the `visual-a11y-reviewer` agent (accessible name, unique ids, contrast, keyboard, reduced motion, edge data); fix every finding in one batch; recapture.
3. `npm run test:visual` (the committed Playwright snapshots; exit 75 when its environment is missing, and CI's visual job is then the judge). Re-render a baseline only for an intended change (`npm run test:visual:update`) and say so in the pull request.
4. `bin/stop`.

Two charts on one page is the case single-chart tests miss: a gradient, filter or clip path shared by id makes the second chart draw with the first one's. Always look at a page with several charts.
