import type { Metadata } from 'next';
import { TextLibrary } from '@/components/text-library';

export const metadata: Metadata = {
  title: 'My texts · Arcuate',
  description: 'Your personal reading collection.',
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
      <TextLibrary />
    </main>
  );
}
