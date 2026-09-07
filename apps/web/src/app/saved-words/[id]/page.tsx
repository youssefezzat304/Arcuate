import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { SavedWordList } from "@/components/saved-word-list";

export const metadata: Metadata = { title: "Word list · Arcuate" };

export default async function WordListPage({ params }: PageProps<"/saved-words/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <Link href="/saved-words" className="mb-6 inline-flex min-h-11 items-center text-sm underline underline-offset-4 focus-visible:outline-2">← Saved words</Link>
      <SavedWordList key={id} id={id} />
    </main>
  );
}
