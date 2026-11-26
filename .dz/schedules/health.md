# Brief: is the project healthy?

Weekly checkup (Mondays 07:00 UTC), fired by `schedules: health` in `.dz/maintainer/maintainer.yml`. cybercore-charts is
maintained so that nobody has to watch it. This covers the failures no issue or PR announces.
Read-only (a scout): it reports failing rows, it never re-runs a publish, tags, or pushes. A row
whose only fix is under `.github/` or `.dz/` is stated in the run's answer instead of filed: the
platform refuses a checkup filing that names CI or policy paths, and the monthly `improve` task
(`.dz/schedules/improve.md`) or the owner picks it up from there.

```bash
R=sebyx07/cybercore-charts
SITE=https://sebyx07.github.io/cybercore-charts/
CDN=https://cdn.jsdelivr.net/npm/cybercore-charts
v=$(gh api "repos/$R/contents/package.json" --jq .content | base64 -d | jq -r .version)
tag="v$v"
```

| Signal | Command | Healthy |
|---|---|---|
| `main` is green | `gh run list -R $R --workflow ci.yml --branch main --event push --limit 1 --json conclusion,headSha,url` | `success` (the `CI OK` job passed) |
| the demo site deploys | `gh run list -R $R --workflow deploy.yml --branch main --event push --limit 1 --json conclusion,url,createdAt` and `gh api repos/$R/pages --jq .build_type` | the run is `success` (or in progress and under 30 minutes old) and `build_type` is `workflow` (Pages is served by the Actions deploy, there is no `gh-pages` branch) |
| the demo site answers | `curl -sS -o /dev/null -w '%{http_code}' $SITE` and `curl -fsS $SITE \| grep -c '<div id="root">'` | `200`, and the page is the built demo (the count is 1) |
| the last release published | `gh run list -R $R --workflow release.yml --limit 1 --json conclusion,displayTitle,url,createdAt` | `success`, or no run yet, or one in progress |
| npm serves the `package.json` version | `curl -s -o /dev/null -w '%{http_code}' "https://registry.npmjs.org/cybercore-charts/$v"` (this exact version, so a prerelease counts) | `200`; or `404` while a `release.yml` run for `$v` is in flight or under 2 h old. Any other code is a failed read, not a verdict |
| the release is tagged | `gh api "repos/$R/git/ref/tags/$tag" --jq .ref` and `gh release view "$tag" -R $R --json tagName` | both exist once npm serves `$v` |
| the published package is whole | `for f in $(gh api "repos/$R/contents/package.json" --jq .content \| base64 -d \| jq -r '[.main, .module, .types, .unpkg, (.exports \| .. \| strings)] \| unique[] \| select(startswith("./dist/"))'); do printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "$CDN@$v/${f#./}")" "$f"; done` | every file `package.json` names answers `200`, once npm has served `$v` for 1 h. A `404` means the tarball shipped without an entry point: imports of the package fail for everyone on that version |
| the CDN bundle works | `curl -fsS "$CDN@$v/dist/cybercore-charts.umd.min.js" \| grep -c 'CyberCharts'` | at least 1. The README's `<script>` tag points here: a 404 breaks every page that copied it |
| the demo's install snippet is current | `gh api "repos/$R/contents/demo/src/data/cdn.json" --jq .content \| base64 -d \| jq -r .version` against `npm view cybercore-charts version` | the two versions are equal, or the release is under 8 days old (the weekly `release-due` task syncs it) |
| Dependabot is not stuck | `gh pr list -R $R --author app/dependabot --state open --json number,title,createdAt,statusCheckRollup` | none open more than 7 days, none red more than 2 days |
| community pull requests are not waiting | `gh pr list -R $R --state open --json number,title,author,isDraft,createdAt,updatedAt,reviewDecision,statusCheckRollup` | no non-draft pull request from a person has gone more than 3 days without a review or an answer from the maintainer |

If a workflow named above does not exist (`gh workflow view <file> -R $R` fails), that is the
row, not an error in this brief. A command that cannot run (no network, `gh` unauthenticated) is a
failed read: say `not read`, never a verdict.

## Rows

Each failing row is filed once, with the exact title below, unless an open issue with that title
(or the same title prefix for rows with a variable) already exists:
`gh issue list -R $R --state open --search '"<title>" in:title'`. The body carries the command, its
output and the run URL. A red `main` comes first: nothing releases from it.

- `main-red` — title `main is red at <short sha>`: the last push run of `ci.yml` on `main` did not conclude `success`. If an older open `main is red at …` issue names another sha, or `main` is green again while one is open, say so in the answer with the run URL (this run closes nothing).
- `pages-deploy-red` — title `demo site deploy is failing`: the last `deploy.yml` push run on `main` failed, or Pages is not built by the workflow (`build_type` is not `workflow`).
- `site-down` — title `the demo site is not answering`: the site does not answer `200`, or answers without the built demo. Add the status code and `curl -sSI $SITE` output.
- `release-unpublished` — title `release v<version> did not publish`: the last `release.yml` run did not conclude `success`.
- `npm-version-lag` — title `npm does not serve <version>`: npm answers 404 for `$v` and no release run is in flight or under 2 h old.
- `release-untagged` — title `<tag> is published but not tagged`: npm serves `$v` but the `$tag` tag or GitHub release is missing.
- `package-incomplete` — title `cybercore-charts@<version> is published without <file>`: npm has served `$v` for over 1 h and a file `package.json` names (`main`, `module`, `types`, `unpkg`, an `exports` target) answers 404 on the CDN. Name each missing file. The fix is a new patch release, never a republish.
- `cdn-not-serving` — title `jsDelivr does not serve cybercore-charts@<version>`: the UMD bundle is missing, empty, or does not define `CyberCharts`. Say which.
- `cdn-snippet-stale` — title `the demo's CDN snippet is behind <version>`: `demo/src/data/cdn.json` names an older version than npm's `latest` more than 8 days after the release.
- `dependabot-stuck` — title `Dependabot PR #<n> is stuck`: a Dependabot PR open more than 7 days, or red more than 2 days. Say why it is stuck (red check, conflict, waiting on review) in the body.
- `community-pr-waiting` — title `PR #<n> from @<author> is waiting on the maintainer`: a contributor's ready pull request has had no review and no answer for more than 3 days. Say what it waits on (a first-time contributor's CI run needing approval, a review, a merge).

Never delete a tag, re-run a publish, `npm publish` or push to `main` from here.
