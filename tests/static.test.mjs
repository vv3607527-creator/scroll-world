import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const engine = await readFile(new URL('../scrub-engine.js', import.meta.url), 'utf8');

test('HTML and engine are syntactically valid JavaScript', () => {
  const extracted = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(extracted, 'inline application script is present');
  for (const [name, source] of [['index inline script', extracted], ['scrub engine', engine]]) {
    const result = spawnSync(process.execPath, ['--check'], { input: source, encoding: 'utf8' });
    assert.equal(result.status, 0, `${name} syntax check failed: ${result.stderr}`);
  }
});

test('interactive demo has accessible modal semantics and keyboard dismissal', () => {
  assert.match(html, /id="demoModal"[^>]*role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-labelledby="demoTitle"/);
  assert.match(html, /id="demoTitle"/);
  assert.match(html, /aria-label="Close prompt generator"/);
  assert.match(html, /e\.key === 'Escape'/);
});

test('generated result uses text-only rendering and clipboard fallback feedback', () => {
  assert.match(html, /resultText\.textContent = prompt/);
  assert.doesNotMatch(html, /resultText\.innerHTML\s*=/);
  assert.match(html, /document\.execCommand\('copy'\)/);
  assert.match(html, /Copied!/);
});

test('engine escapes dynamic copy and handles failed clip loads', () => {
  assert.match(engine, /function esc\(s\)/);
  assert.match(engine, /\.catch\(\(\) => \{ s\.loading = false; \}\)/);
  assert.match(engine, /textContent = s\.label/);
});
