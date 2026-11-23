# Stack

- **Library:** TypeScript (`src/`), built by Vite into ESM, CommonJS and a UMD
  bundle with a minified copy under `dist/`; `scripts/build-types.ts` writes the
  type declarations. The optional stylesheet is SCSS, shipped as source
  (`src/styles/`).
- **Adapters:** React components and hooks (`src/react/`) and an Ember modifier
  (`src/ember/`), both over `src/adapters/chart-binding.ts`. React, React DOM,
  `ember-source` and `ember-modifier` are optional peer dependencies.
- **Demo site:** React, React Router and Vite (`demo/`), TypeScript, styled by
  the published cybercore-css package (a devDependency).
- **Tests:** vitest with happy-dom (`tests/`: charts, behaviour, accessibility,
  theme, server import, utilities, adapters); Playwright screenshots of every
  demo page (`tests/visual/`, run in a pinned Docker image by
  `scripts/visual.sh`).
- **Lint and format:** ESLint, Prettier, `tsc` over each `tsconfig`.
- **Toolchain:** Node 24 for development (`.nvmrc`), npm with
  `package-lock.json`. The published package declares its own Node floor in
  `package.json` `engines`.
- **Gate:** `bin/check` locally and the `CI OK` job in
  `.github/workflows/ci.yml`, which runs the same `bin/check` plus workflow
  lint, `npm audit` and the visual suite.
- **Runtime dependencies:** none, by rule (`bin/repo-guards`).

Exact versions are in `package.json`; Dependabot keeps them current.
