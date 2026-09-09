import {
  textAnalysisSchema,
  type AnalyzedToken,
  type LanguageAnalyzer,
  type TextAnalysis,
} from './schema.ts';

export * from './schema.ts';

export const TEXT_ANALYSIS_VERSION = 1;

export function normalizeToken(value: string, language?: string) {
  return value.normalize('NFC').toLocaleLowerCase(language);
}

function sentenceStarts(text: string, language: string) {
  try {
    return Array.from(
      new Intl.Segmenter(language, { granularity: 'sentence' }).segment(text),
      ({ index }) => index,
    );
  } catch {
    return [0];
  }
}

function sentenceIndexAt(starts: number[], offset: number) {
  let sentenceIndex = 0;
  while (sentenceIndex + 1 < starts.length && starts[sentenceIndex + 1]! <= offset) sentenceIndex++;
  return sentenceIndex;
}

export function analyzeTextExact(paragraphs: string[], language: string): TextAnalysis {
  const analyzed = paragraphs.map((paragraph) => {
    const starts = sentenceStarts(paragraph, language);
    try {
      return Array.from(new Intl.Segmenter(language, { granularity: 'word' }).segment(paragraph))
        .filter(({ isWordLike }) => isWordLike)
        .map<AnalyzedToken>(({ segment, index }) => ({
          start: index,
          end: index + segment.length,
          sentenceIndex: sentenceIndexAt(starts, index),
          lexemes: [{ lemma: normalizeToken(segment, language) }],
        }));
    } catch {
      const tokens: AnalyzedToken[] = [];
      const matcher = /[\p{L}\p{N}\p{M}]+/gu;
      for (const match of paragraph.matchAll(matcher)) {
        const start = match.index;
        tokens.push({
          start,
          end: start + match[0].length,
          sentenceIndex: 0,
          lexemes: [{ lemma: normalizeToken(match[0], language) }],
        });
      }
      return tokens;
    }
  });

  return textAnalysisSchema.parse({
    language,
    analyzer: 'intl-segmenter',
    version: TEXT_ANALYSIS_VERSION,
    paragraphs: analyzed,
  });
}

export function analysisFitsText(analysis: TextAnalysis, paragraphs: string[], language: string) {
  if (analysis.language !== language || analysis.paragraphs.length !== paragraphs.length)
    return false;
  return analysis.paragraphs.every((tokens, paragraphIndex) => {
    const paragraph = paragraphs[paragraphIndex]!;
    let previousEnd = 0;
    return tokens.every((token) => {
      const valid =
        token.start >= previousEnd && token.end <= paragraph.length && token.end > token.start;
      previousEnd = token.end;
      return valid;
    });
  });
}

export function createStanzaAnalyzer(
  endpoint: string,
  fetcher: typeof fetch = fetch,
): LanguageAnalyzer {
  return {
    async analyze(paragraphs, language) {
      const response = await fetcher(new URL('/analyze', endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paragraphs, language }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`Language analysis failed with status ${response.status}.`);
      return textAnalysisSchema.parse(await response.json());
    },
  };
}

export async function analyzeText(
  paragraphs: string[],
  language: string,
  options: { stanzaEndpoint?: string; fetcher?: typeof fetch } = {},
) {
  if (options.stanzaEndpoint) {
    try {
      return await createStanzaAnalyzer(options.stanzaEndpoint, options.fetcher).analyze(
        paragraphs,
        language,
      );
    } catch {
      // Linguistic enrichment must never make a generated text unreadable.
    }
  }
  return analyzeTextExact(paragraphs, language);
}
