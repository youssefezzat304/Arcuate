import { z } from 'zod';
import { createTextRequestSchema, CEFR_LEVELS } from './reading-settings.ts';

export const wordExplanationRequestSchema = z
  .object({
    surface: z.string().min(1).max(200),
    paragraph: z.string().min(1).max(20000),
    start: z.number().int().nonnegative(),
    end: z.number().int().positive(),
    sourceLanguage: createTextRequestSchema.shape.language,
    targetLanguage: createTextRequestSchema.shape.language,
    level: z.enum(CEFR_LEVELS),
  })
  .refine(
    (value) =>
      value.end > value.start &&
      value.paragraph.slice(value.start, value.end) === value.surface &&
      value.end <= value.paragraph.length,
    'Selected word must match its source offsets.',
  );
export type WordExplanationRequest = z.infer<typeof wordExplanationRequestSchema>;
