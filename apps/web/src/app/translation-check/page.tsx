'use client';
import { useEffect, useState } from 'react';
import { FormattableReader } from '@/components/formattable-reader';
import { analyzeTextExact } from '@arcuate/language';
import type { TextAnnotation } from '@/lib/text-formatting';
const paragraphs = [
  'Die Sonne scheint. Sie gibt uns Wärme.',
  'Er steht früh auf. Dann liest er ein Buch.',
];
const pairs = [
  ['Die Sonne scheint.', 'The sun shines.'],
  ['Sie gibt uns Wärme.', 'It gives us warmth.'],
  ['Er steht früh auf.', 'He gets up early.'],
  ['Dann liest er ein Buch.', 'Then he reads a book.'],
];
const translation = {
  language: 'en',
  title: 'The Sun',
  paragraphs: [0, 1].map((index) => ({
    sentences: pairs
      .slice(index * 2, index * 2 + 2)
      .map(([source, text], i, group) => ({
        start: i ? group[0]![0]!.length + 1 : 0,
        end: (i ? group[0]![0]!.length + 1 : 0) + source!.length,
        text: text!,
      })),
  })),
};
export default function Check() {
  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
  useEffect(() => {
    const original = window.fetch;
    window.fetch = async (...args) => {
      if (args[0] === '/api/words/explain')
        return Response.json({
          translation: 'sun',
          meaning: 'The star that lights our world.',
          contextMeaning: 'Here it is the sun shining.',
          grammar: 'Sonne is a feminine German noun: die Sonne.',
          examples: [
            { source: 'Die Sonne ist warm.', translation: 'The sun is warm.' },
            { source: 'Ich sehe die Sonne.', translation: 'I see the sun.' },
            { source: 'Die Sonne geht auf.', translation: 'The sun rises.' },
          ],
        });
      return original(...args);
    };
    return () => {
      window.fetch = original;
    };
  }, []);
  return (
    <main className="mx-auto max-w-3xl px-6 pt-48 pb-32">
      <article className="rounded-xl border border-border bg-paper p-8">
        <FormattableReader
          title="Die Sonne"
          metadata="German · A2 · test"
          paragraphs={paragraphs}
          textId="123e4567-e89b-42d3-a456-426614174000"
          language="de"
          analysis={analyzeTextExact(paragraphs, 'de')}
          annotations={annotations}
          onAnnotationsChange={setAnnotations}
          translation={translation}
          translationLanguage="en"
          level="A2"
        />
      </article>
      <p>Saved annotation records: {JSON.stringify(annotations)}</p>
    </main>
  );
}
