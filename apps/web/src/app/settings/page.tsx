import type { Metadata } from "next";
import { PreferencesSection } from "@/components/preferences-section";

export const metadata: Metadata = { title: "Settings · Arcuate" };

export default function SettingsPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your preferences</p>
      <h1 className="mb-12 font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">Settings</h1>
      <PreferencesSection />
    </main>
  );
}
