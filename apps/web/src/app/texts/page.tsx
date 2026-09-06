import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My texts · Arcuate",
  description: "Your personal reading collection.",
};

export default function MyTextsPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-5 py-16 sm:px-8 sm:py-24">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Your reading collection
      </p>
      <h1 className="mb-8 font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">
        My texts
      </h1>
      <section className="rounded-xl border border-border bg-paper p-6 sm:p-10">
        <h2 className="mb-3 font-serif text-2xl">A place for your next reads.</h2>
        <p className="max-w-md text-sm leading-7 text-muted-foreground">
          Your saved texts will live here. Saving texts is coming soon; for now,
          you can try creating a new text.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          New text
        </Link>
      </section>
    </main>
  );
}
