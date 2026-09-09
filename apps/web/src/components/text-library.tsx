'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listTexts, type SavedText } from '@/lib/saved-texts';
import { SUPPORTED_LANGUAGES } from '@/lib/supported-languages';

type LibraryState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; texts: SavedText[]; invalidCount: number };

export function TextLibrary() {
  const [state, setState] = useState<LibraryState>({ status: 'loading' });
  useEffect(() => {
    function load() {
      try {
        setState({ status: 'ready', ...listTexts() });
      } catch {
        setState({ status: 'error' });
      }
    }
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);
  if (state.status === 'loading') return <p role="status">Loading your texts…</p>;
  if (state.status === 'error')
    return (
      <p role="alert">
        Your texts could not be loaded. Allow browser storage and reload this page.
      </p>
    );
  return (
    <>
      <p className="mb-6 text-sm leading-6 text-muted-foreground">
        Saved in this browser, without an account. Clearing site data removes these texts.
      </p>
      {state.invalidCount > 0 && (
        <p role="alert" className="mb-4 text-sm">
          {state.invalidCount} saved record(s) could not be read. They have not been deleted.
        </p>
      )}
      {state.texts.length === 0 ? (
        <section className="rounded-xl border border-border bg-paper p-6 sm:p-10">
          <h2 className="mb-3 font-serif text-2xl">Your next read starts here.</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Create a text and it will be saved here automatically.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            New text
          </Link>
        </section>
      ) : (
        <ul className="space-y-4">
          {state.texts.map((text) => (
            <li key={text.id}>
              <Link
                href={`/texts/${text.id}`}
                className="block rounded-xl border border-border bg-paper p-6 hover:border-muted-warm focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <h2 className="mb-3 font-serif text-2xl" dir="auto">
                  {text.title}
                </h2>
                <p className="text-xs leading-6 text-muted-foreground">
                  {SUPPORTED_LANGUAGES.find((item) => item.code === text.settings.language)?.name} ·{' '}
                  {text.settings.level} · {text.characterCount.toLocaleString()} characters ·{' '}
                  {new Date(text.createdAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
