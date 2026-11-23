# Post-merge fix sweep

Weekly sweep, Thursdays 19:00 UTC, OFFERED and off: the `fix-sweep` entry in
`.dz/maintainer/maintainer.yml` is commented out, and uncommenting it is the opt-in. It runs as a
devops task (`mode: devops`: a shell on a checkout, at most one pull request). It is the
developerz.ai platform's standard fix sweep, adapted to cybercore-charts: the changes merged into
`main` in the last 7 days, read again for the defects their own review let through, and fixed in
one pull request. Read `CLAUDE.md` and `src/CLAUDE.md` first: their invariants bind every fix.

## 1. Find the touched area

```bash
bin/setup
git log --since='7 days ago' --first-parent --format='%h %s' origin/main
git diff --stat "$(git rev-list -1 --before='7 days ago' origin/main)" origin/main
```

The touched area is those files and what reaches them (`src/charts/BaseChart.ts`, the entries
`src/index.ts` and `src/cdn.ts`, the adapters under `src/react/` and `src/ember/`, the demo
playground that shows the chart). Nothing merged, or only dependency bumps with an unchanged build:
say so and stop. `bin/setup` or `bin/check` exiting 75 means the environment is missing: nothing
was graded, report that and stop.

## 2. Hunt

Read the touched area for, worst first:

- **broken output**: `NaN` in a `d`, `x`, `y`, `width` or `transform` for empty, single-point,
  all-equal, zero-total or non-finite data; an id shared by two charts on a page (a literal id
  instead of `this.ref()` / `this.url()`); a throw on import without a DOM
- **access**: a new mark not registered with `addItem()`, a series missing from the data table or
  the generated description, meaning carried by colour alone, an animation that ignores
  `shouldAnimate()`
- **leaks**: a listener, observer, frame or node the change creates and `destroy()` does not
  release
- **API**: an export, option, event or class member removed, renamed, narrowed or made required,
  or a changed default (`bin/api-diff`); a literal colour where a token with a fallback exists; a
  core option the React key list or the Ember modifier cannot reach
- **reuse**: a new copy of a helper `BaseChart` or `src/utils/` already has; name both
- **drift**: a line in `README.md`, `llms.txt`, `docs/` or the demo's data files that the merged
  change made false (`bin/docs-check`)

Skip tests, fixtures and generated files. Confirm before you claim: a defect is one you can make
fail.

## 3. Fix

- One pull request for the whole sweep, one goal: the defects this week's merges brought in.
- For each defect, a test that fails before the fix and passes after (vitest, in the matching file
  under `tests/`; two instances on one page for anything with an id). Run it red first.
- A visible fix carries before and after screenshots at 1440 and 390 wide, re-rendered baselines
  when the demo changed (`npm run build:demo && npm run test:visual:update`), and a CHANGELOG
  `## [Unreleased]` line.
- Delete what the fix makes dead.
- `bin/check` must be green before you open the pull request.
- A defect you cannot make fail is not fixed here: name it in the report, with no pull request for
  it.
- A fix that would remove, rename or retype public API, change a default or add a runtime
  dependency is the owner's decision: report it.
- Do not edit `.github/`, `.dz/` or the version in `package.json`.

No defect: no pull request. A clean week is a good result; say so and stop.

## Report

The range of merges you read, each defect with its `path:line`, its test and its fix, and what you
could not cover, with why.
