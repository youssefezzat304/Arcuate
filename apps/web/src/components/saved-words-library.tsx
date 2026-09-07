"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listWordLists, type WordList } from "@/lib/saved-words";
import { SUPPORTED_LANGUAGES } from "@/lib/supported-languages";

type LibraryState = { status: "loading" } | { status: "error" } | { status: "ready"; lists: WordList[]; invalidCount: number };

export function SavedWordsLibrary() {
  const [state, setState] = useState<LibraryState>({ status: "loading" });
  useEffect(() => {
    function load() {
      try { setState({ status: "ready", ...listWordLists() }); }
      catch { setState({ status: "error" }); }
    }
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  if (state.status === "loading") return <p role="status">Loading your word lists…</p>;
  if (state.status === "error") return <p role="alert">Your lists could not be loaded. Allow browser storage and reload this page.</p>;
  return <>
    <p className="mb-8 text-sm leading-6 text-muted-foreground">Your words, collected as you read. Lists are saved in this browser without an account.</p>
    {state.invalidCount > 0 && <p role="alert" className="mb-5 text-sm">Some lists could not be read. They have not been deleted.</p>}
    {state.lists.length === 0 ? (
      <section className="rounded-xl border border-border bg-paper p-6 sm:p-10">
        <h2 className="mb-3 font-serif text-2xl">Make new words your own.</h2>
        <p className="mb-5 text-sm leading-7 text-muted-foreground">Select a word in a reading text and choose the bookmark button. Save it to a list or create your first one.</p>
        <Link href="/texts" className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2">Open My texts</Link>
      </section>
    ) : <div className="space-y-6">
      {state.lists.map((list) => <section key={list.id} className="rounded-xl border border-border bg-paper p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-4">
          <h2 className="break-words font-serif text-2xl">{list.name}</h2>
          <p className="text-xs text-muted-foreground">{list.words.length} {list.words.length === 1 ? "word" : "words"}</p>
        </div>
        <ul className="divide-y divide-border">
          {list.words.map((word) => <li key={word.id} className="py-4 first:pt-0 last:pb-0">
            <p lang={word.language} dir="auto" className="mb-2 break-words font-serif text-xl">{word.text}</p>
            <p className="text-xs leading-6 text-muted-foreground">
              {SUPPORTED_LANGUAGES.find((language) => language.code === word.language)?.name} · {" "}
              <Link href={`/texts/${word.sourceTextId}`} className="underline underline-offset-4 hover:text-foreground focus-visible:outline-2">{word.sourceTitle}</Link>
            </p>
          </li>)}
        </ul>
      </section>)}
    </div>}
  </>;
}
