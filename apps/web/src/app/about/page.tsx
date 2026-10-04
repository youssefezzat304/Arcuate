import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About · Arcuate' };

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Reading for language learners
      </p>
      <h1 className="mb-8 font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">
        About Arcuate
      </h1>
      <section className="rounded-lg border border-border bg-paper p-6 sm:p-8">
        <h2 className="mb-3 font-serif text-2xl">Read what interests you</h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            Arcuate creates AI-generated reading material for language learners. Choose a topic,
            language, CEFR level, and text length to build your next reading.
          </p>
          <p>
            Add an optional translation, save words as you read, and revisit your texts in your
            personal reading collection.
          </p>
        </div>
      </section>
    </main>
  );
}
