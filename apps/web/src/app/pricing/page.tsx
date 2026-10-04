import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Pricing · Arcuate' };

export default function PricingPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Plans & pricing
      </p>
      <h1 className="mb-8 font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">
        Pricing
      </h1>
      <section className="rounded-lg border border-border bg-paper p-6 sm:p-8">
        <h2 className="mb-3 font-serif text-2xl">Coming soon</h2>
        <p className="text-muted-foreground leading-relaxed">
          Plans and generation limits will be published here when they are available.
        </p>
      </section>
    </main>
  );
}
