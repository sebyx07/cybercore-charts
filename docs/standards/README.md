# Standards

How work is done here, and the check that enforces each rule. The rules
themselves live in `CLAUDE.md` (coding rules, preventive rules, never, PR
conventions) and `src/CLAUDE.md` (rendering rules); this page is the map from
rule to guard.

| Rule                                                                                      | Enforced by                                   |
| ----------------------------------------------------------------------------------------- | --------------------------------------------- |
| Lint, format, typecheck, tests, build, size, package, demo build, docs                    | `bin/check`, and `CI OK` in CI                |
| No runtime dependency, every peer optional, `sideEffects` declared, `dist/` not committed | `bin/repo-guards`                             |
| Importing any entry touches no DOM and has no side effect                                 | `tests/ssr.test.ts`                           |
| Title, description, data table, keyboard access, reduced motion                           | `tests/a11y.test.ts`                          |
| Every colour is a cybercore-css token with a fallback                                     | `tests/theme.test.ts`                         |
| An export, option, event or class member is not removed, renamed or narrowed              | `bin/api-diff`, the reviewer                  |
| The gzipped ESM and UMD bundles stay under their budgets                                  | `scripts/check-size.ts`                       |
| The tarball installs and every entry imports                                              | `scripts/check-package.ts`                    |
| Every snippet and option in `README.md` and `llms.txt` is real                            | `bin/docs-check`                              |
| `package.json`, `VERSION` and versioned URLs name one version                             | `bin/repo-guards`, `scripts/check-package.ts` |
| Agent-read files carry no HTML comment or invisible character                             | `bin/repo-guards`                             |
| Visible changes match the committed screenshots                                           | `npm run test:visual`, CI's visual job        |
| Actions pinned to a commit SHA; the release proves the commit first                       | `bin/repo-guards`                             |
| Conventional Commits; one concern per pull request                                        | the reviewer (`.dz/maintainer/reviewer.md`)   |
