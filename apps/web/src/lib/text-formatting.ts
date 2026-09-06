export type TextFormat = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  highlight?: string;
};

export type TextRun = { text: string; format: TextFormat };
export type TextSelection = { start: number; end: number };

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
