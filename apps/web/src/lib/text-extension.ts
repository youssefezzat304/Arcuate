import { z } from 'zod';
import {
  generatedTextSchema,
  textTranslationSchema,
  translationFitsText,
} from '@arcuate/ai/schema';
import { analysisFitsText } from '@arcuate/language';
import { textAnalysisSchema } from '@arcuate/language/schema';
import { createTextRequestSchema } from './reading-settings.ts';
import { readText, saveText, savedTextSchema, type SavedText } from './saved-texts.ts';

export const extensionRequestSchema = z
  .object({
    prompt: z
      .string()
      .trim()
      .min(1, 'Describe how you want to extend the text.')
      .max(2000, 'Use 2,000 characters or fewer for your prompt.'),
    length: createTextRequestSchema.shape.length,
    original: generatedTextSchema.pick({ title: true, paragraphs: true }).extend({
      language: createTextRequestSchema.shape.language,
      level: createTextRequestSchema.shape.level,
      translationLanguage: createTextRequestSchema.shape.translationLanguage,
    }),
  })
  .superRefine(({ original }, context) => {
    if (original.paragraphs.join('\n\n').length > 100_000) {
      context.addIssue({
        code: 'custom',
        message:
          'This text is too long to extend. The existing body must be under 100,000 characters.',
        path: ['original'],
      });
    }
    if (original.paragraphs.length >= 300) {
      context.addIssue({
        code: 'custom',
        message: 'This text has reached the 300-paragraph limit.',
        path: ['original'],
      });
    }
  });
export type ExtensionRequest = z.infer<typeof extensionRequestSchema>;

export const textExtensionSchema = generatedTextSchema
  .omit({ title: true })
  .extend({
    translation: textTranslationSchema.omit({ title: true }).optional(),
    analysis: textAnalysisSchema,
  })
  .refine(
    (extension) =>
      !extension.translation ||
      translationFitsText(
        {
          ...extension.translation,
          title: 'Extension',
        },
        extension.paragraphs,
      ),
    'The extension translation must align with its source paragraphs.',
  );
export type TextExtension = z.infer<typeof textExtensionSchema>;

export function extensionOriginal(text: SavedText): ExtensionRequest['original'] {
  return {
    title: text.title,
    paragraphs: text.paragraphs,
    language: text.settings.language,
    level: text.settings.level,
    // Only bilingual readings can append bilingual content without creating partial translations.
    translationLanguage: text.translation ? text.settings.translationLanguage : undefined,
  };
}

export function appendTextExtension(text: SavedText, input: unknown): SavedText {
  const extension = textExtensionSchema.parse(input);
  if (!analysisFitsText(extension.analysis, extension.paragraphs, text.settings.language)) {
    throw new Error('The extension analysis does not match the reading language and text.');
  }
  if (
    Boolean(extension.translation) !== Boolean(text.translation) ||
    (extension.translation && extension.translation.language !== text.translation?.language)
  ) {
    throw new Error('The extension must use the same translation language as the original text.');
  }
  if (text.paragraphs.length + extension.paragraphs.length > 300) {
    throw new Error(
      'The extended reading would exceed the 300-paragraph limit. Try a shorter extension.',
    );
  }
  const sameAnalyzer =
    text.analysis.analyzer === extension.analysis.analyzer &&
    text.analysis.version === extension.analysis.version;
  return savedTextSchema.parse({
    ...text,
    paragraphs: [...text.paragraphs, ...extension.paragraphs],
    ...(text.translation && extension.translation
      ? {
          translation: {
            ...text.translation,
            paragraphs: [...text.translation.paragraphs, ...extension.translation.paragraphs],
          },
        }
      : {}),
    analysis: {
      ...text.analysis,
      analyzer: sameAnalyzer ? text.analysis.analyzer : 'mixed',
      version: sameAnalyzer ? text.analysis.version : 1,
      paragraphs: [...text.analysis.paragraphs, ...extension.analysis.paragraphs],
    },
  });
}

export function saveTextExtension(
  id: string,
  original: ExtensionRequest['original'],
  extension: TextExtension,
) {
  const latest = readText(id);
  if (!latest) throw new Error('This text is no longer saved in this browser.');
  if (JSON.stringify(extensionOriginal(latest)) !== JSON.stringify(original)) {
    throw new Error(
      'This text changed while the extension was being generated. Close this dialog and extend the latest version.',
    );
  }
  const updated = appendTextExtension(latest, extension);
  saveText(updated);
  return updated;
}
