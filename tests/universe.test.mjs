import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import { mkdtemp, readFile, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Compile the real modules for Node's built-in runner; the normal build checks types.
const directory = await mkdtemp(join(tmpdir(), 'ascii-universe-test-'));
const modules = ['themes', 'navigation', 'starlight', 'universe'];
for (const name of modules) {
  const source = await readFile(new URL(`../src/${name}.ts`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  });
  await writeFile(
    join(directory, `${name}.mjs`),
    outputText.replace(/from '\.\/(\w+)'/g, "from './$1.mjs'"),
  );
}
const { Universe } = await import(pathToFileURL(join(directory, 'universe.mjs')));
const { parsePage } = await import(pathToFileURL(join(directory, 'navigation.mjs')));
after(async () => {
  for (const name of modules) await unlink(join(directory, `${name}.mjs`));
  await rmdir(directory);
});

const originalGlobals = new Map();
function replaceGlobal(name, value) {
  if (!originalGlobals.has(name))
    originalGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
}
afterEach(() => {
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
  originalGlobals.clear();
});

function environment({ width = 390, height = 844, contextAvailable = true } = {}) {
  const frames = new Map();
  let nextFrame = 0;
  let draws = 0;
  const sizes = { width, height, left: 0, top: 0 };
  const context = new Proxy(
    {
      measureText: () => ({ width: 500 }),
      getImageData: (_x, _y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      fillText: () => {
        draws++;
      },
      createRadialGradient: () => ({ addColorStop() {} }),
    },
    { get: (target, property) => target[property] ?? (() => {}) },
  );
  const canvas = new EventTarget();
  canvas.getContext = () => (contextAvailable ? context : null);
  canvas.getBoundingClientRect = () => sizes;
  const document = new EventTarget();
  document.hidden = false;
  document.createElement = () => ({ getContext: () => context });
  const observers = [];
  replaceGlobal('document', document);
  replaceGlobal('devicePixelRatio', 1);
  replaceGlobal(
    'ResizeObserver',
    class {
      active = true;
      constructor(callback) {
        this.callback = callback;
        observers.push(this);
      }
      observe() {}
      disconnect() {
        this.active = false;
      }
    },
  );
  replaceGlobal('requestAnimationFrame', (callback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  replaceGlobal('cancelAnimationFrame', (id) => frames.delete(id));
  return {
    canvas,
    frames,
    sizes,
    get draws() {
      return draws;
    },
    frame(time) {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(time));
    },
    resize() {
      observers
        .filter((observer) => observer.active)
        .forEach((observer) => observer.callback());
    },
    hide(hidden) {
      document.hidden = hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    },
  };
}

function createScene(env, options = {}) {
  return Universe.create(env.canvas, {
    paused: false,
    theme: 'void',
    showTitle: true,
    ...options,
  });
}

test('missing Canvas 2D support returns a fallback instead of crashing the page', () => {
  const env = environment({ contextAvailable: false });
  assert.equal(createScene(env), null);
  assert.equal(env.frames.size, 0);
});

test('reduced-motion startup draws a still scene without scheduling animation', () => {
  const env = environment();
  const scene = createScene(env, { paused: true });
  assert.ok(env.draws > 0);
  assert.equal(env.frames.size, 0);
  scene.destroy();
});

test('pause and resume cancel and restart exactly one animation loop', () => {
  const env = environment();
  const scene = createScene(env);
  assert.equal(env.frames.size, 1);
  scene.setPaused(true);
  const pausedDraws = env.draws;
  env.frame(100);
  assert.equal(env.draws, pausedDraws);
  assert.equal(env.frames.size, 0);
  scene.setPaused(false);
  scene.setPaused(false);
  env.resize();
  assert.equal(env.frames.size, 1);
  scene.destroy();
});

test('hidden tabs stop scheduling and restart when visible', () => {
  const env = environment();
  const scene = createScene(env);
  env.hide(true);
  assert.equal(env.frames.size, 0);
  env.hide(false);
  assert.equal(env.frames.size, 1);
  scene.destroy();
});

test('zero-size layouts do not read an empty pixel buffer and recover on resize', () => {
  const env = environment({ width: 0, height: 0 });
  const scene = createScene(env);
  assert.equal(env.draws, 0);
  assert.equal(env.frames.size, 0);
  Object.assign(env.sizes, { width: 390, height: 844 });
  env.resize();
  assert.ok(env.draws > 0);
  assert.equal(env.frames.size, 1);
  scene.destroy();
});

test('frame throttling treats timestamp zero as a real frame', () => {
  const env = environment();
  const scene = createScene(env);
  env.frame(0);
  const firstFrame = env.draws;
  env.frame(16);
  assert.equal(env.draws, firstFrame);
  env.frame(32);
  assert.ok(env.draws > firstFrame);
  scene.destroy();
});

test('destroy prevents queued callbacks or browser events from restarting the scene', () => {
  const env = environment();
  const scene = createScene(env);
  const pendingFrame = [...env.frames.values()][0];
  scene.destroy();
  const draws = env.draws;
  pendingFrame(100);
  env.hide(true);
  env.hide(false);
  env.resize();
  scene.setPaused(false);
  assert.equal(env.frames.size, 0);
  assert.equal(env.draws, draws);
});

test('switching themes animates a wipe without starting a second loop', () => {
  const env = environment();
  const scene = createScene(env);
  env.frame(0);
  scene.setTheme('starlight', { x: 200, y: 40 });
  assert.equal(env.frames.size, 1);
  for (let time = 40; time < 2000; time += 40) env.frame(time);
  assert.equal(env.frames.size, 1);
  const settled = env.draws;
  env.frame(2040);
  assert.ok(env.draws > settled);
  scene.destroy();
});

test('a paused scene switches themes immediately and still draws', () => {
  const env = environment();
  const scene = createScene(env, { paused: true, theme: 'starlight' });
  const draws = env.draws;
  assert.ok(draws > 0);
  scene.setTheme('void');
  assert.ok(env.draws > draws);
  assert.equal(env.frames.size, 0);
  scene.destroy();
});

test('static-host deep links resolve to their pages and unknown fragments fall back home', () => {
  assert.equal(parsePage('#/about'), 'about');
  assert.equal(parsePage('#/projects'), 'projects');
  assert.equal(parsePage(''), 'home');
  assert.equal(parsePage('#/unrecognised'), 'home');
});
