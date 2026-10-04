import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from './config';

export async function createClient({ readOnly = false } = {}) {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseConfig();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        // Server Components read the session refreshed by Proxy; only route handlers write here.
        if (readOnly) return;
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}
