import { normalizeToken, type AnalyzedToken } from "@arcuate/language";
import type { SavedWord } from "./saved-words.ts";

export type TextRange = { start: number; end: number };

function lemmaMatches(token: AnalyzedToken, lemma: string, partOfSpeech: string | undefined, language: string) {
  const normalizedLemma = normalizeToken(lemma, language);
  return token.lexemes.some((lexeme) => normalizeToken(lexeme.lemma, language) === normalizedLemma &&
    (!partOfSpeech || !lexeme.partOfSpeech || lexeme.partOfSpeech === partOfSpeech));
}

function normalizePhrase(value: string, language: string) {
  return normalizeToken(value, language).replace(/\s+/g, " ").trim();
}

export function findSavedWordRanges(
  paragraph: string,
  tokens: AnalyzedToken[],
  savedWords: SavedWord[],
  language: string,
) {
  const ranges: TextRange[] = [];

  for (const saved of savedWords) {
    if (saved.language !== language) continue;
    const lemmas = saved.lemmas ?? [];

    if (lemmas.length) {
      for (let index = 0; index <= tokens.length - lemmas.length; index++) {
        if (lemmas.every((lemma, lemmaIndex) => lemmaMatches(
          tokens[index + lemmaIndex]!, lemma, lemmas.length === 1 ? saved.partOfSpeech : undefined, language,
        ))) {
          ranges.push({ start: tokens[index]!.start, end: tokens[index + lemmas.length - 1]!.end });
        }
      }
      continue;
    }

    const target = normalizePhrase(saved.normalizedText ?? saved.text, language);
    for (let startIndex = 0; startIndex < tokens.length; startIndex++) {
      for (let endIndex = startIndex; endIndex < tokens.length; endIndex++) {
        const range = { start: tokens[startIndex]!.start, end: tokens[endIndex]!.end };
        const candidate = normalizePhrase(paragraph.slice(range.start, range.end), language);
        if (candidate === target) ranges.push(range);
        if (candidate.length >= target.length) break;
      }
    }
  }

  return ranges
    .sort((left, right) => left.start - right.start || left.end - right.end)
    .filter((range, index, all) => index === 0 || range.start !== all[index - 1]!.start || range.end !== all[index - 1]!.end);
}
