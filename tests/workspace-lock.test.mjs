import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url)));
test('lockfile includes the native packages needed by Linux Cloudflare builds', () => {
  const packages = {
    '@next/swc-linux-x64-gnu': '16.3.4',
    '@cloudflare/workerd-linux-64': '1.20260515.1',
    '@rolldown/binding-linux-x64-gnu': '1.0.1',
    '@img/sharp-linux-x64': '0.35.4',
    '@img/sharp-libvips-linux-x64': '1.3.3',
    '@unrs/resolver-binding-linux-x64-gnu': '1.11.1',
  };
  for (const [name, version] of Object.entries(packages)) {
    assert.equal(lock.packages[`node_modules/${name}`]?.version, version, `Missing or incompatible Linux dependency ${name}`);
  }
});
test('web and mobile resolve their supported React versions independently', () => {
  for (const [name, version] of [['web', '19.2.6'], ['mobile', '19.3.0']]) {
    const require = createRequire(new URL(`../apps/${name}/package.json`, import.meta.url));
    assert.equal(require('react/package.json').version, version);
    assert.equal(require('react-dom/package.json').version, version);
  }
});
