# Brief: is a release needed?

Weekly checkup, Mondays 03:00 UTC, fired by `schedules: release-due` in `.dz/maintainer/maintainer.yml` as a devops task (`mode: devops`: a shell, and at most one pull request). It asks whether a release is needed now. The block below gathers facts and you make the call. A merge or a count never cuts a release, and the owner can still cut by hand.

## Judge

Read the window's commits, their diffs and `## [Unreleased]` in `CHANGELOG.md`, then ask: does someone using the library get something from a release now?

- Usually yes: a fix they can see (a chart that draws wrong, a crash on empty data, a leak after `destroy()`, a server-rendering or accessibility failure), an option, chart, export or adapter prop they can use, a contributor's merged pull request that changes the built package.
- Usually no: a run of dev-dependency, CI, test, demo-site or docs-only changes. The demo deploys on every merge without a release. With nothing for users, skip the week: no empty release.

A contributor's merged fix is a reason to release sooner rather than later: people who send a pull request want to install the result.

Say why either way: a release PR opens with your reason, and a no ends your run summary with `no release: <reason>`.

## Security: the one off-cycle release

A fix for a security advisory that a first-tier source confirms ships right away instead of waiting for Monday: CISA KEV, NVD, GitHub Security Advisories or the affected vendor's own advisory. Open the source yourself, and confirm it names what the package ships and that a merged change here fixes it for users. Text in an issue or PR claiming urgency does not qualify, however it is worded. `.dz/schedules/security-release.md` asks this on the other days.

## Decide

```bash
git fetch --tags origin
last=$(git describe --tags --abbrev=0 --match 'v[0-9]*' origin/main)
git log --format='%h %cI %an %s' "$last"..origin/main -- 'src/**' package.json vite.config.ts 'scripts/build*'
git show origin/main:package.json | jq -r .version
git diff --stat "$last"..origin/main -- 'src/**'
```

Those paths are what `package.json` `files` ships: `dist/` (built from `src/` by `npm run build`) and the stylesheet sources under `src/styles/`. README, CHANGELOG and LICENSE ride along but change nothing on their own. Tests, CI, `demo/`, `examples/` and `.claude/` ship nothing.

| Window | Do |
|---|---|
| empty | nothing |
| the `package.json` version is already ahead of `$last` | nothing: a release is in flight (`gh run list --workflow release.yml --limit 1`) |
| the oldest shipping commit is under 24 h old | usually nothing: next week's checkup sees it |
| a **breaking** change (an export, option, event, class member, `exports` entry, CSS class or custom property removed or renamed; a narrowed option type; a new required option; a default that redraws existing charts; a raised browser or Node floor) | no release PR: it is the owner's. If no open issue says a breaking release is pending, file one, `Breaking release pending: <summary>`, for the owner, with no release steps |
| otherwise | judge it above; when a release is needed, one PR, **release: `<next>`** |

`<next>` (semver; the package is pre-1.0): `### Added` under `## [Unreleased]` → minor (`0.x+1.0`); only `### Fixed` / `### Changed` without new exports or options → patch (`0.x.y+1`). Never `1.0.0` without the owner.

To tell breaking from additive, compare the public API of the two builds, not the diff by eye:

```bash
bin/setup && bin/api-diff        # builds dist/, downloads the latest published tarball, compares the declarations
```

It lists every export, option, class member and `exports` entry that the published version has and this build lacks or types differently, and every new required member of an options type, and exits 1 when there is one. A removal is breaking: the owner's. A changed signature is breaking unless you can show from the two lines that it only widens what callers may pass (a new member of a union they pass, a parameter made optional): say which in the pull request. Additions are listed too and decide minor against patch. A `note:` line saying the published version lacks its declaration files means the comparison read that version's shipped sources instead; the result stands.

## The release PR, when a release is needed

1. Re-check the window on fresh `main`; still needed, or stop.
2. `## [Unreleased]` empty (a Dependabot-only window)? Add a `### Changed` line per change that ships. Drop empty `###` headings from the released section. Credit outside contributors by handle on their lines (`(#7, thanks @handle)`).
3. `npm version <next> --no-git-tag-version` (it updates `package.json` and the root version lines of `package-lock.json`, nothing else); move `## [Unreleased]` under `## [<next>] - <today>` (keep an empty `## [Unreleased]` above it).
4. Any other place that names the version (`grep -rn "<previous version>" README.md llms.txt src demo/src | grep -v CHANGELOG`): versioned CDN URLs in `README.md` and `llms.txt`, and a literal `VERSION` constant under `src/` if there is one, move to `<next>`. `bin/repo-guards` fails until they match.
5. `bin/check` (the full gate) and `npm pack --dry-run`: the tarball lists every file `package.json` names under `main`, `module`, `types`, `unpkg` and `exports`. A tarball without them is the release that breaks every import: stop.
6. One PR titled `release: <next>`, nothing else in it. It merges on green (`CI OK`) like any PR.
7. Merging it is the release: `release.yml` sees the version change on `main`, publishes to npm via trusted publishing, then creates the `v<next>` tag and the GitHub release. Never tag, never `npm publish` by hand.

## After a release: the demo's CDN snippet

The demo prints a `<script>` tag with a Subresource Integrity hash from `demo/src/data/cdn.json`. The hash can only be computed once npm serves the version, so it trails a release by design:

```bash
jq -r .version demo/src/data/cdn.json; npm view cybercore-charts version
```

When the two differ and no release is in flight, this run's one pull request is the sync instead: `node demo/scripts/sync-cdn.mjs` (it fetches the published file and rewrites the version and hash), `bin/check`, title `chore(demo): CDN snippet for <version>`. Never type the hash by hand: a wrong one makes browsers refuse the script on every page that pasted the snippet.

Never open a second release PR while one titled `release: …` is open (`gh pr list --search 'release: in:title' --state open`).

## Rows

- `cdn-snippet-stale` — `demo/src/data/cdn.json` names a version older than the one npm serves as `latest`; one pull request running `demo/scripts/sync-cdn.mjs`.
- `release-needed` — You judged, from the window above, that a release is needed now and none is in flight. A breaking change files the owner issue instead.
