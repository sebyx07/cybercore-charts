# AI-first scorecard

> Hand-written for the AI-maintenance onboarding pass of 2026-11-23, describing the repository as
> it stands once that pass's pull request merges. The next developerz.ai onboarding run rewrites
> this file whole; the latest run wins, and the same card is stored on the platform.

- Computed: 2026-11-23
- Proof: **not yet proved on GitHub** — written before the pass merged. Local results are named
  per item; the workflows have not run on GitHub yet, and items marked _pending_ depend on a
  repository or registry setting.
- Score: 13 of 15 items ok, 2 pending

## `policy` — ok

- .dz/maintainer/maintainer.yml established (validates against maintainer.v1.json; `dz-contract` answers ok)
- .dz/maintainer/reviewer.md established (public API, SSR safety, unique SVG ids, accessibility, tokens; community tone)
- .dz/schedules/{health,release-due,security-release,improve}.md established
- platform-standard briefs: repo-census and repo-score scheduled; hygiene, devops and fix-sweep offered (entries commented)
- .dz/pipeline/agent-pipeline.json established

## `brain` — ok

- CLAUDE.md rewritten (it described charts, options and a tag-push release that did not exist); under the 12,000-character cap, enforced by bin/repo-guards
- nested: src/CLAUDE.md (rendering rules, extending BaseChart), demo/CLAUDE.md, .github/CLAUDE.md

## `roster` — ok

- .claude/agents/visual-a11y-reviewer.md

## `skills` — ok

- .claude/skills/verify-change and .claude/skills/add-chart established

## `scripts` — ok

- bin/setup, bin/dev, bin/stop, bin/check, bin/repo-guards, bin/api-diff, bin/docs-check established
- bin/check exits 75 when Node or node_modules is missing
- bin/api-diff compares the built declarations with the published tarball; bin/docs-check type-checks every README and llms.txt snippet against src/
- down: bin/stop

## `wiring` — ok

- .mcp.json established: playwright, pinned to an exact version, no secret

## `commands` — ok

- .claude/commands/release.md (prepares the release pull request; never publishes)
- .claude/commands/bug-sweep.md (sweeps one area with chart-specific detectors; a failing test first)

## `access` — pending

- no secret is needed: npm publishing is trusted publishing (OIDC) from the `release` environment
- the trusted publisher must be configured once on npmjs.com by the owner (RELEASE.md § One-time setup); until then the first release run fails at `npm publish`

## `layout` — ok

- single package at the root; demo/ is the documentation site and is not published

## `smoke_test` — ok

- `npm run check:package` packs the tarball, installs it into an empty project and imports every entry (ESM, CommonJS, the UMD global, a TypeScript consumer); versions 0.1.0 to 0.2.0 were published without those files, which this step now catches
- tests/visual shoots every demo page

## `env_example` — ok

- nothing to configure: no .env is read, .mcp.json interpolates no variable

## `agents_md` — ok

- AGENTS.md is a symlink to CLAUDE.md (bin/repo-guards checks); llms.txt is the reference for tools that use the library (bin/docs-check proves its snippets compile and its options exist)

## `per_workspace_brains` — ok

- single-package repository: 0 workspaces

## `docs_readme` — ok

- docs/README.md indexes docs/idea/ (overview, principles, stack, data-model, deployment, direction draft) and docs/standards/
- README.md rewritten (the old one documented PieChart, RadarChart, createTheme and options that never existed); CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md, RELEASE.md, CHANGELOG.md with the past releases reconstructed

## `gate_proved` — pending

- bin/check: see the pass's pull request for the run at head
- ci.yml (`CI OK` aggregate), release.yml and deploy.yml have not run on GitHub yet
- the ruleset `main-protection` on `main` is active and requires the `CI OK` check (`gh api repos/sebyx07/cybercore-charts/rulesets`); it turns green once ci.yml has run
