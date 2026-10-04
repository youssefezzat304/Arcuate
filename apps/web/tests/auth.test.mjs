import test from 'node:test';
import assert from 'node:assert/strict';
import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server.js';
import { authenticateWithEmail, exchangeAuthCode } from '../src/lib/auth.ts';
import { updateSession } from '../src/lib/supabase/proxy.ts';

const callbackUrl = 'https://arcuate.example/auth/callback';
const credentials = { email: ' reader@example.com ', password: '  good-password  ' };
const user = { id: '7b6c3013-1b42-4c98-a0c9-c5c2189be972', email: 'reader@example.com' };
const publicUrl = 'https://arcuate-auth-test.supabase.co';
const publicKey = 'sb_publishable_test';

test('login trims the email but preserves every password character', async () => {
  let submitted;
  const result = await authenticateWithEmail(
    {
      async signInWithPassword(input) {
        submitted = input;
        return { data: { session: { user } }, error: null };
      },
    },
    'login',
    credentials,
    callbackUrl,
  );
  assert.deepEqual(submitted, { email: 'reader@example.com', password: credentials.password });
  assert.deepEqual(result, { status: 'signed-in' });
});

test('invalid email, short signup passwords, and mismatched passwords do not reach Supabase', async () => {
  const auth = {
    signInWithPassword() {
      assert.fail('Invalid credentials reached Supabase');
    },
    signUp() {
      assert.fail('Invalid signup reached Supabase');
    },
  };
  for (const [mode, input] of [
    ['login', { ...credentials, email: 'invalid' }],
    ['login', { ...credentials, password: '' }],
    ['signup', { ...credentials, password: 'short', confirmPassword: 'short' }],
    ['signup', { ...credentials, confirmPassword: 'different' }],
  ])
    assert.equal((await authenticateWithEmail(auth, mode, input, callbackUrl)).status, 'error');
});

test('signup supplies its confirmation callback and handles projects with and without confirmation', async () => {
  for (const session of [null, { user }]) {
    let submitted;
    const result = await authenticateWithEmail(
      {
        async signUp(input) {
          submitted = input;
          return { data: { session, user }, error: null };
        },
      },
      'signup',
      { ...credentials, confirmPassword: credentials.password },
      callbackUrl,
    );
    assert.deepEqual(submitted, {
      email: 'reader@example.com',
      password: credentials.password,
      options: { emailRedirectTo: callbackUrl },
    });
    assert.equal(result.status, session ? 'signed-in' : 'confirmation-required');
  }
});

test('authentication errors are actionable without exposing raw provider details', async () => {
  for (const [code, expected] of [
    ['invalid_credentials', /email or password is incorrect/],
    ['email_not_confirmed', /Confirm your email/],
    ['over_email_send_rate_limit', /Too many attempts/],
    ['unexpected_provider_error', /Please try again/],
  ]) {
    const result = await authenticateWithEmail(
      {
        async signInWithPassword() {
          return {
            data: { session: null },
            error: { code, message: 'private provider diagnostics' },
          };
        },
      },
      'login',
      credentials,
      callbackUrl,
    );
    assert.equal(result.status, 'error');
    assert.match(result.message, expected);
    assert.ok(!result.message.includes('private provider diagnostics'));
  }
});

test('provider network failures produce a retryable form error', async () => {
  const result = await authenticateWithEmail(
    {
      async signInWithPassword() {
        throw new Error('Network failed');
      },
    },
    'login',
    credentials,
    callbackUrl,
  );
  assert.equal(result.status, 'error');
  assert.match(result.message, /Unable to reach/);
});

test('callback rejects missing, oversized, and cancelled codes without contacting the provider', async () => {
  const auth = {
    exchangeCodeForSession() {
      assert.fail('Invalid code reached Supabase');
    },
  };
  for (const params of [
    new URLSearchParams(),
    new URLSearchParams({ code: '' }),
    new URLSearchParams({ code: 'x'.repeat(2049) }),
    new URLSearchParams({ error: 'access_denied', code: 'code' }),
  ]) {
    assert.equal(await exchangeAuthCode(auth, params), false);
  }
});

test('callback succeeds only when the exchanged code establishes a session', async () => {
  for (const [response, expected] of [
    [{ data: { session: { user } }, error: null }, true],
    [{ data: { session: null }, error: null }, false],
    [{ data: { session: null }, error: { code: 'bad_code_verifier' } }, false],
  ]) {
    assert.equal(
      await exchangeAuthCode(
        {
          async exchangeCodeForSession(code) {
            assert.equal(code, 'one-time-code');
            return response;
          },
        },
        new URLSearchParams({ code: 'one-time-code', next: '//malicious.example' }),
      ),
      expected,
    );
  }
  assert.equal(
    await exchangeAuthCode(
      {
        async exchangeCodeForSession() {
          throw new Error('Network failed');
        },
      },
      new URLSearchParams({ code: 'one-time-code' }),
    ),
    false,
  );
});

function token(expiresAt) {
  const encode = (input) => Buffer.from(JSON.stringify(input)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, email: user.email, exp: expiresAt, iat: expiresAt - 3600, aud: 'authenticated', role: 'authenticated' })}.test-signature`;
}

function mockProvider() {
  const calls = [];
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const session = {
    access_token: token(expiresAt),
    refresh_token: 'refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    user,
  };
  return {
    calls,
    session,
    async fetch(input, options = {}) {
      const url = new URL(input);
      calls.push({
        path: url.pathname,
        grant: url.searchParams.get('grant_type'),
        body: options.body ? JSON.parse(options.body) : undefined,
      });
      if (url.pathname.endsWith('/token')) return Response.json(session);
      if (url.pathname.endsWith('/user')) return Response.json(user);
      if (url.pathname.endsWith('/logout')) return new Response(null, { status: 204 });
      assert.fail(`Unexpected Supabase endpoint: ${url.pathname}`);
    },
  };
}

function cookieStore() {
  const values = new Map();
  const headers = {};
  return {
    values,
    headers,
    cookies: {
      getAll: () => [...values].map(([name, value]) => ({ name, value })),
      setAll(cookies, nextHeaders) {
        for (const { name, value } of cookies) {
          if (value) values.set(name, value);
          else values.delete(name);
        }
        Object.assign(headers, nextHeaders);
      },
    },
  };
}

function serverClient(store, provider) {
  return createServerClient(publicUrl, publicKey, {
    cookies: store.cookies,
    global: { fetch: provider.fetch },
  });
}

test('SDK sessions persist in cookies across requests and local logout clears them', async () => {
  const store = cookieStore();
  const provider = mockProvider();
  const first = serverClient(store, provider);
  assert.equal((await first.auth.signInWithPassword(credentials)).error, null);
  assert.ok(store.values.size > 0);
  assert.match(store.headers['Cache-Control'], /private.*no-store/);

  const reloaded = serverClient(store, provider);
  assert.equal((await reloaded.auth.getUser()).data.user?.id, user.id);
  assert.ok(provider.calls.some((call) => call.path.endsWith('/user')));
  assert.equal((await reloaded.auth.signOut({ scope: 'local' })).error, null);
  assert.equal(store.values.size, 0);
  assert.equal((await serverClient(store, provider).auth.getUser()).data.user, null);
});

test('Google OAuth creates a PKCE verifier cookie and exchanges its callback into a persistent session', async () => {
  const store = cookieStore();
  const provider = mockProvider();
  const auth = serverClient(store, provider).auth;
  const { data, error } = await auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callbackUrl, skipBrowserRedirect: true },
  });
  assert.equal(error, null);
  const redirect = new URL(data.url);
  assert.equal(redirect.searchParams.get('provider'), 'google');
  assert.equal(redirect.searchParams.get('redirect_to'), callbackUrl);
  assert.equal(redirect.searchParams.get('code_challenge_method'), 's256');
  assert.ok([...store.values.keys()].some((name) => name.includes('code-verifier')));
  assert.equal(await exchangeAuthCode(auth, new URLSearchParams({ code: 'one-time-code' })), true);
  assert.ok(provider.calls.some((call) => call.grant === 'pkce' && call.body.code_verifier));
  assert.equal((await serverClient(store, provider).auth.getUser()).data.user?.id, user.id);
});

test('Proxy forwards refreshed session cookies to rendering and the browser with private cache headers', async (t) => {
  const store = cookieStore();
  const provider = mockProvider();
  const past = Math.floor(Date.now() / 1000) - 60;
  store.values.set(
    'sb-arcuate-auth-test-auth-token',
    `base64-${Buffer.from(
      JSON.stringify({
        ...provider.session,
        access_token: token(past),
        expires_at: past,
      }),
    ).toString('base64url')}`,
  );

  const previous = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    fetch: globalThis.fetch,
  };
  process.env.NEXT_PUBLIC_SUPABASE_URL = publicUrl;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = publicKey;
  globalThis.fetch = provider.fetch;
  t.after(() => {
    if (previous.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previous.url;
    if (previous.key === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previous.key;
    globalThis.fetch = previous.fetch;
  });
  const request = new NextRequest('https://arcuate.example/texts', {
    headers: { cookie: [...store.values].map(([name, value]) => `${name}=${value}`).join('; ') },
  });
  const response = await updateSession(request);
  assert.ok(provider.calls.some((call) => call.grant === 'refresh_token'));
  const cookie = response.cookies.get('sb-arcuate-auth-test-auth-token');
  assert.ok(cookie?.value);
  assert.equal(request.cookies.get(cookie.name)?.value, cookie.value);
  assert.ok(response.headers.get('x-middleware-request-cookie')?.includes(cookie.value));
  assert.match(response.headers.get('cache-control'), /private.*no-store/);
  assert.equal(response.headers.get('pragma'), 'no-cache');
});

test('Proxy leaves guest access available without contacting Supabase', async (t) => {
  const previous = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    fetch: globalThis.fetch,
  };
  process.env.NEXT_PUBLIC_SUPABASE_URL = publicUrl;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = publicKey;
  globalThis.fetch = () => assert.fail('A guest page should not need a provider request');
  t.after(() => {
    if (previous.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previous.url;
    if (previous.key === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previous.key;
    globalThis.fetch = previous.fetch;
  });
  const response = await updateSession(new NextRequest('https://arcuate.example/'));
  assert.equal(response.status, 200);
  assert.equal(response.cookies.getAll().length, 0);
});
