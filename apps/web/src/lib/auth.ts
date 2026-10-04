import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

export type AuthMode = 'login' | 'signup';
export type AuthResult =
  | { status: 'signed-in' }
  | { status: 'confirmation-required'; message: string }
  | { status: 'error'; message: string };

export const authUserSchema = z.object({
  id: z.uuid(),
  email: z.email().optional(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

const loginSchema = z.object({
  email: z.string().trim().max(254).pipe(z.email('Enter a valid email address.')),
  password: z.string().min(1, 'Enter your password.').max(128, 'Password is too long.'),
});
const signupSchema = loginSchema
  .extend({
    password: z
      .string()
      .min(8, 'Use at least 8 characters for your password.')
      .max(128, 'Password is too long.'),
    confirmPassword: z.string(),
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: 'Your passwords do not match.',
    path: ['confirmPassword'],
  });

export function authErrorMessage(code: string | undefined) {
  switch (code) {
    case 'invalid_credentials':
      return 'The email or password is incorrect.';
    case 'email_not_confirmed':
      return 'Confirm your email before signing in.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many attempts. Please wait a little and try again.';
    case 'weak_password':
      return 'Choose a stronger password and try again.';
    case 'signup_disabled':
      return 'Account creation is currently unavailable.';
    default:
      return 'Unable to sign in or create an account. Please try again.';
  }
}

export async function authenticateWithEmail(
  auth: Pick<SupabaseClient['auth'], 'signInWithPassword' | 'signUp'>,
  mode: AuthMode,
  input: unknown,
  callbackUrl: string,
): Promise<AuthResult> {
  const validated = (mode === 'signup' ? signupSchema : loginSchema).safeParse(input);
  if (!validated.success) return { status: 'error', message: validated.error.issues[0].message };
  const { email, password } = validated.data;

  try {
    const { data, error } =
      mode === 'signup'
        ? await auth.signUp({ email, password, options: { emailRedirectTo: callbackUrl } })
        : await auth.signInWithPassword({ email, password });

    if (error) return { status: 'error', message: authErrorMessage(error.code) };
    if (data.session) return { status: 'signed-in' };
    if (mode === 'signup') {
      return {
        status: 'confirmation-required',
        message: 'Check your email for a confirmation link, then return here to log in.',
      };
    }
    return { status: 'error', message: 'Unable to sign in. Please try again.' };
  } catch {
    return { status: 'error', message: 'Unable to reach the sign-in service. Please try again.' };
  }
}

export async function exchangeAuthCode(
  auth: Pick<SupabaseClient['auth'], 'exchangeCodeForSession'>,
  params: URLSearchParams,
) {
  if (params.has('error')) return false;
  const code = z.string().min(1).max(2048).safeParse(params.get('code'));
  if (!code.success) return false;
  try {
    const { data, error } = await auth.exchangeCodeForSession(code.data);
    return !error && Boolean(data.session);
  } catch {
    // The callback route presents a retry message instead of exposing provider errors.
    return false;
  }
}
