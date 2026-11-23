# Overview

cybercore-charts is a zero-dependency SVG chart library with a cyberpunk look:
line and area, bar, donut and pie, gauge and sparkline charts, written in
TypeScript and published to npm as `cybercore-charts`. It is used as ES modules,
CommonJS, a `<script>` tag from jsDelivr or unpkg (the `CyberCharts` global),
React components (`cybercore-charts/react`) or an Ember modifier
(`cybercore-charts/ember`). Importing it is safe during server rendering; a
chart is drawn once there is a DOM.

It is the companion of
[cybercore-css](https://github.com/sebyx07/cybercore-css): every colour and the
font are that framework's tokens with built-in fallbacks, so charts follow its
theme when it is on the page and render the same neon palette without it.

The repository also holds the documentation site and playgrounds (`demo/`,
React + Vite, deployed to GitHub Pages at
https://sebyx07.github.io/cybercore-charts/), which uses the library as a user
would and wears cybercore-css as published.

It is a public project open to outside contributors, maintained by the
developerz.ai agent under the policy in `.dz/maintainer/maintainer.yml`. Where
things live: `CLAUDE.md` § Layout. The rendering rules: `src/CLAUDE.md`.
