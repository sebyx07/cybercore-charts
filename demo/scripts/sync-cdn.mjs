#!/usr/bin/env node
// Refreshes demo/src/data/cdn.json so the CDN snippet on the site pins a
// version that is really published, with a Subresource Integrity hash computed
// from the bytes both CDNs serve. Run after every npm release:
//
//   node demo/scripts/sync-cdn.mjs            # version from package.json
//   node demo/scripts/sync-cdn.mjs 0.3.0      # explicit version
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const here = import.meta.dirname;
const target = resolve(here, '../src/data/cdn.json');
const pkg = JSON.parse(await readFile(resolve(here, '../../package.json'), 'utf8'));
const version = process.argv[2] ?? pkg.version;
const file = 'dist/cybercore-charts.umd.min.js';

async function integrityOf(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}. Is ${version} published on npm?`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  return `sha384-${createHash('sha384').update(bytes).digest('base64')}`;
}

const [jsdelivr, unpkg] = await Promise.all([
  integrityOf(`https://cdn.jsdelivr.net/npm/cybercore-charts@${version}/${file}`),
  integrityOf(`https://unpkg.com/cybercore-charts@${version}/${file}`),
]);

if (jsdelivr !== unpkg) {
  throw new Error(
    `jsDelivr and unpkg serve different bytes for ${version}:\n${jsdelivr}\n${unpkg}`
  );
}

await writeFile(target, `${JSON.stringify({ version, file, integrity: jsdelivr }, null, 2)}\n`);
console.log(`cdn.json -> cybercore-charts@${version} ${jsdelivr}`);
