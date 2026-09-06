import { z } from "zod";
import { generatedTextSchema } from "@arcuate/ai/schema";
import { createTextRequestSchema } from "./reading-settings.ts";

export function countCharacters(paragraphs: string[]) {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return Array.from(segmenter.segment(paragraphs.join("\n\n"))).length;
}

export const savedTextSchema = generatedTextSchema.extend({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  settings: createTextRequestSchema,
}).transform((text) => ({
  ...text,
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
  return raw === null ? null : savedTextSchema.parse(JSON.parse(raw));
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
