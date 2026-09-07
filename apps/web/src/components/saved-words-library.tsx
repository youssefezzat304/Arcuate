"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listWordLists, SAVED_WORDS_CHANGED_EVENT, type WordList } from "@/lib/saved-words";

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
    window.addEventListener(SAVED_WORDS_CHANGED_EVENT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(SAVED_WORDS_CHANGED_EVENT, load);
    };
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
      {state.lists.map((list) => <Link key={list.id} href={`/saved-words/${list.id}`} className="block break-words rounded-xl border border-border bg-paper p-5 font-serif text-2xl hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:p-6">{list.name}</Link>)}
    </div>}
  </>;
}
