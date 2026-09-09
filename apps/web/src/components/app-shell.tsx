'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AmbientLiterature } from '@/components/ambient-literature';
import { PREFERENCES_STORAGE_KEY, applyPreferences, readPreferences } from '@/lib/preferences';

const focusClass =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground';
const labelClass =
  'hidden whitespace-nowrap md:inline md:group-data-[collapsed=true]:hidden max-md:group-data-[mobile-open=true]:inline';

function SidebarIcon({
  name,
}: {
  name: 'new' | 'texts' | 'login' | 'collapse' | 'words' | 'settings';
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 shrink-0"
    >
      {name === 'new' && (
        <>
          <path d="M14 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9" />
          <path d="m17 3 4 4-10 10-5 1 1-5L17 3Z" />
        </>
      )}
      {name === 'texts' && (
        <>
          <path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4V4Z" />
          <path d="M13 7a3 3 0 0 1 3-3h5v15h-4a4 4 0 0 0-4 2" />
        </>
      )}
      {name === 'login' && (
        <>
          <path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5M3 12h12m-4-4 4 4-4 4" />
        </>
      )}
      {name === 'words' && <path d="M6 3h12v18l-6-4-6 4V3Z" />}
      {name === 'settings' && (
        <>
          <path d="M4 6h16M4 12h16M4 18h16" />
          <circle cx="8" cy="6" r="2" fill="var(--paper)" />
          <circle cx="16" cy="12" r="2" fill="var(--paper)" />
          <circle cx="10" cy="18" r="2" fill="var(--paper)" />
        </>
      )}
      {name === 'collapse' && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16m7-11-3 3 3 3" />
        </>
      )}
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const applySavedPreferences = () =>
      applyPreferences(readPreferences(), document.documentElement, colorScheme.matches);
    const followStoredPreferences = (event: StorageEvent) => {
      if (event.key === PREFERENCES_STORAGE_KEY) applySavedPreferences();
    };

    applySavedPreferences();
    colorScheme.addEventListener('change', applySavedPreferences);
    window.addEventListener('storage', followStoredPreferences);
    return () => {
      colorScheme.removeEventListener('change', applySavedPreferences);
      window.removeEventListener('storage', followStoredPreferences);
    };
  }, []);

  function closeMobileSidebar() {
    setMobileOpen(false);
    mobileToggleRef.current?.focus();
  }

  return (
    <div
      className="group relative isolate min-h-dvh"
      data-collapsed={collapsed}
      data-mobile-open={mobileOpen}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && mobileOpen) closeMobileSidebar();
      }}
    >
      <AmbientLiterature />
      <a
        href="#main-content"
        className={`sr-only fixed top-4 left-4 z-50 rounded-lg bg-accent px-4 py-3 focus:not-sr-only ${focusClass}`}
      >
        Skip to content
      </a>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          tabIndex={-1}
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-20 bg-overlay/60 md:hidden"
        />
      )}
      <aside
        id="app-sidebar"
        aria-label="Sidebar"
        className="fixed inset-y-4 left-3 z-30 flex w-16 flex-col overflow-y-auto rounded-xl border border-border bg-paper px-2 py-5 md:left-5 md:w-60 md:px-3 md:group-data-[collapsed=true]:w-16 md:group-data-[collapsed=true]:px-2 max-md:group-data-[mobile-open=true]:w-60 max-md:group-data-[mobile-open=false]:bottom-auto max-md:group-data-[mobile-open=false]:py-2"
      >
        <Link
          href="/"
          aria-label="Arcuate home"
          title="Arcuate"
          onClick={() => setMobileOpen(false)}
          className={`max-md:hidden max-md:group-data-[mobile-open=true]:flex mb-5 flex h-12 shrink-0 items-center gap-0 rounded-lg px-3 font-serif text-2xl font-semibold tracking-[-0.04em] ${focusClass}`}
        >
          <span>A</span>
          <span className={labelClass}>rcuate</span>
        </Link>

        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(!collapsed)}
          className={`mb-7 hidden h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-muted-foreground hover:bg-background hover:text-foreground md:flex ${focusClass}`}
        >
          <span className={collapsed ? 'rotate-180' : ''}>
            <SidebarIcon name="collapse" />
          </span>
          <span className={labelClass}>Collapse</span>
        </button>
        <button
          ref={mobileToggleRef}
          type="button"
          aria-label={mobileOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={mobileOpen}
          aria-controls="app-sidebar"
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`mb-0 group-data-[mobile-open=true]:mb-7 flex h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-muted-foreground hover:bg-background md:hidden ${focusClass}`}
        >
          <span className={mobileOpen ? '' : 'rotate-180'}>
            <SidebarIcon name="collapse" />
          </span>
          <span className={labelClass}>Collapse</span>
        </button>

        <nav
          aria-label="Main navigation"
          className="space-y-2 max-md:hidden max-md:group-data-[mobile-open=true]:block"
        >
          {(
            [
              { href: '/', label: 'New text', icon: 'new' },
              { href: '/texts', label: 'My texts', icon: 'texts' },
              { href: '/saved-words', label: 'Saved words', icon: 'words' },
              { href: '/settings', label: 'Settings', icon: 'settings' },
            ] as const
          ).map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={pathname === href ? 'page' : undefined}
              title={label}
              onClick={() => setMobileOpen(false)}
              className={`flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-background aria-[current=page]:bg-warm-highlight aria-[current=page]:text-foreground ${focusClass}`}
            >
              <SidebarIcon name={icon} />
              <span className={labelClass}>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-8 max-md:hidden max-md:group-data-[mobile-open=true]:block">
          <div className="border-t border-border pt-4">
            <button
              type="button"
              disabled
              aria-label="Login (coming soon)"
              title="Login — coming soon"
              className="flex h-12 w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground"
            >
              <SidebarIcon name="login" />
              <span className={labelClass}>Login</span>
              <span className={`${labelClass} ml-auto text-[10px]`}>Soon</span>
            </button>
          </div>
        </div>
      </aside>
      <div
        id="main-content"
        tabIndex={-1}
        className="relative z-10 min-h-dvh pt-20 outline-none md:px-24 md:pt-0"
      >
        {children}
      </div>
    </div>
  );
}
