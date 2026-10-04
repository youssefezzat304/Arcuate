import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';

export const metadata: Metadata = { title: 'Create account · Arcuate' };

export default function SignupPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Your account
      </p>
      <h1 className="mb-3 font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">
        Create an account
      </h1>
      <p className="mb-8 text-muted-foreground">Join Arcuate with your email or Google account.</p>
      <AuthForm mode="signup" />
    </main>
  );
}
