// Runtime validation coverage for: typed API request and error handling
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { transform } from 'esbuild';

const source = await readFile(new URL('../src/lib/services/apiClient.ts', import.meta.url), 'utf8');
const transformed = await transform(source, {
  loader: 'ts',
  format: 'esm',
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://api.test/api/v1'),
  },
});
const apiClient = await import(
  `data:text/javascript;base64,${Buffer.from(transformed.code).toString('base64')}`
);

test('apiRequest posts credentials to the configured API and unwraps the response', async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl = '';
  let requestInit;
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    return new Response(
      JSON.stringify({
        success: true,
        statusCode: 200,
        data: { id: 'user-1' },
        timestamp: '2026-01-01T00:00:00.000Z',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  try {
    const result = await apiClient.apiRequest('/auth/login', {
      method: 'POST',
      authenticated: false,
      body: { identifier: '+251911000000', password: 'test-only-password' },
    });

    assert.equal(requestUrl, 'http://api.test/api/v1/auth/login');
    assert.equal(new Headers(requestInit.headers).get('content-type'), 'application/json');
    assert.deepEqual(JSON.parse(requestInit.body), {
      identifier: '+251911000000',
      password: 'test-only-password',
    });
    assert.deepEqual(result, { id: 'user-1' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('apiRequest reports a sanitized server error as ApiError', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        success: false,
        statusCode: 500,
        message: 'Internal server error',
        timestamp: '2026-01-01T00:00:00.000Z',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );

  try {
    await assert.rejects(
      apiClient.apiRequest('/auth/login', {
        method: 'POST',
        authenticated: false,
        body: { identifier: '+251911000000', password: 'test-only-password' },
      }),
      error =>
        error instanceof apiClient.ApiError &&
        error.status === 500 &&
        error.message === 'Internal server error',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
