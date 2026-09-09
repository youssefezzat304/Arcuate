'use client';

import { useEffect, useRef, useState } from 'react';
import { READER_SHORTCUTS, TRANSLATION_SHORTCUTS } from '@/lib/reader-shortcuts';

function ShortcutGuide({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="reader-shortcuts-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-32px)] w-md max-w-[calc(100vw-32px)] overflow-y-auto rounded-xl border border-border bg-paper p-6 text-foreground shadow-lg backdrop:bg-overlay/60"
    >
      <h2 id="reader-shortcuts-title" className="font-serif text-2xl">
        Reader shortcuts
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Select text in the reading, then use Control with one of these keys. Use Control on Mac too.
      </p>
      <dl className="mt-5 divide-y divide-border">
        {READER_SHORTCUTS.map((shortcut) => (
          <div key={shortcut.key} className="flex items-center justify-between gap-4 py-3">
            <dt className="text-sm">{shortcut.label}</dt>
            <dd className="shrink-0">
              <kbd className="rounded border border-border bg-background px-2 py-1 font-mono text-xs">
                Ctrl + {shortcut.key.toUpperCase()}
              </kbd>
            </dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 py-3">
          <dt className="text-sm">Dismiss a menu, dialog, or formatting toolbar</dt>
          <dd>
            <kbd className="rounded border border-border bg-background px-2 py-1 font-mono text-xs">
              Esc
            </kbd>
          </dd>
        </div>
      </dl>
      <section className="mt-5 border-t border-border pt-4 text-sm leading-6">
        <h3 className="mb-2 font-semibold">Translation</h3>
        <p>
          Hover over source text and use the shortcuts below. Sentence and paragraph translations
          stay visible only while you hold their shortcut, then return to the original text.
        </p>
        <p className="mt-2 text-muted-foreground">
          Translation shortcuts are available on readings generated with a translation language.
        </p>
        <dl className="mt-4 divide-y divide-border border-y border-border">
          {TRANSLATION_SHORTCUTS.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between gap-4 py-3">
              <dt>{shortcut.label}</dt>
              <dd className="shrink-0">
                <kbd className="rounded border border-border bg-background px-2 py-1 font-mono text-xs">
                  Ctrl + {shortcut.hold ? 'hold ' : ''}
                  {shortcut.key.toUpperCase()}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Close
        </button>
      </div>
    </dialog>
  );
}

export function ReaderShortcuts() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Reader shortcuts"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-30 flex size-11 items-center justify-center rounded-full border border-border bg-paper text-foreground hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="size-5"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6m0-10v1" />
        </svg>
      </button>
      {open && (
        <ShortcutGuide
          onClose={() => {
            setOpen(false);
            requestAnimationFrame(() => triggerRef.current?.focus());
          }}
        />
      )}
    </>
  );
}
