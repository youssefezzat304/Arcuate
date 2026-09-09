'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  createWordList,
  listWordLists,
  saveWordToList,
  type WordDraft,
  type WordList,
} from '@/lib/saved-words';

export function SaveWordDialog({
  word,
  onClose,
  onSaved,
}: {
  word: WordDraft;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [lists, setLists] = useState<WordList[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal();
    function load() {
      try {
        const result = listWordLists();
        setLists(result.lists);
        setWarning(
          result.invalidCount
            ? 'Some saved lists could not be read. They have not been deleted.'
            : null,
        );
        setLoaded(true);
      } catch {
        setLoaded(false);
        setError('Word lists could not be loaded. Allow browser storage and reopen this dialog.');
      }
    }
    load();
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('storage', load);
      dialog.close();
    };
  }, []);

  function save(listId?: string) {
    setError(null);
    try {
      if (listId) {
        const { list, duplicate } = saveWordToList(listId, word);
        onSaved(duplicate ? `Already saved in ${list.name}.` : `Saved to ${list.name}.`);
      } else {
        const list = createWordList(name, word);
        onSaved(`Saved to ${list.name}.`);
      }
      onClose();
    } catch (failure) {
      setError(
        failure instanceof DOMException
          ? 'Your word could not be saved. Browser storage may be full or blocked. Please try again.'
          : failure instanceof Error
            ? failure.message
            : 'Your word could not be saved. Please try again.',
      );
    }
  }

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="save-word-title"
      dir="ltr"
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-32px)] w-md max-w-[calc(100vw-32px)] overflow-y-auto rounded-xl border border-border bg-paper p-0 font-sans text-foreground shadow-lg backdrop:bg-foreground/25"
    >
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id="save-word-title" className="font-serif text-2xl">
            Save word
          </h2>
          <button
            type="button"
            aria-label="Close save word"
            onClick={onClose}
            className="size-10 rounded-lg hover:bg-background focus-visible:outline-2"
          >
            ×
          </button>
        </div>
        <p
          lang={word.language}
          dir="auto"
          className="mb-6 break-words rounded-lg bg-warm-highlight px-4 py-3 font-serif text-xl"
        >
          {word.text}
        </p>
        {warning && (
          <p role="status" className="mb-4 text-sm leading-6 text-muted-foreground">
            {warning}
          </p>
        )}
        {lists.length > 0 ? (
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Choose a list
            </p>
            <ul className="max-h-52 space-y-2 overflow-y-auto">
              {lists.map((list) => (
                <li key={list.id}>
                  <button
                    type="button"
                    onClick={() => save(list.id)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-left text-sm hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <span className="break-words">{list.name}</span>
                    <span className="shrink-0 text-muted-foreground">{list.words.length}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          loaded && (
            <p className="mb-5 text-sm text-muted-foreground">
              Create your first list to save this word.
            </p>
          )
        )}
        <form onSubmit={create} className="border-t border-border pt-5">
          <label htmlFor="word-list-name" className="mb-2 block text-sm font-medium">
            New list name
          </label>
          <input
            id="word-list-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={60}
            placeholder="For example, Everyday German"
            className="mb-3 min-h-11 w-full rounded-lg border border-border px-3 text-sm outline-offset-2"
          />
          <button
            disabled={!loaded || !name.trim()}
            className="min-h-11 w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Create list and save
          </button>
        </form>
        {error && (
          <p role="alert" className="mt-4 text-sm leading-6">
            {error}
          </p>
        )}
      </div>
    </dialog>
  );
}
