'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiLogIn, FiLogOut, FiUser } from 'react-icons/fi';
import { authUserSchema, type AuthUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';

export function AccountNavigation({
  initialUser,
  labelClass,
  onNavigate,
}: {
  initialUser: AuthUser | null;
  labelClass: string;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const focusClass =
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground';

  useEffect(() => {
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange((event, session) => {
      // Client session data is only used for presentation. Server identity is separately verified.
      const parsed = authUserSchema.safeParse(session?.user);
      setUser(parsed.success ? parsed.data : null);
      if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // Keep SDK callbacks synchronous to avoid holding the auth lock during further auth work.
        queueMicrotask(() => router.refresh());
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function logout() {
    setPending(true);
    setError(null);
    try {
      const { error: logoutError } = await createClient().auth.signOut({ scope: 'local' });
      if (logoutError) {
        setError('Unable to log out. Please try again.');
        return;
      }
      setUser(null);
      onNavigate();
      router.refresh();
    } catch {
      setError('Unable to reach the sign-in service. Please try again.');
    } finally {
      setPending(false);
    }
  }

  if (!user)
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        aria-label="Log in"
        title="Log in"
        className={`flex h-12 items-center gap-3 px-3 text-xs font-semibold uppercase tracking-[0.08em] hover:bg-background ${focusClass}`}
      >
        <FiLogIn aria-hidden="true" className="size-[18px] shrink-0 stroke-[1.5]" />
        <span className={labelClass}>Login</span>
      </Link>
    );

  const name = user.email ?? 'Your account';
  return (
    <>
      <div
        title={`Signed in as ${name}`}
        aria-label={`Signed in as ${name}`}
        className="flex min-h-12 items-center gap-3 px-3"
      >
        <FiUser aria-hidden="true" className="size-[18px] shrink-0 stroke-[1.5]" />
        <div className={`${labelClass} min-w-0`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Signed in
          </p>
          <p className="max-w-40 truncate text-xs">{name}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={logout}
        disabled={pending}
        aria-label="Log out"
        title={error ?? 'Log out'}
        className={`flex h-12 w-full items-center gap-3 px-3 text-xs font-semibold uppercase tracking-[0.08em] hover:bg-background disabled:cursor-wait disabled:opacity-60 ${focusClass}`}
      >
        <FiLogOut aria-hidden="true" className="size-[18px] shrink-0 stroke-[1.5]" />
        <span className={labelClass}>{pending ? 'Logging out…' : 'Log out'}</span>
      </button>
      {error && (
        <p
          role="alert"
          className="px-3 text-xs leading-relaxed md:group-data-[collapsed=true]:sr-only"
        >
          {error}
        </p>
      )}
    </>
  );
}
