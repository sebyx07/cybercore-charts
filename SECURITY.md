# Security Policy

## Supported versions

Only the latest release on [npm](https://www.npmjs.com/package/cybercore-charts)
gets security fixes. Fixes land on `main` and ship in the next release.

## Reporting a vulnerability

**Report privately. Do not open a public issue or pull request:** both are
public, and an AI agent triages them in the open.

- Preferred:
  [open a private security advisory](https://github.com/sebyx07/cybercore-charts/security/advisories/new)
  (GitHub's "Report a vulnerability" form on the Security tab).
- Or by email to sebyx07.pro@gmail.com.

Include:

- what is affected: the `cybercore-charts` version and how you load it (npm with
  a bundler, the CDN `<script>` tag, the React or Ember adapter, server
  rendering)
- steps to reproduce, ideally a small HTML file or the options and data passed
  to the chart
- the impact as you understand it

There is no fixed response time. Reports are read and fixed as maintainer time
allows, and you are credited in the changelog unless you ask not to be.

## In scope

- Data or option text (labels, series names, tooltip content, `ariaLabel`)
  reaching the page as markup or script instead of text: a chart drawn from
  untrusted data must not be a cross-site scripting vector
- SVG that the library emits (`toSVG()`, the DOM it builds) carrying a script,
  an event-handler attribute, `<foreignObject>` with untrusted content or an
  external reference
- The library making a network request, or reading or writing storage, that the
  caller did not ask for
- Prototype pollution or denial of service through crafted options or data (an
  input that hangs or crashes rendering beyond the data it was given)
- Anything in the published package, or in the workflow that builds and
  publishes it, that would let someone ship code the maintainers did not write
  (supply chain)

## Out of scope

- The demo site (`demo/`) and the `examples/` files: they are documentation and
  are not part of the npm package
- Vulnerabilities in development-only dependencies that do not change the
  published files (report them upstream; Dependabot tracks them here)
- A custom `tooltip.formatter` or other callback you wrote that returns
  unescaped markup: what your own code returns is yours to sanitize
- Rendering differences or accessibility bugs: please open a normal issue, they
  are welcome
