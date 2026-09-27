import { z } from 'zod';
import { generatedTextSchema, translationFitsText } from '@arcuate/ai/schema';
import { analysisFitsText, analyzeTextExact } from '@arcuate/language';
import { textAnalysisSchema } from '@arcuate/language/schema';
import { createTextRequestSchema } from './reading-settings.ts';
import { textAnnotationSchema, type TextAnnotation } from './text-formatting.ts';

const backgroundImageSchema = z
  .string()
  .max(1_500_000, 'Choose an image smaller than 1 MB.')
  .regex(
    /^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/]+=*$/,
    'Choose a JPG, PNG, or WebP image.',
  );

export const manualTextInputSchema = z.object({
  backgroundImage: backgroundImageSchema.optional(),
  title: z.string().trim().min(1, 'Enter a title.').max(300, 'Use 300 characters or fewer.'),
  text: z
    .string()
    .trim()
    .min(1, 'Enter some text.')
    .max(100_000, 'Use 100,000 characters or fewer.'),
  language: createTextRequestSchema.shape.language,
  level: createTextRequestSchema.shape.level,
}).superRefine(({ text }, context) => {
  const paragraphs = manualTextParagraphs(text);
  if (paragraphs.length > 300) {
    context.addIssue({
      code: 'custom',
      path: ['text'],
      message: 'Use 300 paragraphs or fewer.',
    });
  }
  if (paragraphs.some((paragraph) => paragraph.length > 20_000)) {
    context.addIssue({
      code: 'custom',
      path: ['text'],
      message: 'Keep each paragraph to 20,000 characters or fewer.',
    });
  }
});
export type ManualTextInput = z.infer<typeof manualTextInputSchema>;

export function countCharacters(paragraphs: string[]) {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  return Array.from(segmenter.segment(paragraphs.join('\n\n'))).length;
}

export const savedTextSchema = generatedTextSchema
  .extend({
    source: z.enum(['generated', 'manual']).optional(),
    backgroundImage: backgroundImageSchema.optional(),
    id: z.uuid(),
    createdAt: z.iso.datetime(),
    // Preserve the original preset on older readings without accepting it for new requests.
    settings: createTextRequestSchema.extend({
      length: z.union([createTextRequestSchema.shape.length, z.enum(['short', 'medium', 'long'])]),
    }),
    analysis: textAnalysisSchema.optional(),
    annotations: z.array(textAnnotationSchema).max(20_000).optional().default([]),
  })
  .refine(
    (text) =>
      !text.translation ||
      (translationFitsText(text.translation, text.paragraphs) &&
        text.translation.language === text.settings.translationLanguage),
    'Translation must align with the original text and selected language.',
  )
  .transform((text) => ({
    ...text,
    analysis:
      text.analysis && analysisFitsText(text.analysis, text.paragraphs, text.settings.language)
        ? text.analysis
        : analyzeTextExact(text.paragraphs, text.settings.language),
    annotations: text.annotations.filter(
      ({ end }) =>
        end <=
        text.title.length +
          text.paragraphs.reduce((length, paragraph) => length + paragraph.length, 0),
    ),
    // Derive the count from the body so older word-count records remain readable.
    characterCount: countCharacters(text.paragraphs),
  }));
export type SavedText = z.infer<typeof savedTextSchema>;
const prefix = 'arcuate:text:v1:';
export const SAVED_TEXTS_CHANGED_EVENT = 'arcuate:saved-texts-changed';

function announceSavedTextsChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SAVED_TEXTS_CHANGED_EVENT));
}

export function saveText(text: SavedText) {
  const validated = savedTextSchema.parse(text);
  // One key per record avoids overwriting another tab's newly saved texts.
  localStorage.setItem(prefix + validated.id, JSON.stringify(validated));
  announceSavedTextsChanged();
}

export function manualTextParagraphs(text: string) {
  return text
    .trim()
    .split(/\n\s*\n/u)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function countManualTextCharacters(text: string) {
  return countCharacters(manualTextParagraphs(text));
}

export function createManualText(input: ManualTextInput) {
  const parsed = manualTextInputSchema.parse(input);
  return savedTextSchema.parse({
    source: 'manual',
    backgroundImage: parsed.backgroundImage,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    settings: {
      topic: parsed.title,
      language: parsed.language,
      level: parsed.level,
      // Manual readings have no requested length; retain the smallest valid legacy target.
      length: 2000,
    },
    title: parsed.title,
    paragraphs: manualTextParagraphs(parsed.text),
    annotations: [],
  });
}

export function readText(id: string): SavedText | null {
  const raw = localStorage.getItem(prefix + id);
  if (raw === null) return null;
  const stored: unknown = JSON.parse(raw);
  const text = savedTextSchema.parse(stored);
  if (
    typeof stored === 'object' &&
    stored !== null &&
    (!('analysis' in stored) || !('annotations' in stored))
  ) {
    try {
      localStorage.setItem(prefix + id, JSON.stringify(text));
    } catch {
      /* A failed lazy upgrade must not make an existing text unreadable. */
    }
  }
  return text;
}

export function saveTextAnnotations(id: string, annotations: TextAnnotation[]) {
  const text = readText(id);
  if (!text) throw new Error('This text is no longer saved in this browser.');
  const updated = savedTextSchema.parse({ ...text, annotations });
  saveText(updated);
  return updated;
}

export function deleteText(id: string) {
  const text = readText(id);
  if (!text) throw new Error('This text is no longer saved in this browser.');
  localStorage.removeItem(prefix + id);
  announceSavedTextsChanged();
}

export function listTexts() {
  const texts: SavedText[] = [];
  let invalidCount = 0;
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (!key?.startsWith(prefix)) continue;
    try {
      const record = readText(key.slice(prefix.length));
      if (record) texts.push(record);
    } catch {
      // Preserve damaged records and report them without hiding healthy texts.
      invalidCount++;
    }
  }
  return { texts: texts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), invalidCount };
}
