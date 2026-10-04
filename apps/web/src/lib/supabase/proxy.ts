import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server.js';
import { getSupabaseConfig } from './config.ts';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        const previousCookies = response.cookies.getAll();
        const previousHeaders = response.headers;
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        // Preserve both refreshed cookies and the SDK's no-cache headers on the returned response.
        response = NextResponse.next({ request: { headers: request.headers } });
        for (const cookie of previousCookies) response.cookies.set(cookie);
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const name of ['cache-control', 'expires', 'pragma']) {
          const value = previousHeaders.get(name);
          if (value) response.headers.set(name, value);
        }
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      },
    },
  });

  const { error } = await supabase.auth.getClaims();
  if (error && error.name !== 'AuthSessionMissingError') {
    console.error('Supabase session verification failed:', error.code ?? error.name);
  }
  // Personalised pages and auth cookie writes must never be cached by a shared CDN.
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
