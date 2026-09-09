import { z } from 'zod';

export type Lexeme = {
  lemma: string;
  partOfSpeech?: string;
  morphology?: Record<string, string>;
};

export type AnalyzedToken = {
  start: number;
  end: number;
  sentenceIndex: number;
  lexemes: Lexeme[];
};

export type TextAnalysis = {
  language: string;
  analyzer: string;
  version: number;
  paragraphs: AnalyzedToken[][];
};

export const lexemeSchema: z.ZodType<Lexeme> = z.object({
  lemma: z.string().min(1),
  partOfSpeech: z.string().min(1).optional(),
  morphology: z.record(z.string(), z.string()).optional(),
});

export const analyzedTokenSchema: z.ZodType<AnalyzedToken> = z
  .object({
    start: z.number().int().nonnegative(),
    end: z.number().int().positive(),
    sentenceIndex: z.number().int().nonnegative(),
    lexemes: z.array(lexemeSchema).min(1),
  })
  .refine(({ start, end }) => end > start, 'Token end must follow its start.');

export const textAnalysisSchema: z.ZodType<TextAnalysis> = z.object({
  language: z.string().min(1),
  analyzer: z.string().min(1),
  version: z.number().int().positive(),
  paragraphs: z.array(z.array(analyzedTokenSchema)),
});

export interface LanguageAnalyzer {
  analyze(paragraphs: string[], language: string): Promise<TextAnalysis>;
}

export type TokenTranslation = {
  translation: string;
  alternatives?: string[];
  context?: string;
};

export interface TranslationProvider {
  translateToken(input: {
    surface: string;
    lemma?: string;
    sourceLanguage: string;
    targetLanguage: string;
    sentence: string;
  }): Promise<TokenTranslation>;
}

export interface PronunciationProvider {
  speak(input: { text: string; language: string }): Promise<void>;
}
