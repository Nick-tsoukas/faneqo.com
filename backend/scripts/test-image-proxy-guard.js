'use strict';

/**
 * Focused SSRF / resource-limit tests for analytics.imageProxy.
 * Run: node scripts/test-image-proxy-guard.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const guardPath = path.join(__dirname, '../src/api/analytics/services/imageProxyGuard');
const {
  evaluateImageProxyUrl,
  proxyRemoteImage,
  MAX_IMAGE_BYTES,
} = require(guardPath);

require.resolve(path.join(__dirname, '../src/api/analytics/controllers/analytics.js'));

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
  }
}

function headersFrom(map) {
  const normalized = {};
  for (const [key, value] of Object.entries(map || {})) {
    normalized[key.toLowerCase()] = value;
  }
  return {
    get(name) {
      return Object.prototype.hasOwnProperty.call(normalized, name.toLowerCase())
        ? normalized[name.toLowerCase()]
        : null;
    },
  };
}

function bufferStream(chunks) {
  const queue = chunks.map((chunk) => Buffer.from(chunk));
  return {
    getReader() {
      return {
        async read() {
          if (!queue.length) return { done: true, value: undefined };
          return { done: false, value: queue.shift() };
        },
        async cancel() {
          queue.length = 0;
        },
      };
    },
    async cancel() {
      queue.length = 0;
    },
  };
}

function mockResponse({ status = 200, headers = {}, body = Buffer.alloc(0), chunks } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: headersFrom(headers),
    body: bufferStream(chunks || [body]),
  };
}

function hangingFetch() {
  return async (_url, { signal } = {}) =>
    new Promise((_resolve, reject) => {
      const abort = () => {
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        reject(err);
      };
      if (signal?.aborted) {
        abort();
        return;
      }
      signal?.addEventListener('abort', abort, { once: true });
    });
}

const ALLOWED = 'https://qrcode101.s3.us-east-1.amazonaws.com/dannylogo_2c227e4742.PNG';

/**
 * Every custom route declared under `src/api/<api>/routes`.
 *
 * Core routers (`createCoreRouter`) expose `routes` as a getter that needs a
 * booted `strapi` global, so they are recorded separately instead of being
 * forced open. None of them can declare `/image-proxy`: core routers only
 * generate CRUD paths from the content type's plural name.
 */
function collectCustomRoutes() {
  const apiRoot = path.join(__dirname, '../src/api');
  const routes = [];
  const coreRouters = [];

  for (const api of fs.readdirSync(apiRoot)) {
    const routesDir = path.join(apiRoot, api, 'routes');
    if (!fs.existsSync(routesDir)) continue;

    for (const file of fs.readdirSync(routesDir)) {
      if (!file.endsWith('.js')) continue;
      const absolute = path.join(routesDir, file);
      const relative = `src/api/${api}/routes/${file}`;
      const loaded = require(absolute);

      let declared;
      try {
        declared = Array.isArray(loaded) ? loaded : loaded.routes;
      } catch {
        coreRouters.push(relative);
        continue;
      }
      if (!Array.isArray(declared)) {
        coreRouters.push(relative);
        continue;
      }

      for (const route of declared) {
        routes.push({ ...route, file: relative });
      }
    }
  }

  return { routes, coreRouters };
}

(async () => {
  console.log('\n=== analytics.imageProxy allowlist ===\n');

  await test('allows the production virtual-hosted bucket URL used by share cards', () => {
    const result = evaluateImageProxyUrl(ALLOWED);
    assert.strictEqual(result.ok, true, result.reason);
  });

  await test('allows other public objects on the same production bucket', () => {
    const result = evaluateImageProxyUrl(
      'https://qrcode101.s3.us-east-1.amazonaws.com/medium_gary_bendig_6_G_Mq7_A_Gx_Nb_E_unsplash_33c44247ac.jpg'
    );
    assert.strictEqual(result.ok, true, result.reason);
  });

  await test('allows legacy virtual-hosted and path-style qrcode101 URLs', () => {
    const urls = [
      'https://qrcode101.s3.amazonaws.com/band.png',
      'https://s3.us-east-1.amazonaws.com/qrcode101/band.png',
      'https://s3.amazonaws.com/qrcode101/folder/band.png',
    ];
    for (const url of urls) {
      const result = evaluateImageProxyUrl(url);
      assert.strictEqual(result.ok, true, `${url}: ${result.reason}`);
    }
  });

  await test('keeps the live qrcode101 us-east-1 host if AWS_REGION differs', () => {
    const env = { AWS_BUCKET: 'qrcode101', AWS_REGION: 'us-west-2' };
    assert.strictEqual(evaluateImageProxyUrl(ALLOWED, env).ok, true);
    assert.strictEqual(
      evaluateImageProxyUrl('https://qrcode101.s3.us-west-2.amazonaws.com/band.png', env).ok,
      true
    );
  });

  await test('allows the configured upload bucket and CDN host only', () => {
    const env = {
      AWS_BUCKET: 'faneqo-uploads',
      AWS_REGION: 'us-west-2',
      CDN_URL: 'https://d111111abcdef8.cloudfront.net',
      CDN_ROOT_PATH: 'media',
    };
    assert.strictEqual(
      evaluateImageProxyUrl('https://faneqo-uploads.s3.us-west-2.amazonaws.com/logo.webp', env).ok,
      true
    );
    assert.strictEqual(
      evaluateImageProxyUrl('https://s3.us-west-2.amazonaws.com/faneqo-uploads/logo.webp', env).ok,
      true
    );
    assert.strictEqual(
      evaluateImageProxyUrl('https://d111111abcdef8.cloudfront.net/media/logo.webp', env).ok,
      true
    );
    assert.strictEqual(
      evaluateImageProxyUrl('https://d111111abcdef8.cloudfront.net/other/logo.webp', env).ok,
      false
    );
  });

  console.log('\n=== rejected destinations ===\n');

  await test('rejects HTTP, credentials, and non-443 ports', () => {
    const blocked = [
      'http://qrcode101.s3.us-east-1.amazonaws.com/band.png',
      'https://user:pass@qrcode101.s3.us-east-1.amazonaws.com/band.png',
      'https://qrcode101.s3.us-east-1.amazonaws.com:8443/band.png',
    ];
    for (const url of blocked) {
      const result = evaluateImageProxyUrl(url);
      assert.strictEqual(result.ok, false, url);
      assert.strictEqual(result.code, 'forbidden');
    }
  });

  await test('rejects other S3 buckets that the old endsWith allowlist accepted', () => {
    const blocked = [
      'https://evil.s3.us-east-1.amazonaws.com/secret.png',
      'https://evil.s3.amazonaws.com/secret.png',
      'https://s3.us-east-1.amazonaws.com/other-bucket/secret.png',
      'https://s3.amazonaws.com/other-bucket/secret.png',
      'https://qrcode101.s3.us-east-1.amazonaws.com.evil.com/band.png',
    ];
    for (const url of blocked) {
      const result = evaluateImageProxyUrl(url);
      assert.strictEqual(result.ok, false, url);
      assert.strictEqual(result.code, 'forbidden');
    }
  });

  await test('rejects metadata IPs, localhost, Cloudinary, and empty keys', () => {
    const blocked = [
      'https://169.254.169.254/latest/meta-data/',
      'https://127.0.0.1/band.png',
      'https://localhost/band.png',
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://qrcode101.s3.us-east-1.amazonaws.com/',
      'https://s3.amazonaws.com/qrcode101/',
    ];
    for (const url of blocked) {
      const result = evaluateImageProxyUrl(url);
      assert.strictEqual(result.ok, false, url);
    }
  });

  console.log('\n=== fetch behavior ===\n');

  await test('proxies an allowed image response', async () => {
    const result = await proxyRemoteImage(ALLOWED, {
      fetch: async (url, opts) => {
        assert.strictEqual(url, ALLOWED);
        assert.strictEqual(opts.redirect, 'manual');
        return mockResponse({
          headers: { 'content-type': 'image/png' },
          body: PNG_1X1,
        });
      },
    });
    assert.strictEqual(result.ok, true, result.reason);
    assert.strictEqual(result.contentType, 'image/png');
    assert.ok(result.buffer.equals(PNG_1X1));
  });

  await test('rejects a non-image content type before returning bytes', async () => {
    const result = await proxyRemoteImage(ALLOWED, {
      fetch: async () =>
        mockResponse({
          headers: { 'content-type': 'text/html' },
          body: Buffer.from('<html>nope</html>'),
        }),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.code, 'not_image');
  });

  await test('rejects SVG even though it is labeled as an image', async () => {
    const result = await proxyRemoteImage(ALLOWED, {
      fetch: async () =>
        mockResponse({
          headers: { 'content-type': 'image/svg+xml' },
          body: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
        }),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.code, 'not_image');
  });

  await test('follows a redirect only when the next hop is also allowed', async () => {
    const dest = 'https://s3.us-east-1.amazonaws.com/qrcode101/band.png';
    const result = await proxyRemoteImage(ALLOWED, {
      fetch: async (url) => {
        if (url === ALLOWED) {
          return mockResponse({
            status: 302,
            headers: { location: dest },
          });
        }
        assert.strictEqual(url, dest);
        return mockResponse({
          headers: { 'content-type': 'image/png' },
          body: PNG_1X1,
        });
      },
    });
    assert.strictEqual(result.ok, true, result.reason);
    assert.ok(result.buffer.equals(PNG_1X1));
  });

  await test('refuses a redirect off the allowlist', async () => {
    const result = await proxyRemoteImage(ALLOWED, {
      fetch: async () =>
        mockResponse({
          status: 302,
          headers: { location: 'https://169.254.169.254/latest/meta-data/' },
        }),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.code, 'forbidden');
  });

  await test('refuses a redirect to another S3 bucket', async () => {
    const result = await proxyRemoteImage(ALLOWED, {
      fetch: async () =>
        mockResponse({
          status: 301,
          headers: { location: 'https://evil.s3.us-east-1.amazonaws.com/steal.png' },
        }),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.code, 'forbidden');
  });

  await test('times out a hung upstream', async () => {
    const result = await proxyRemoteImage(ALLOWED, {
      fetch: hangingFetch(),
      timeoutMs: 30,
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.code, 'timeout');
  });

  await test('rejects an oversized Content-Length without trusting it alone', async () => {
    let read = false;
    const result = await proxyRemoteImage(ALLOWED, {
      maxBytes: 64,
      fetch: async () => {
        const response = mockResponse({
          headers: {
            'content-type': 'image/png',
            'content-length': String(MAX_IMAGE_BYTES + 1),
          },
          body: PNG_1X1,
        });
        const originalRead = response.body.getReader;
        response.body.getReader = () => {
          read = true;
          return originalRead.call(response.body);
        };
        return response;
      },
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.code, 'too_large');
    assert.strictEqual(read, false);
  });

  await test('enforces the byte cap while streaming when Content-Length is missing', async () => {
    const result = await proxyRemoteImage(ALLOWED, {
      maxBytes: 32,
      fetch: async () =>
        mockResponse({
          headers: { 'content-type': 'image/png' },
          chunks: [Buffer.alloc(20, 1), Buffer.alloc(20, 2)],
        }),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.code, 'too_large');
  });

  console.log('\n=== route registration ===\n');

  const { routes: customRoutes, coreRouters } = collectCustomRoutes();
  const imageProxyRoutes = customRoutes.filter((route) => route.path === '/image-proxy');

  await test('every route module under src/api loads', () => {
    assert.ok(customRoutes.length > 0, 'no custom routes were collected');
    assert.ok(coreRouters.length > 0, 'core routers should still be present');
  });

  await test('exactly one GET /image-proxy route is registered', () => {
    const gets = imageProxyRoutes.filter((route) => route.method === 'GET');
    assert.strictEqual(
      gets.length,
      1,
      `expected 1 GET /image-proxy, found ${gets.length}: ${gets.map((r) => `${r.handler} (${r.file})`).join(', ')}`
    );
  });

  await test('the one GET /image-proxy maps to analytics.imageProxy', () => {
    const [route] = imageProxyRoutes.filter((route) => route.method === 'GET');
    assert.strictEqual(route.handler, 'analytics.imageProxy');
    assert.strictEqual(route.file, 'src/api/analytics/routes/analytics.js');
  });

  await test('no route maps /image-proxy to the legacy image-proxy.proxy handler', () => {
    const legacy = customRoutes.filter((route) => route.handler === 'image-proxy.proxy');
    assert.deepStrictEqual(
      legacy.map((route) => `${route.method} ${route.path} (${route.file})`),
      [],
      'the unsafe duplicate proxy handler is registered again'
    );
  });

  await test('the legacy image-proxy API declares no routes at all', () => {
    const legacyApi = customRoutes.filter((route) => route.file.startsWith('src/api/image-proxy/routes/'));
    assert.deepStrictEqual(legacyApi, [], 'src/api/image-proxy must not register HTTP routes');
  });

  await test('imageProxy controller maps guard results without changing success headers', async () => {
    const controller = require('../src/api/analytics/controllers/analytics');
    const calls = [];
    const ctx = {
      query: {},
      badRequest(message) {
        calls.push(['badRequest', message]);
        return message;
      },
    };
    await controller.imageProxy(ctx);
    assert.deepStrictEqual(calls, [['badRequest', 'url parameter is required']]);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
})();
