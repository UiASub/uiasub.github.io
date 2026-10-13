const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');

const origin = 'https://uiasub.no';
const source = fs.readFileSync('service-worker.js', 'utf8');

function worker() {
  const handlers = {};
  const stores = new Map();
  const requests = [];
  let offline = false;
  let status = 200;
  const key = request => typeof request === 'string' ? new URL(request, origin).href : request.url || request.href;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async match(request) { return store.get(key(request))?.clone(); },
        async put(request, response) { store.set(key(request), response.clone()); },
        async addAll(urls) {
          for (const url of urls) store.set(key(url), await fetchResource(url));
        }
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async match(request) {
      for (const store of stores.values()) {
        if (store.has(key(request))) return store.get(key(request)).clone();
      }
    }
  };
  const self = {
    location: new URL('/service-worker.js', origin),
    registration: { scope: origin + '/', navigationPreload: { async enable() {}, async disable() {} } },
    clients: { async claim() {} },
    async skipWaiting() {},
    addEventListener(type, handler) { handlers[type] = handler; }
  };
  async function fetchResource(request, options) {
    requests.push({ request, options });
    if (offline) throw new TypeError('offline');
    // Model a still-fresh HTTP cache: only revalidation discovers the update.
    return new Response(options?.cache === 'no-cache' || request.cache === 'no-cache' ? 'fresh' : 'http-cached', { status });
  }
  const context = vm.createContext({ self, caches, URL, Request, Response, fetch: fetchResource });
  vm.runInContext(source, context);
  const name = kind => vm.runInContext(`${kind.toUpperCase()}_CACHE`, context);
  return {
    caches, requests, name,
    setOffline(value) { offline = value; },
    setStatus(value) { status = value; },
    async lifecycle(type) {
      const pending = [];
      handlers[type]({ waitUntil(promise) { pending.push(promise); } });
      await Promise.all(pending);
    },
    async seed(kind, path, body = 'old') {
      await (await caches.open(name(kind))).put(new Request(origin + path), new Response(body));
    },
    async get(path, { destination = '', navigation = false, headers = {}, method = 'GET' } = {}) {
      const request = new Request(new URL(path, origin), { method, headers });
      Object.defineProperty(request, 'destination', { value: destination });
      if (navigation) Object.defineProperty(request, 'mode', { value: 'navigate' });
      const pending = [];
      let response;
      handlers.fetch({ request, preloadResponse: Promise.resolve(undefined),
        waitUntil(promise) { pending.push(promise); },
        respondWith(promise) { response = promise; }
      });
      const result = await response;
      await Promise.all(pending);
      return result;
    }
  };
}

test('updated content replaces both service-worker and HTTP cache entries on the first request', async () => {
  const w = worker();
  for (const [kind, path, options] of [
    ['static', '/js/header.js', { destination: 'script' }],
    ['static', '/css/custom.css', { destination: 'style' }],
    ['runtime', '/js/members.js', { destination: 'script' }],
    ['runtime', '/images/profie_shared/member.jpg', { destination: 'image' }],
    ['runtime', '/data/members.json', {}],
    ['html', '/pages/about.html', { navigation: true }]
  ]) {
    await w.seed(kind, path);
    assert.equal(await (await w.get(path, options)).text(), 'fresh', path);
    w.setOffline(true);
    assert.equal(await (await w.get(path, options)).text(), 'fresh', `${path} offline`);
    w.setOffline(false);
  }
});

test('activation removes previous site caches and preserves unrelated caches', async () => {
  const w = worker();
  await w.lifecycle('install');
  for (const name of ['uiasub-static-v11', 'uiasub-html-v11', 'uiasub-runtime-v11', 'unrelated']) await w.caches.open(name);
  await w.lifecycle('activate');
  assert.deepEqual((await w.caches.keys()).sort(), [w.name('static'), 'unrelated'].sort());
});

test('offline navigation uses the precached fallback and missing assets return a network error', async () => {
  const w = worker();
  await w.lifecycle('install');
  w.setOffline(true);
  assert.equal(await (await w.get('/unvisited.html', { navigation: true })).text(), 'fresh');
  assert.equal((await w.get('/missing.jpg', { destination: 'image' })).type, 'error');
});

test('HTTP errors do not replace a working offline copy', async () => {
  const w = worker();
  await w.seed('runtime', '/data/members.json');
  w.setStatus(404);
  assert.equal((await w.get('/data/members.json')).status, 404);
  w.setOffline(true);
  assert.equal(await (await w.get('/data/members.json')).text(), 'old');
});

test('external, non-GET and range requests pass through', async () => {
  const w = worker();
  assert.equal(await w.get('https://example.com/script.js'), undefined);
  assert.equal(await w.get('/api', { method: 'POST' }), undefined);
  assert.equal(await w.get('/videos/hero.mp4', { headers: { Range: 'bytes=0-100' } }), undefined);
  assert.equal(w.requests.length, 0);
});
