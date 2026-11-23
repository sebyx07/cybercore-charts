# Deployment

Two lanes, both from `main`, both through GitHub Actions. Nothing is published
by hand.

- **The npm package.** Merging a pull request that changes `version` in
  `package.json` is the release: `.github/workflows/release.yml` runs the whole
  CI workflow on that commit, builds, publishes to npm through trusted
  publishing (OIDC, with provenance; no token), then creates the tag and the
  GitHub release from the version's `CHANGELOG.md` section. jsDelivr and unpkg
  serve the published `dist/` files. The weekly `release-due` checkup decides
  when a release is due and opens that pull request. Procedure, recovery and the
  one-time registry setup: `RELEASE.md`.
- **The demo site.** `.github/workflows/deploy.yml` builds the demo from the
  library sources on every push to `main` that touches `demo/`, `src/` or the
  package files, and deploys it to GitHub Pages at
  https://sebyx07.github.io/cybercore-charts/. Its chrome is the cybercore-css
  release named in `package.json`: a new cybercore-css version reaches the site
  through a dependency bump, which restyles every page and needs the visual
  baselines re-rendered (`demo/CLAUDE.md`). The site's CDN snippet and its
  integrity hash come from `demo/src/data/cdn.json`, rewritten by
  `demo/scripts/sync-cdn.mjs` after a release is on npm.

Outcome checks: the daily `health` checkup (`.dz/schedules/health.md`) verifies
that `main` is green, the site deploys and answers, npm serves the
`package.json` version with every entry file, the release is tagged, the CDN
serves the bundle and the demo's snippet is current.
