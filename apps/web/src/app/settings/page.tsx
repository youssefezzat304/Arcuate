import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings · Arcuate" };

export default function SettingsPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your preferences</p>
      <h1 className="mb-8 font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">Settings</h1>
      <section className="rounded-xl border border-border bg-paper p-6 sm:p-10">
        <h2 className="mb-3 font-serif text-2xl">More ways to make Arcuate yours.</h2>
        <p className="text-sm leading-7 text-muted-foreground">Settings are coming soon. For now, choose your language, level, and text length when creating a new text.</p>
      </section>
    </main>
  );
}
