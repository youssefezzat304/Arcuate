import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeAuthCode } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const success = await exchangeAuthCode(supabase.auth, request.nextUrl.searchParams);
  const response = NextResponse.redirect(
    new URL(success ? '/' : '/login?error=callback', request.url),
  );
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
