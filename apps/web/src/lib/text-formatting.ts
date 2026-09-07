import { z } from "zod";

export const TEXT_COLOR_VALUES = [
  "var(--color-yellow)",
  "var(--color-rose)",
  "var(--color-green)",
  "var(--color-blue)",
  "var(--color-purple)",
] as const;

export const HIGHLIGHT_COLOR_VALUES = [
  "var(--highlight-yellow)",
  "var(--highlight-rose)",
  "var(--highlight-green)",
  "var(--highlight-blue)",
  "var(--highlight-purple)",
] as const;

export const textFormatSchema = z.object({
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  strikethrough: z.boolean().optional(),
  color: z.enum(TEXT_COLOR_VALUES).optional(),
  highlight: z.enum(HIGHLIGHT_COLOR_VALUES).optional(),
}).strict();

export type TextFormat = z.infer<typeof textFormatSchema>;

export const textAnnotationSchema = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
  format: textFormatSchema,
}).refine(({ start, end }) => end > start, { message: "Annotation end must follow its start." })
  .refine(({ format }) => Object.values(format).some(Boolean), { message: "Annotation formatting cannot be empty." });

export type TextAnnotation = z.infer<typeof textAnnotationSchema>;

export type TextRun = { text: string; format: TextFormat };
export type TextSelection = { start: number; end: number };

export function annotationsToBlocks(texts: string[], annotations: TextAnnotation[]): TextRun[][] {
  return annotations.reduce(
    (blocks, annotation) => formatSelection(blocks, annotation, annotation.format),
    texts.map((text) => [{ text, format: {} }]),
  );
}

export function blocksToAnnotations(blocks: TextRun[][]): TextAnnotation[] {
  const annotations: TextAnnotation[] = [];
  let offset = 0;
  for (const run of blocks.flat()) {
    const format: TextFormat = {};
    if (run.format.bold) format.bold = true;
    if (run.format.italic) format.italic = true;
    if (run.format.underline) format.underline = true;
    if (run.format.strikethrough) format.strikethrough = true;
    if (run.format.color) format.color = run.format.color;
    if (run.format.highlight) format.highlight = run.format.highlight;
    if (Object.keys(format).length > 0) annotations.push({ start: offset, end: offset + run.text.length, format });
    offset += run.text.length;
  }
  return annotations;
}

export function blocksHaveAnnotations(blocks: TextRun[][]) {
  return blocks.some((runs) => runs.some(({ format }) => Object.values(format).some(Boolean)));
}

export function formatSelection(
  blocks: TextRun[][],
  selection: TextSelection,
  patch: TextFormat,
): TextRun[][] {
  let offset = 0;
  return blocks.map((runs) => {
    const result: TextRun[] = [];
    for (const run of runs) {
      const start = Math.max(0, selection.start - offset);
      const end = Math.min(run.text.length, selection.end - offset);
      if (start < end) {
        if (start > 0) result.push({ text: run.text.slice(0, start), format: run.format });
        result.push({ text: run.text.slice(start, end), format: { ...run.format, ...patch } });
        if (end < run.text.length) result.push({ text: run.text.slice(end), format: run.format });
      } else {
        result.push(run);
      }
      offset += run.text.length;
    }
    return result.reduce<TextRun[]>((merged, run) => {
      const previous = merged.at(-1);
      if (previous && (Object.keys({ ...previous.format, ...run.format }) as (keyof TextFormat)[])
        .every((key) => previous.format[key] === run.format[key])) {
        merged[merged.length - 1] = { ...previous, text: previous.text + run.text };
      } else merged.push(run);
      return merged;
    }, []);
  });
}

export function selectionHasFormat(blocks: TextRun[][], selection: TextSelection, key: keyof TextFormat) {
  let offset = 0;
  return blocks.flat().every((run) => {
    const start = offset;
    offset += run.text.length;
    return offset <= selection.start || start >= selection.end || Boolean(run.format[key]);
  });
}

export function shortcutFormatPatch(
  key: string,
  blocks: TextRun[][],
  selection: TextSelection,
  lastHighlight: NonNullable<TextFormat["highlight"]>,
): TextFormat | null {
  switch (key.toLocaleLowerCase()) {
    case "b": return { bold: !selectionHasFormat(blocks, selection, "bold") };
    case "h": return { highlight: lastHighlight };
    case "u": return { underline: !selectionHasFormat(blocks, selection, "underline") };
    case "y": return { strikethrough: !selectionHasFormat(blocks, selection, "strikethrough") };
    default: return null;
  }
}
