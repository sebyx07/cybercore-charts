# Principles

The product's promises are the invariants in `CLAUDE.md` § Invariants; this page
says why they exist, and does not restate them.

- **Installing it installs one package.** No runtime dependency means no
  transitive advisory, no version conflict and a size the project controls: the
  scale, path, colour and formatting code is in `src/utils/`, and React and
  Ember are optional peers behind their own entries (`bin/repo-guards`).
- **Importing it never breaks a server.** Pages are rendered in Node before they
  reach a browser, so an import that touches `window` fails a whole build. The
  DOM is used only when a chart is created, and its absence is a readable error
  (`tests/ssr.test.ts`).
- **A chart is content, not a picture.** SVG with a title, a description, a data
  table and keyboard access is readable by people who cannot see it or cannot
  use a pointer; reduced motion and high contrast are the library's job, not
  each user's (`tests/a11y.test.ts`).
- **The page owns the theme.** Colours are `var(--token, fallback)`, so a
  cybercore-css theme, a scoped `data-theme` or one overridden custom property
  retints a chart with no option passed, and nothing is required for the default
  look (`tests/theme.test.ts`).
- **What shipped keeps working.** Exports, options, events, class members,
  classes and custom properties only grow; a removal, a narrowed type or a
  changed default waits for the owner (`bin/api-diff`).
- **Data is text.** Labels and tooltips come from users' data, so they are never
  parsed as HTML.
- **Small for every user.** The gzipped bundles have a budget
  (`scripts/check-size.ts`).
- **Docs are true.** A snippet in `README.md` or `llms.txt` type-checks against
  the sources, and an option it names exists (`bin/docs-check`).
