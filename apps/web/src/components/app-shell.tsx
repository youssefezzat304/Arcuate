'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FiBookmark, FiBookOpen, FiEdit3, FiLogIn, FiSidebar, FiSliders } from 'react-icons/fi';
import { AmbientLiterature } from '@/components/ambient-literature';
import { PREFERENCES_STORAGE_KEY, applyPreferences, readPreferences } from '@/lib/preferences';

const focusClass =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground';
const labelClass =
  'hidden whitespace-nowrap md:inline md:group-data-[collapsed=true]:hidden max-md:group-data-[mobile-open=true]:inline';

const navigationItems = [
  { href: '/', label: 'New text', icon: FiEdit3},
  { href: '/texts', label: 'My texts', icon: FiBookOpen},
  { href: '/saved-words', label: 'Saved words', icon: FiBookmark},
  { href: '/settings', label: 'Settings', icon: FiSliders},
] as const;

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
          className={`mb-4 flex h-14 shrink-0 items-center gap-0 border-b border-foreground/15 px-3 font-serif text-2xl font-semibold tracking-[-0.04em] max-md:hidden max-md:group-data-[mobile-open=true]:flex ${focusClass}`}
        >
          <span>A</span>
          <span className={labelClass}>rcuate</span>
          <span
            className={`${labelClass} ml-auto font-mono text-[9px] font-normal tracking-[0.14em] text-muted-foreground`}
          >
            EST. 26
          </span>
        </Link>

        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(!collapsed)}
          className={`mb-8 hidden h-10 shrink-0 items-center gap-3 px-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground md:flex ${focusClass}`}
        >
          <span
            className={`transition-transform duration-200 motion-reduce:transition-none ${collapsed ? 'rotate-180' : ''}`}
          >
            <FiSidebar aria-hidden="true" className="size-5 shrink-0" />
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
          className={`mb-0 flex h-10 shrink-0 items-center gap-3 px-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground group-data-[mobile-open=true]:mb-8 hover:text-foreground md:hidden ${focusClass}`}
        >
          <span
            className={`transition-transform duration-200 motion-reduce:transition-none ${mobileOpen ? '' : 'rotate-180'}`}
          >
            <FiSidebar aria-hidden="true" className="size-5 shrink-0" />
          </span>
          <span className={labelClass}>Collapse</span>
        </button>

        <nav
          aria-label="Main navigation"
          className="max-md:hidden max-md:group-data-[mobile-open=true]:block"
        >
          <p
            className={`${labelClass} mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground`}
          >
            Reading desk
          </p>
          <div className="border-y border-border">
            {navigationItems.map(({ href, label, icon: Icon}) => {
              const active = pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  title={label}
                  onClick={() => setMobileOpen(false)}
                  className={`relative flex h-12 items-center gap-3 border-b border-border px-3 text-xs font-semibold uppercase tracking-[0.08em] transition-colors last:border-b-0 hover:bg-background ${active ? 'bg-warm-highlight text-foreground before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-foreground' : 'text-ink-secondary'} ${focusClass}`}
                >
                  <Icon aria-hidden="true" className="size-[18px] shrink-0 stroke-[1.5]" />
                  <span className={labelClass}>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto pt-8 max-md:hidden max-md:group-data-[mobile-open=true]:block">
          <div className="border-t border-foreground/15 pt-4">
            <button
              type="button"
              disabled
              aria-label="Login (coming soon)"
              title="Login — coming soon"
              className="flex h-12 w-full cursor-not-allowed items-center gap-3 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
            >
              <FiLogIn aria-hidden="true" className="size-[18px] shrink-0 stroke-[1.5]" />
              <span className={labelClass}>Login</span>
              <span className={`${labelClass} ml-auto font-mono text-[9px] font-normal`}>Soon</span>
            </button>
          </div>
        </div>
      </aside>
      <div
        id="main-content"
        tabIndex={-1}
        className="relative z-10 min-h-dvh pt-20 outline-none transition-[padding-left] duration-200 md:pt-0 md:pl-[260px] md:group-data-[collapsed=true]:pl-[84px] motion-reduce:transition-none"
      >
        {children}
      </div>
    </div>
  );
}
