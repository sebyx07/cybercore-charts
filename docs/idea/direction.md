# Direction

> **Draft for the owner to correct.** Written on 2026-11-23 from `README.md`,
> `CHANGELOG.md` (`## [Unreleased]` and 0.1.0 to 0.2.0) and the pull-request
> history; nothing here was stated by the owner. No pull request has merged yet:
> the releases so far were pushed to `main` directly, and the work under
> `## [Unreleased]` is the open pull request #6, so the CHANGELOG is the main
> evidence. Every line is a reading of what the project already does, not a new
> goal. Edit it in place, then remove this note. Until then, agents treat it as
> maintenance guidance only, and `scout.survey` stays at its default
> (`broken_only`) in `.dz/maintainer/maintainer.yml`.

## What the product is for

Neon charts for a web page with nothing else to install: line, bar, donut, gauge
and sparkline charts drawn as SVG by one small TypeScript package, usable from
ES modules, CommonJS, a `<script>` tag, React or Ember, and matching a page
styled with cybercore-css. Readers: people who install the npm package or copy a
CDN URL, people who wrap it in React or Ember, and AI coding tools that read
`llms.txt`.

## What "better" means here

Ranked as the recorded work so far ranks it:

1. **The package people install works.** 0.1.0 to 0.2.0 were published without
   their ESM, CommonJS and type files; the fix, and the check that installs the
   packed tarball, lead `## [Unreleased]` → Fixed.
2. **Nothing users already rely on breaks unannounced.** Exports, options,
   events, classes and custom properties are public API (`CLAUDE.md` §
   Invariants); every break under `## [Unreleased]` → Changed is marked
   **Breaking** with the way to keep the old behaviour.
3. **Accessible without effort.** Title, description, data table, keyboard
   access, reduced motion and high contrast, on by default (`## [Unreleased]` →
   Added; reduced motion since 0.2.0).
4. **Draws any data without breaking.** Empty, single-point, equal, zero-total
   and non-finite data, several charts on one page, large series (0.2.0 →
   Changed; `## [Unreleased]` → Fixed).
5. **Follows the page's theme.** Colours are cybercore-css tokens with
   fallbacks, a scoped `data-theme` included (`## [Unreleased]` → Added).
6. **Works where people work.** Server rendering, Next.js server components,
   React Strict Mode, an Ember modifier, CDNs (`## [Unreleased]` → Added and
   Changed).
7. **Safe with untrusted data.** Tooltip content is text, never markup (0.2.0 →
   Security).
8. **True docs.** The README, `llms.txt` and the demo describe exactly what the
   package exports (the README rewrite and the docs truth check in pull request
   #6).
9. **Small, and dependency-free.** No runtime dependency since 0.1.0; the
   bundles have a size budget.

## Out of bounds

The policy's `triage.non_goals` in `.dz/maintainer/maintainer.yml` is the list
(no runtime dependency, no canvas or WebGL, no required framework, no restyle
away from the cyberpunk default, no renamed public names outside a major
release, among others). It is linked here, not copied.

## Open questions for the owner

- Is the order above right, in particular accessibility ahead of new chart
  types?
- Which chart types come next, if any? `package.json` keywords name
  `radar-chart`, which the library does not have.
- Is a 1.0 release (freezing the API) a goal, and when? The CHANGELOG allows
  breaking changes in a minor release below 1.0.
- Does cybercore-charts follow cybercore-css releases (same themes, same
  cadence), or move on its own?
- Are adapters beyond React and Ember wanted?
