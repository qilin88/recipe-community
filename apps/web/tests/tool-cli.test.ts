import test from 'node:test';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

test('framework CLIs resolve from a workspace without local node_modules', async () => {
  const helper = new URL('../scripts/tool-cli.mjs', import.meta.url);
  assert.ok(existsSync(helper), 'workspace CLI resolver must exist');
  const { resolveCli } = await import(helper.href);
  for (const name of ['vinext', 'vite', 'wrangler']) {
    const cli = resolveCli(name);
    assert.ok(existsSync(cli), `${name} executable exists`);
    assert.ok(cli.endsWith('.js'), `${name} resolves a JavaScript executable`);
  }
  assert.throws(() => resolveCli('vinext', 'missing-bin'), /executable/);
  assert.ok(fileURLToPath(import.meta.url).includes('/apps/web/'));
});

test('workspace wrapper executes CommonJS CLIs rather than only importing them', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/tool-cli.mjs', import.meta.url)), 'wrangler', '--version'], { encoding: 'utf8', env: { ...process.env, WRANGLER_SEND_METRICS: 'false', WRANGLER_WRITE_LOGS: 'false' } });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /4\.92\.0/);
});
