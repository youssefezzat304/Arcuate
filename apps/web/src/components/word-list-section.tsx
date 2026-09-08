"use client";

import { useNotice } from "@/hooks/use-notice";
import { StatusNotice } from "@/components/status-notice";

import Link from "next/link";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { ListActionsMenu } from "@/components/list-actions-menu";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { deleteWordList, removeSavedWord, renameWordList, wordListMarkdown, type WordList } from "@/lib/saved-words";
import { SUPPORTED_LANGUAGES } from "@/lib/supported-languages";

const buttonClass = "min-h-11 rounded-md border border-border px-3 text-sm hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

export function WordListSection({ list, preview = false }: { list: WordList; preview?: boolean }) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  function closeDelete() {
    setConfirmDelete(false);
    requestAnimationFrame(() => sectionRef.current?.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')?.focus());
  }
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(list.name);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useNotice();

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
    <section ref={sectionRef} className="rounded-xl border border-border bg-paper p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        {renaming ? <form onSubmit={(event) => {
          event.preventDefault();
          if (mutate(() => renameWordList(list.id, name), "List renamed.")) setRenaming(false);
        }} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
            <span className="sr-only">List name</span>
            <input autoFocus required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} className="min-h-11 min-w-0 rounded-md border border-border bg-background px-3 font-serif text-2xl outline-offset-2" />
          </label>
          <button type="submit" className={buttonClass}>Save name</button>
          <button type="button" onClick={() => setRenaming(false)} className={buttonClass}>Cancel</button>
        </form> : preview ? <Link href={`/saved-words/${list.id}`} className="min-w-0 flex-1 break-words font-serif text-2xl focus-visible:outline-2 focus-visible:outline-offset-2">{list.name}</Link> : <h1 className="min-w-0 break-words font-serif text-3xl sm:text-4xl">{list.name}</h1>}
        <ListActionsMenu actions={[
          { label: "Copy as Markdown", onSelect: copy },
          { label: "Rename list", onSelect: () => { setName(list.name); setRenaming(true); setError(null); setNotice(null); } },
          { label: "Delete list", onSelect: () => setConfirmDelete(true) },
        ]} />
      </div>
      {error && <p role="alert" className="mb-4 text-sm">{error}</p>}
      <StatusNotice message={notice} />
      {confirmDelete && <ConfirmationDialog title="Delete list?" description={`This deletes “${list.name}” and all its saved words. This cannot be undone.`} confirmLabel="Delete list" onClose={closeDelete} onConfirm={() => {
        closeDelete();
        if (mutate(() => deleteWordList(list.id), "List deleted.") && !preview) router.replace("/saved-words");
      }} />}

      {!preview && <div className="mt-5 border-t border-border pt-4">
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
      </div>}
    </section>
  );
}
