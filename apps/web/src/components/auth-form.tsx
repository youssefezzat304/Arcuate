'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { authenticateWithEmail, type AuthMode, type AuthResult } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';

const focusClass =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground';
const inputClass = `mt-2 h-12 w-full rounded-md border border-border bg-background px-3 text-base ${focusClass}`;

export function AuthForm({
  mode,
  callbackError = false,
}: {
  mode: AuthMode;
  callbackError?: boolean;
}) {
  const router = useRouter();
  const signup = mode === 'signup';
  const [pending, setPending] = useState<'email' | 'google' | null>(null);
  const [result, setResult] = useState<AuthResult | null>(
    callbackError
      ? {
          status: 'error',
          message:
            'Sign-in could not be completed. The link may have expired or been opened in another browser. Please try again.',
        }
      : null,
  );

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending('email');
    setResult(null);

    try {
      const supabase = createClient();
      const nextResult = await authenticateWithEmail(
        supabase.auth,
        mode,
        {
          email: form.get('email'),
          password: form.get('password'),
          confirmPassword: form.get('confirmPassword'),
        },
        `${window.location.origin}/auth/callback`,
      );
      setResult(nextResult);
      if (nextResult.status === 'signed-in') {
        router.replace('/');
        router.refresh();
      }
    } catch {
      setResult({
        status: 'error',
        message: 'Sign-in is temporarily unavailable. Please try again.',
      });
    } finally {
      setPending(null);
    }
  }

  async function continueWithGoogle() {
    if (pending) return;
    setPending('google');
    setResult(null);
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setResult({ status: 'error', message: 'Google sign-in is unavailable. Please try again.' });
        setPending(null);
      }
    } catch {
      setResult({ status: 'error', message: 'Unable to reach Google sign-in. Please try again.' });
      setPending(null);
    }
  }

  return (
    <section
      className="rounded-lg border border-border bg-paper p-6 sm:p-8"
      aria-label={signup ? 'Create account' : 'Log in'}
    >
      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={pending !== null}
        className={`flex min-h-12 w-full items-center justify-center gap-3 rounded-md border border-foreground/25 px-4 py-3 text-sm font-semibold transition-colors hover:bg-background disabled:cursor-wait disabled:opacity-60 ${focusClass}`}
      >
        <FcGoogle aria-hidden="true" className="size-5 shrink-0" />
        {pending === 'google' ? 'Connecting to Google…' : 'Continue with Google'}
      </button>
      <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>or use your email</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={submitEmail} className="space-y-5" aria-busy={pending !== null}>
        <fieldset disabled={pending !== null} className="space-y-5 disabled:opacity-60">
          <label className="block text-sm font-medium" htmlFor="auth-email">
            Email
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium" htmlFor="auth-password">
            Password
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={signup ? 'new-password' : 'current-password'}
              required
              minLength={signup ? 8 : 1}
              maxLength={128}
              aria-describedby={signup ? 'password-help' : undefined}
              className={inputClass}
            />
            {signup && (
              <span
                id="password-help"
                className="mt-2 block text-xs font-normal text-muted-foreground"
              >
                Use at least 8 characters.
              </span>
            )}
          </label>
          {signup && (
            <label className="block text-sm font-medium" htmlFor="auth-confirm-password">
              Confirm password
              <input
                id="auth-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                maxLength={128}
                className={inputClass}
              />
            </label>
          )}
        </fieldset>
        <div aria-live="polite" aria-atomic="true">
          {result && result.status !== 'signed-in' && (
            <p
              role={result.status === 'error' ? 'alert' : 'status'}
              className={`rounded-md border p-3 text-sm leading-relaxed ${result.status === 'error' ? 'border-foreground/30 bg-background' : 'border-border bg-warm-highlight'}`}
            >
              {result.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={pending !== null}
          className={`flex min-h-12 w-full items-center justify-center gap-3 rounded-md bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground disabled:cursor-wait disabled:opacity-60 ${focusClass}`}
        >
          {pending === 'email'
            ? signup
              ? 'Creating account…'
              : 'Logging in…'
            : signup
              ? 'Create account'
              : 'Log in'}
          <FiArrowRight aria-hidden="true" className="size-4" />
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {signup ? 'Already have an account? ' : 'New to Arcuate? '}
        <Link
          href={signup ? '/login' : '/signup'}
          className={`font-semibold text-foreground underline underline-offset-4 ${focusClass}`}
        >
          {signup ? 'Log in' : 'Create an account'}
        </Link>
      </p>
    </section>
  );
}
