import { z } from "zod";
import { generatedTextSchema } from "@arcuate/ai/schema";
import { analysisFitsText, analyzeTextExact } from "@arcuate/language";
import { textAnalysisSchema } from "@arcuate/language/schema";
import { createTextRequestSchema } from "./reading-settings.ts";
import { textAnnotationSchema, type TextAnnotation } from "./text-formatting.ts";

export function countCharacters(paragraphs: string[]) {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return Array.from(segmenter.segment(paragraphs.join("\n\n"))).length;
}

export const savedTextSchema = generatedTextSchema.extend({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  settings: createTextRequestSchema,
  analysis: textAnalysisSchema.optional(),
  annotations: z.array(textAnnotationSchema).max(20_000).optional().default([]),
}).transform((text) => ({
  ...text,
  analysis: text.analysis && analysisFitsText(text.analysis, text.paragraphs, text.settings.language)
    ? text.analysis
    : analyzeTextExact(text.paragraphs, text.settings.language),
  annotations: text.annotations.filter(({ end }) => end <= text.title.length + text.paragraphs.reduce((length, paragraph) => length + paragraph.length, 0)),
  // Derive the count from the body so older word-count records remain readable.
  characterCount: countCharacters(text.paragraphs),
}));
export type SavedText = z.infer<typeof savedTextSchema>;
const prefix = "arcuate:text:v1:";

export function saveText(text: SavedText) {
  const validated = savedTextSchema.parse(text);
  // One key per record avoids overwriting another tab's newly saved texts.
  localStorage.setItem(prefix + validated.id, JSON.stringify(validated));
}

export function readText(id: string): SavedText | null {
  const raw = localStorage.getItem(prefix + id);
  if (raw === null) return null;
  const stored: unknown = JSON.parse(raw);
  const text = savedTextSchema.parse(stored);
  if (typeof stored === "object" && stored !== null && (!("analysis" in stored) || !("annotations" in stored))) {
    try { localStorage.setItem(prefix + id, JSON.stringify(text)); }
    catch { /* A failed lazy upgrade must not make an existing text unreadable. */ }
  }
  return text;
}

export function saveTextAnnotations(id: string, annotations: TextAnnotation[]) {
  const text = readText(id);
  if (!text) throw new Error("This text is no longer saved in this browser.");
  const updated = savedTextSchema.parse({ ...text, annotations });
  saveText(updated);
  return updated;
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
