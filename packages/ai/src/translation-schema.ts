import { z } from 'zod';

const sentencePairSchema = z.object({
  source: z.string().trim().min(1).max(20000),
  translation: z.string().trim().min(1).max(20000),
});
export const bilingualTextSchema = z.object({
  title: z.string().trim().min(1).max(300),
  translatedTitle: z.string().trim().min(1).max(500),
  paragraphs: z
    .array(z.object({ sentences: z.array(sentencePairSchema).min(1).max(300) }))
    .min(1)
    .max(300),
});

export const textTranslationSchema = z.object({
  language: z.string().min(2).max(20),
  title: z.string().min(1).max(500),
  paragraphs: z
    .array(
      z.object({
        sentences: z
          .array(
            z.object({
              start: z.number().int().nonnegative(),
              end: z.number().int().positive(),
              text: z.string().min(1).max(20000),
            }),
          )
          .min(1)
          .max(300),
      }),
    )
    .min(1)
    .max(300),
});
export type TextTranslation = z.infer<typeof textTranslationSchema>;

export function translationFitsText(translation: TextTranslation, paragraphs: string[]) {
  return (
    translation.paragraphs.length === paragraphs.length &&
    translation.paragraphs.every((paragraph, index) => {
      let previousEnd = 0;
      return (
        paragraph.sentences.every((sentence, sentenceIndex) => {
          const expectedStart = sentenceIndex === 0 ? 0 : previousEnd + 1;
          previousEnd = sentence.end;
          return (
            sentence.start === expectedStart &&
            sentence.end > sentence.start &&
            sentence.end <= paragraphs[index]!.length &&
            (sentenceIndex === 0 || paragraphs[index]![sentence.start - 1] === ' ')
          );
        }) && previousEnd === paragraphs[index]!.length
      );
    })
  );
}

export function assembleBilingualText(
  value: z.infer<typeof bilingualTextSchema>,
  language: string,
) {
  return {
    title: value.title,
    paragraphs: value.paragraphs.map((paragraph) =>
      paragraph.sentences.map((sentence) => sentence.source).join(' '),
    ),
    translation: {
      language,
      title: value.translatedTitle,
      paragraphs: value.paragraphs.map((paragraph) => {
        let offset = 0;
        return {
          sentences: paragraph.sentences.map((sentence) => {
            const start = offset;
            const end = start + sentence.source.length;
            offset = end + 1;
            return { start, end, text: sentence.translation };
          }),
        };
      }),
    },
  };
}

export const wordExplanationSchema = z.object({
  translation: z.string().trim().min(1).max(500),
  meaning: z.string().trim().min(1).max(1500),
  contextMeaning: z.string().trim().min(1).max(1500),
  grammar: z.string().trim().min(1).max(1500),
  examples: z
    .array(
      z.object({
        source: z.string().trim().min(1).max(1000),
        translation: z.string().trim().min(1).max(1000),
      }),
    )
    .min(1)
    .max(4)
    .superRefine((examples, context) => {
      const sources = new Set<string>();
      for (const [index, example] of examples.entries()) {
        const normalized = example.source.normalize('NFC').toLocaleLowerCase();
        if (sources.has(normalized))
          context.addIssue({
            code: 'custom',
            message: 'Example sentences must be distinct.',
            path: [index, 'source'],
          });
        sources.add(normalized);
      }
    }),
});
export type WordExplanation = z.infer<typeof wordExplanationSchema>;
