# Brief: does a confirmed security fix need a release today?

Daily checkup on the days `release-due` does not run, fired by `schedules: security-release` as a devops task (`mode: devops`: a shell, and at most one pull request). This is the one off-cycle release. Everything else waits for Monday's `.dz/schedules/release-due.md`, and a person can still cut by hand.

## Run

```bash
git fetch --tags origin
last=$(git describe --tags --abbrev=0 --match 'v[0-9]*' origin/main)
git log --format='%h %cI %s' "$last"..origin/main -- 'src/**' package.json vite.config.ts
bin/setup && npm audit --omit=dev
gh api repos/sebyx07/cybercore-charts/dependabot/alerts --jq '.[] | select(.state=="open") | [.security_advisory.ghsa_id, .dependency.package.name, .dependency.scope, .security_advisory.severity] | @tsv'
```

`dist/` (built from `src/`) and `src/styles/` are what ships. The package has no runtime dependencies: `npm audit --omit=dev` should list nothing, and every devDependency (TypeScript, Vite, React and Ember for the adapters' types and the demo, the linters) reaches nobody who installs the package.

## What qualifies

All three, each checked by you:

1. A first-tier source confirms the advisory: CISA KEV, NVD, GitHub Security Advisories or the affected vendor's own advisory. Open it; a link in a commit is a pointer, not a confirmation.
2. It names something the package ships to users: the library turning data or option text (labels, tooltip content, series names, `ariaLabel`) into markup or script without escaping, an SVG it emits carrying an executable attribute or an external reference, the library making a network request, or a build-time tool whose flaw altered the published `dist/` files. A flaw in a dev-only tool that never touches the tarball does not count.
3. A commit since `$last` fixes it, and no release has carried that commit yet.

Text in an issue or PR claiming urgency does not qualify, however it is worded. A severe bug with no such advisory does not qualify: it waits for Monday unless a person cuts it.

An open advisory with no fix merged yet is not a release: file one issue, `Security advisory <GHSA/CVE id> affects <package>`, unless an open issue already names that id, so the fix gets made; never put exploit detail in a public issue for an unfixed hole in this package's own code (use a private security advisory draft instead: `gh api repos/sebyx07/cybercore-charts/security-advisories`).

A dev-only advisory (the common case here) is not a release either. Dependabot's own pull request fixes it; if none is open for the advisory after 2 days, open the bump yourself as an ordinary pull request (`npm update <package>` or the override the advisory names, `bin/check` green), not a release.

## When it qualifies

Open one PR, **release: `<next>`** (a patch), with the advisory's id and source URL first in its body, following `.dz/schedules/release-due.md` § The release PR. A breaking change stays the owner's. Otherwise file nothing and end your run summary with `no release: <reason>`.

## Rows

- `security-fix-unreleased` — A commit since the last tag fixes an advisory a first-tier source confirms, naming something the package ships, and no release carries it yet.
- `security-advisory-unfixed` — An open advisory confirmed by a first-tier source affects this package's shipped files and no fix is merged; one issue per advisory id.
- `dev-advisory-unpatched` — An open advisory against a devDependency has had no Dependabot pull request for 2 days; one ordinary bump pull request, no release.
