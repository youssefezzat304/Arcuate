import { z } from "zod";

import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguageCode,
} from "./supported-languages.ts";

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const TEXT_LENGTH = { min: 2000, max: 20_000, step: 2000, default: 4000 } as const;

const supportedLanguageCodes = new Set(
  SUPPORTED_LANGUAGES.map(({ code }) => code),
);

const supportedLanguageCodeSchema = z.custom<SupportedLanguageCode>(
  (value) =>
    typeof value === "string" && supportedLanguageCodes.has(value as SupportedLanguageCode),
  "Unsupported language",
);

export const createTextRequestSchema = z.object({
  topic: z.string().trim().min(1).max(500),
  language: supportedLanguageCodeSchema,
  level: z.enum(CEFR_LEVELS),
  length: z.number().int().min(TEXT_LENGTH.min).max(TEXT_LENGTH.max).multipleOf(TEXT_LENGTH.step),
});

export type CreateTextRequest = z.infer<typeof createTextRequestSchema>;
