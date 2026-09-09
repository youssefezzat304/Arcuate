import { z } from 'zod';
import { textTranslationSchema } from './translation-schema.ts';
export {
  textTranslationSchema,
  translationFitsText,
  wordExplanationSchema,
  type TextTranslation,
  type WordExplanation,
} from './translation-schema.ts';

export const generatedTextSchema = z.object({
  translation: textTranslationSchema.optional(),
  title: z.string().trim().min(1).max(300),
  paragraphs: z.array(z.string().trim().min(1).max(20000)).min(1).max(300),
});

export type GeneratedText = z.infer<typeof generatedTextSchema>;
