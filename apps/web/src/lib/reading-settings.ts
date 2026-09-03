import { z } from "zod";

import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguageCode,
} from "@/lib/supported-languages";

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const TEXT_LENGTHS = ["short", "medium", "long"] as const;

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
  translationLanguage: z.union([
    z.literal(""),
    supportedLanguageCodeSchema,
  ]),
  length: z.enum(TEXT_LENGTHS),
});

export type CreateTextRequest = z.infer<typeof createTextRequestSchema>;
