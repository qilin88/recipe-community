import { readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Package managers may hoist executables above the application workspace.
export function resolveCli(packageName, binName = packageName) {
  let directory = path.dirname(fileURLToPath(import.meta.resolve(packageName)));
  while (true) {
    const manifest = path.join(directory, 'package.json');
    if (existsSync(manifest)) {
      const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
      if (pkg.name === packageName) {
        const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.[binName];
        if (!bin) throw new Error(`No executable ${binName} in ${packageName}`);
        return path.resolve(directory, bin);
      }
    }
    const parent = path.dirname(directory);
    if (parent === directory) throw new Error(`Cannot find executable for ${packageName}`);
    directory = parent;
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const [name, ...args] = process.argv.slice(2);
  const cli = resolveCli(name);
  const child = spawn(process.execPath, [cli, ...args], { stdio: 'inherit' });
  const handlers = new Map(['SIGINT', 'SIGTERM'].map(signal => {
    const handler = () => child.kill(signal);
    process.on(signal, handler);
    return [signal, handler];
  }));
  child.on('error', error => { console.error(error); process.exitCode = 1; });
  child.on('exit', (code, signal) => {
    for (const [name, handler] of handlers) process.off(name, handler);
    if (signal) process.kill(process.pid, signal);
    else process.exitCode = code ?? 1;
  });
}
