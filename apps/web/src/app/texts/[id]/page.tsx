import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';

import { ReaderShortcuts } from '@/components/reader-shortcuts';
import { SavedReader } from '@/components/saved-reader';

const textIdSchema = z.uuid();

export const metadata: Metadata = {
  title: 'Your text · Arcuate',
  description: 'A graded reading text from Arcuate.',
};

export default async function TextPage({ params }: PageProps<'/texts/[id]'>) {
  const { id } = await params;

  if (!textIdSchema.safeParse(id).success) {
    notFound();
  }

  return (
    <main className="min-h-dvh px-5 py-5 text-foreground sm:px-8 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <SavedReader
          key={id}
          id={id}
          enrichmentAvailable={Boolean(process.env.LANGUAGE_ANALYZER_URL)}
        />
      </div>
      <ReaderShortcuts />
    </main>
  );
}
