import type { TextRun } from './text-formatting.ts';

export function sliceTextRuns(runs: TextRun[], start: number, end: number) {
  let offset = 0;
  return runs.flatMap((run) => {
    const runStart = offset;
    offset += run.text.length;
    const text = run.text.slice(
      Math.max(0, start - runStart),
      Math.max(0, Math.min(run.text.length, end - runStart)),
    );
    return text ? [{ ...run, text }] : [];
  });
}

export function readingWords(text: string, language: string) {
  return Array.from(new Intl.Segmenter(language, { granularity: 'word' }).segment(text))
    .filter((segment) => segment.isWordLike)
    .map(({ segment, index }) => ({ start: index, end: index + segment.length }));
}
