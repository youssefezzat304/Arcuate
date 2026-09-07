"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteWordList, removeSavedWord, renameWordList, wordListMarkdown, type WordList } from "@/lib/saved-words";
import { SUPPORTED_LANGUAGES } from "@/lib/supported-languages";

const buttonClass = "min-h-11 rounded-md border border-border px-3 text-sm hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

export function WordListSection({ list }: { list: WordList }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(list.name);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function mutate(action: () => void, message: string) {
    setError(null);
    setNotice(null);
    try { action(); setNotice(message); return true; }
    catch (failure) {
      setError(failure instanceof Error ? failure.message : "The change could not be saved. Check browser storage and try again.");
      return false;
    }
  }

  async function copy() {
    setError(null);
    setNotice(null);
    try {
      await navigator.clipboard.writeText(wordListMarkdown(list));
      setNotice("Copied as Markdown.");
    } catch { setError("Could not copy. Allow clipboard access and try again."); }
  }

  return (
    <details className="rounded-xl border border-border bg-paper p-5 sm:p-6">
      <summary className="cursor-pointer break-words font-serif text-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{list.name}</summary>
      <div className="mt-5 border-t border-border pt-4">
        <div className="mb-5 flex flex-wrap gap-2">
          <button type="button" onClick={copy} className={buttonClass}>Copy as Markdown</button>
          <button type="button" onClick={() => { setName(list.name); setRenaming(true); setError(null); setNotice(null); }} className={buttonClass}>Rename list</button>
          <button type="button" onClick={() => {
            if (window.confirm(`Delete “${list.name}” and all its saved words? This cannot be undone.`)) {
              mutate(() => deleteWordList(list.id), "List deleted.");
            }
          }} className={buttonClass}>Delete list</button>
        </div>
        {renaming && <form onSubmit={(event) => {
          event.preventDefault();
          if (mutate(() => renameWordList(list.id, name), "List renamed.")) setRenaming(false);
        }} className="mb-5 flex flex-wrap items-end gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
            List name
            <input autoFocus required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} className="min-h-11 min-w-0 rounded-md border border-border bg-background px-3 outline-offset-2" />
          </label>
          <button type="submit" className={buttonClass}>Save name</button>
          <button type="button" onClick={() => setRenaming(false)} className={buttonClass}>Cancel</button>
        </form>}
        {error && <p role="alert" className="mb-4 text-sm">{error}</p>}
        {notice && <p role="status" className="mb-4 text-sm text-muted-foreground">{notice}</p>}
        {list.words.length === 0 ? <p className="text-sm text-muted-foreground">This list has no saved words yet.</p> : <ul className="divide-y divide-border">
          {list.words.map((word) => <li key={word.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p lang={word.language} dir="auto" className="mb-2 break-words font-serif text-xl">{word.text}</p>
              <p className="break-words text-xs leading-6 text-muted-foreground">
                {SUPPORTED_LANGUAGES.find((language) => language.code === word.language)?.name} · {" "}
                <Link href={`/texts/${word.sourceTextId}`} className="underline underline-offset-4 hover:text-foreground focus-visible:outline-2">{word.sourceTitle}</Link>
              </p>
            </div>
            <button type="button" aria-label={`Remove ${word.text}`} onClick={() => mutate(() => removeSavedWord(list.id, word.id), `Removed “${word.text}”.`)} className={`${buttonClass} shrink-0`}>Remove</button>
          </li>)}
        </ul>}
      </div>
    </details>
  );
}
