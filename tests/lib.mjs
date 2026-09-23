// Shared paths for the test scripts: the built page at the repo root, file:// URLs that work on Windows too,
// and tests/out/<name>/ for screenshots (git-ignored).
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PAGE = path.join(ROOT, 'chart-studies.html');
export const url = file => pathToFileURL(path.resolve(file)).href;
export const out = name => { const dir = path.join(ROOT, 'tests', 'out', name); mkdirSync(dir, { recursive: true }); return dir; };
