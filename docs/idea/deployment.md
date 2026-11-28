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

Outcome checks: a workflow run is its own verdict, and the platform files a fix
when `main` is red. Nothing polls the published package or the site on a
schedule: the `health` checkup was removed on 2026-11-28 (across the fleet it
fired 270 times in 30 days and produced no merged fix).
