import type { Metadata } from "next";
import { SavedWordsLibrary } from "@/components/saved-words-library";

export const metadata: Metadata = { title: "Saved words · Arcuate" };

export default function SavedWordsPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your vocabulary</p>
      <h1 className="mb-8 font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">Saved words</h1>
      <SavedWordsLibrary />
    </main>
  );
}
