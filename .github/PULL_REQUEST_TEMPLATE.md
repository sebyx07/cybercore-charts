## What and why

One or two sentences. Link issues: `Fixes #123`.

## Before / after

A screenshot of the chart, if the change is visible (the demo at `bin/dev`, or
your own page).

## Checklist

Not sure about one? Leave it unchecked and say so: the maintainer can help
finish it.

- [ ] `bin/check` passes (the same gate CI runs), or
      `npm run lint && npm test && npm run build`
- [ ] No new runtime dependency; nothing touches `window` or `document` when the
      package is imported
- [ ] No export, option or event was renamed or removed; a new option is
      optional and its default keeps existing charts unchanged
- [ ] Ids written into the SVG are unique per chart instance (try two charts on
      one page)
- [ ] The chart keeps its accessible name; animation stops under
      `prefers-reduced-motion: reduce`
- [ ] Colours come from the theme and `var(--token, fallback)`, none hardcoded
- [ ] A new option or chart has a test in `tests/` and an example in the demo
- [ ] `CHANGELOG.md` `## [Unreleased]` has a line for a user-visible change
- [ ] `README.md` and `llms.txt` updated if options, exports or usage changed

Keep the pull request a draft until it is ready: the maintainer agent reviews it
and merges it once CI is green. Thank you for contributing!
