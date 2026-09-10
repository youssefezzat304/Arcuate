'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { ListActionsMenu } from '@/components/list-actions-menu';
import { StatusNotice } from '@/components/status-notice';
import { useNotice } from '@/hooks/use-notice';
import {
  deleteText,
  listTexts,
  SAVED_TEXTS_CHANGED_EVENT,
  type SavedText,
} from '@/lib/saved-texts';
import { SUPPORTED_LANGUAGES } from '@/lib/supported-languages';

type LibraryState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; texts: SavedText[]; invalidCount: number };

export function TextLibrary() {
  const [state, setState] = useState<LibraryState>({ status: 'loading' });
  const [pendingDelete, setPendingDelete] = useState<SavedText | null>(null);
  const [notice, showNotice] = useNotice();

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
    window.addEventListener(SAVED_TEXTS_CHANGED_EVENT, load);
    return () => {
      window.removeEventListener('storage', load);
      window.removeEventListener(SAVED_TEXTS_CHANGED_EVENT, load);
    };
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
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
        <div>
          <p className="text-lg font-semibold">
            {state.texts.length} saved {state.texts.length === 1 ? 'text' : 'texts'}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Stored in this browser without an account.
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Newest first</p>
      </div>
      {state.invalidCount > 0 && (
        <p role="alert" className="mb-4 text-sm">
          {state.invalidCount} saved record(s) could not be read. They have not been deleted.
        </p>
      )}
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <li>
          <button
            type="button"
            disabled
            aria-label="Import a text, coming later"
            className="flex h-full min-h-80 w-full cursor-not-allowed flex-col items-center justify-center rounded-xl border border-dashed border-border bg-paper px-6 text-center"
          >
            <span
              aria-hidden="true"
              className="flex size-24 items-center justify-center rounded-full border border-border bg-background font-serif text-6xl font-light leading-none text-muted-foreground"
            >
              +
            </span>
            <span className="mt-6 font-serif text-2xl">Import a text</span>
            <span className="mt-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Coming later
            </span>
          </button>
        </li>
        {state.texts.map((text, index) => {
          const language = SUPPORTED_LANGUAGES.find(
            (item) => item.code === text.settings.language,
          )?.name;
          const coverTone = [
            'bg-warm-highlight',
            'bg-background',
            'bg-muted-warm',
            'bg-accent text-accent-foreground',
          ][index % 4];
          return (
            <li
              key={text.id}
              className="group relative flex min-h-80 flex-col rounded-xl border border-border bg-paper p-4 transition-colors hover:border-muted-foreground"
            >
              <div className="absolute right-6 top-6 z-10">
                <ListActionsMenu
                  label={`Actions for ${text.title}`}
                  actions={[{ label: 'Delete text', onSelect: () => setPendingDelete(text) }]}
                />
              </div>
              <Link
                href={`/texts/${text.id}`}
                className="flex h-full flex-col rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <div
                  className={`flex aspect-[4/3] items-center justify-center rounded-lg border border-border font-serif text-8xl ${coverTone}`}
                  aria-hidden="true"
                  dir="auto"
                >
                  {Array.from(text.title.trim())[0] ?? 'A'}
                </div>
                <h2 className="mt-5 line-clamp-3 font-serif text-2xl leading-tight" dir="auto">
                  {text.title}
                </h2>
                <p className="mt-auto pt-5 text-xs leading-5 text-muted-foreground">
                  {language} · {text.settings.level} · {text.characterCount.toLocaleString()}{' '}
                  characters
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Saved {new Date(text.createdAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
      {state.texts.length === 0 && (
        <p className="mt-6 text-sm leading-6 text-muted-foreground">
          Your generated readings will appear here.{' '}
          <Link href="/" className="font-semibold text-foreground underline underline-offset-4">
            Create your first text
          </Link>
          .
        </p>
      )}
      {pendingDelete && (
        <ConfirmationDialog
          title="Delete this text?"
          description={`“${pendingDelete.title}” will be permanently removed from this browser.`}
          confirmLabel="Delete text"
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            try {
              deleteText(pendingDelete.id);
              setPendingDelete(null);
              showNotice('Text deleted.');
            } catch {
              showNotice('This text could not be deleted. Please try again.');
            }
          }}
        />
      )}
      <StatusNotice message={notice} />
    </>
  );
}
