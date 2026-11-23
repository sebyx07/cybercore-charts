# Brief: monthly improvement

Fired on the second Friday of the month (UTC days 8-14, `weeks_of_month: [2]`) by `schedules: improve`
in `.dz/maintainer/maintainer.yml`. It runs as a devops task (`mode: devops`): a shell on a
checkout, delivering one pull request.

cybercore-charts is a public chart library maintained by agents, with outside contributors. Once a
month, leave it measurably better: nobody's pull request waiting, current dependencies, no
accessibility or rendering regression, no bytes it does not need, and working with the current
React, Ember and TypeScript. Read `CLAUDE.md` first: its invariants (zero runtime dependencies,
import-safe on a server, unique SVG ids per instance, accessible output, cybercore-css tokens with
fallbacks, a stable public API) bind every change. `bin/check` must be green before any pull
request.

## Rows

- `community-pr-waiting`: a contributor's pull request or issue has waited more than 7 days on the maintainer (§1).
- `dep-major`: a dependency or action major that Dependabot proposed and could not land, or does not propose (§2).
- `peer-range-stale`: a current React, Ember or TypeScript release the adapters or the declarations do not work with (§2).
- `a11y-regression`: a chart without an accessible name, a contrast, keyboard or reduced-motion failure in a chart or on the demo site (§3).
- `render-regression`: a chart draws differently from its committed snapshot, breaks at 390 px wide, or emits `NaN` for an edge-case dataset (§3).
- `bundle-growth`: the gzipped bundle grew since the last release with no feature to show for it, or code every user downloads serves one chart only (§4).
- `docs-drift`: a claim in `README.md`, `llms.txt`, `CLAUDE.md` or the demo no longer matches the code (§5).
- `dead-code`: an unused export, helper, option, dependency or asset (§5).

## 1. People first

```bash
R=sebyx07/cybercore-charts
gh pr list -R $R --state open --json number,title,author,isDraft,createdAt,updatedAt,reviewDecision,statusCheckRollup,mergeable
gh issue list -R $R --state open --json number,title,author,createdAt,updatedAt,labels,comments
```

A contributor's ready pull request that is green and reviewed should already be merged: if one is
open, find out why (a first-time contributor's CI run waiting for approval, a conflict, an
unanswered question) and say so in the answer. A pull request that is red on something its author
cannot fix from a fork (a flaky visual snapshot, a formatting rule) is yours: push the fix to their
branch when the fork allows maintainer edits, or open a follow-up that carries their commits with
authorship kept, and thank them by handle. Never close a contributor's pull request to re-do it
under the bot's name. A merged outside contribution gets its author added to the README's
contributors list in this run's pull request if missing
(`gh api repos/$R/contributors --jq '.[].login'`).

## 2. Dependencies and the frameworks around the library

```bash
bin/setup
npm outdated --long || true
gh pr list -R $R --author app/dependabot --state open --json number,title,createdAt,statusCheckRollup
cat .nvmrc && grep -n '"node"' package.json
jq '.peerDependencies, .peerDependenciesMeta' package.json
npm view react version && npm view ember-source version && npm view typescript version
```

Minors and patches are Dependabot's. Yours are the majors: each one alone on its branch, reading
the upstream migration guide, with `bin/check` green and the built bundle unchanged unless the
major is meant to change it:

```bash
mkdir -p tmp/before && npm run build && cp dist/*.js dist/*.cjs tmp/before/   # on main, before the bump
# after the bump:
npm run build && for f in tmp/before/*; do cmp -s "$f" "dist/$(basename "$f")" || echo "changed: $(basename "$f")"; done
```

A Vite, Rollup, esbuild or TypeScript major can change the output: a changed file is read (the
diff of the unminified bundle), and a changed compile target is a browser-support change, which is
breaking and the owner's.

Peer ranges: the adapters must work with the current major of React and of Ember. When a new
major is out, run the adapter tests against it (`npm install --no-save react@latest
react-dom@latest`, then `bin/check`); a failure is the row, and the fix widens support without
dropping an older major the range already promised. Every devDependency stays a devDependency and
every peer stays optional: the package has no runtime dependencies (`bin/repo-guards`).

Node: when a new LTS line is the active one (`https://nodejs.org/en/about/previous-releases`),
move `.nvmrc` forward. `engines.node` in `package.json` is the floor for people who install the
package: raising it is breaking.

## 3. Accessibility and rendering regressions

```bash
bin/check                                   # the unit suite, the build, the size budget, the docs truth check
npm run test:visual                         # Playwright screenshots of the demo (see CLAUDE.md for what it needs)
PORT=5199 bin/dev --detach                  # the demo at http://127.0.0.1:5199/cybercore-charts/
```

With the browser tools (Playwright MCP, `.mcp.json`), on every chart page of the demo:

- **Names**: every chart's root `<svg>` has `role="img"` and an accessible name
  (`document.querySelectorAll('svg[role="img"]:not([aria-label]):not([aria-labelledby])')` is
  empty, and no chart svg lacks the role); the accessibility snapshot reads as "what this chart
  shows", not as a list of unnamed shapes.
- **Unique ids**: on a page with several charts, `[...document.querySelectorAll('svg [id]')].map(e => e.id)`
  has no duplicate, and every `url(#…)` in a `fill`, `stroke`, `filter` or `clip-path` resolves
  to an element inside the same chart.
- **Keyboard**: Tab through the page. Anything that reacts to the pointer and carries
  information (legend toggles, points with tooltips) is reachable and shows a focus indicator.
- **Contrast**: computed colours of axis labels, value labels, legend text and tooltip text
  against the surface: 4.5:1 (3:1 for large text). Check each theme.
- **Reduced motion**: emulate `prefers-reduced-motion: reduce`, reload: charts draw in their final
  state at once, nothing loops.
- **Small screens**: 390 px wide, no horizontal scroll, responsive charts fit, labels do not
  overlap into illegibility.
- **Edge data**: in the page console, create each chart with `[]`, one point, all-equal values,
  negative values and a zero total: no exception, and no `NaN` in the markup
  (`chart.toSVG().includes('NaN')` is false).
- **Server**: `node -e "import('./dist/cybercore-charts.esm.js').then(m => console.log(Object.keys(m).length))"`
  after a build prints a number: importing in Node touches no browser global.

A failure is a row: fix it in `src/` with a test that fails before the fix, and re-render a
baseline only for an intended change (`npm run test:visual:update`, with the before and after
images in the pull request). `bin/stop` when done.

## 4. Bundle size

```bash
npm run build && npm run check:size
bin/api-diff            # what the public API gained since the last release
```

The budget in `scripts/check-size.ts` is a ceiling, not a target. Compare the gzipped sizes with
the last release's (`npm pack cybercore-charts@latest` into `tmp/`, or the numbers in the last
release pull request). Growth with nothing in `bin/api-diff`'s "added" list to explain it is the
row. Look for: a helper duplicated across charts instead of shared from `src/utils/`, code in
`BaseChart` that only one chart uses, a module with an import-time side effect (it defeats
tree-shaking: `sideEffects` in `package.json` promises there is none), a large constant table that
could be computed. Never raise the budget to make a pull request green.

## 5. Pick at most three improvements, in this order

1. A row from §1 or §3: a person waiting, or something a user sees.
2. A major or a peer range from §2 that blocks security updates, a current Node or a current
   framework.
3. A row from §4.
4. Docs drift: `bin/docs-check` is green by construction, so look at what it cannot see: prose
   claims (browser support, bundle size, what a chart does by default), the demo's code samples
   against the current API, every command in `CLAUDE.md` and `CONTRIBUTING.md` still runs, the
   README screenshot still looks like the demo.
5. Simplification: an option nothing reads, an export nothing in the docs or tests uses
   (removing an export is breaking: mark it for the owner instead), a helper with one caller, an
   unused devDependency (`npx --yes knip`), an asset nothing links.

## 6. Ship

This run delivers one pull request: the highest-ranked improvement, small and reviewable, titled
with what it changes. File each of the others (two at most) as its own ask, with the evidence. The
body gives the evidence: the contrast ratio before and after, the snapshot diff, the gzipped bytes
before and after, the upstream release URL. A visible change carries screenshots at 1440 and 390
wide. User-visible changes get a CHANGELOG `## [Unreleased]` entry. Never bump the version here
(the `release-due` checkup does that); a breaking change (an export or option removed or renamed,
a raised floor) escalates to the owner instead of merging.

A change under `.github/` (a matrix row, a new job or step, a workflow) never shares a pull request
with code. Open it on its own and say in the body that it changes CI: the platform's merge gate
proves only an action pinned to a commit SHA or a narrowed permission on the agent's own pull
requests, and holds every other workflow edit for the owner. Never edit `.dz/maintainer/` here.

If nothing is worth changing this month, do nothing: no empty PRs, no churn.
