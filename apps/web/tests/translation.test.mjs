import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  bilingualTextSchema,
  assembleBilingualText,
  translationFitsText,
  wordExplanationSchema,
} from '../../../packages/ai/src/translation-schema.ts';
import { generateText, explainWord } from '../../../packages/ai/src/index.ts';
import { savedTextSchema } from '../src/lib/saved-texts.ts';
import { wordExplanationRequestSchema } from '../src/lib/word-explanation.ts';
import { sliceTextRuns, readingWords } from '../src/lib/reader-translation.ts';

const bilingual = {
  title: 'Die Sonne',
  translatedTitle: 'The Sun',
  paragraphs: [
    {
      sentences: [
        { source: 'Die Sonne scheint.', translation: 'The sun shines.' },
        { source: 'Sie wärmt uns 😊.', translation: 'It warms us 😊.' },
      ],
    },
  ],
};
const explanation = {
  translation: 'gets up',
  meaning: 'To rise or stand up.',
  contextMeaning: 'He gets out of bed early.',
  grammar: 'steht … auf is the separable verb aufstehen, third person singular present.',
  examples: [
    { source: 'Ich stehe früh auf.', translation: 'I get up early.' },
    { source: 'Sie steht um acht auf.', translation: 'She gets up at eight.' },
    { source: 'Wir stehen spät auf.', translation: 'We get up late.' },
  ],
};
const input = {
  surface: 'steht',
  paragraph: 'Er steht früh auf.',
  start: 3,
  end: 8,
  sourceLanguage: 'de',
  targetLanguage: 'en',
  level: 'A2',
};
function mockResponse(value) {
  return new Response(
    JSON.stringify({
      candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(value) }] } }],
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
}

test('bilingual assembly computes exact Unicode sentence offsets without changing source', () => {
  const result = assembleBilingualText(bilingualTextSchema.parse(bilingual), 'en');
  assert.equal(result.paragraphs[0], 'Die Sonne scheint. Sie wärmt uns 😊.');
  assert.equal(translationFitsText(result.translation, result.paragraphs), true);
  result.translation.paragraphs[0].sentences.forEach((sentence, index) =>
    assert.equal(
      result.paragraphs[0].slice(sentence.start, sentence.end),
      bilingual.paragraphs[0].sentences[index].source,
    ),
  );
  assert.equal(translationFitsText(result.translation, ['Changed text']), false);
  assert.equal(
    translationFitsText({ ...result.translation, paragraphs: [] }, result.paragraphs),
    false,
  );
});

test('saved bilingual records validate alignment and language while source-only records remain valid', () => {
  const result = assembleBilingualText(bilingualTextSchema.parse(bilingual), 'en');
  const record = {
    ...result,
    id: '123e4567-e89b-42d3-a456-426614174000',
    createdAt: '2026-09-08T12:00:00.000Z',
    settings: {
      topic: 'Sun',
      language: 'de',
      level: 'A2',
      length: 2000,
      translationLanguage: 'en',
    },
  };
  assert.equal(savedTextSchema.safeParse(record).success, true);
  assert.equal(
    savedTextSchema.safeParse({
      ...record,
      settings: { ...record.settings, translationLanguage: 'fr' },
    }).success,
    false,
  );
  const broken = structuredClone(record);
  broken.translation.paragraphs[0].sentences[1].start++;
  assert.equal(savedTextSchema.safeParse(broken).success, false);
  const legacy = structuredClone(record);
  delete legacy.translation;
  assert.equal(savedTextSchema.safeParse(legacy).success, true);
});

test('generation requests source and translation together and rejects partial pairs', async (t) => {
  let sent;
  const mock = t.mock.method(globalThis, 'fetch', async (request, init) => {
    sent = JSON.parse(init?.body ?? (await request.text()));
    return mockResponse(bilingual);
  });
  const result = await generateText(
    {
      topic: 'Sun',
      language: 'German',
      level: 'A2',
      characterTarget: 2000,
      translationLanguage: 'en',
    },
    { apiKey: 'test-key', model: 'test-model' },
  );
  assert.equal(result.translation.title, 'The Sun');
  assert.equal(JSON.parse(sent.contents[0].parts[0].text).translationLanguage, 'en');
  assert.equal(
    JSON.stringify(sent.generationConfig.responseJsonSchema).includes('maxItems'),
    false,
  );
  assert.equal(translationFitsText(result.translation, result.paragraphs), true);
  mock.mock.restore();
  t.mock.method(globalThis, 'fetch', async () =>
    mockResponse({ ...bilingual, paragraphs: [{ sentences: [{ source: 'Hallo.' }] }] }),
  );
  await assert.rejects(
    generateText(
      {
        topic: 'Sun',
        language: 'German',
        level: 'A2',
        characterTarget: 2000,
        translationLanguage: 'en',
      },
      { apiKey: 'test-key', model: 'test-model' },
    ),
  );
});

test('word requests bind explanations to the selected occurrence and validate languages', () => {
  assert.equal(wordExplanationRequestSchema.safeParse(input).success, true);
  for (const patch of [
    { end: 7 },
    { start: -1 },
    { surface: 'anderes' },
    { targetLanguage: 'invalid' },
    { paragraph: 'a'.repeat(20001) },
  ]) {
    assert.equal(wordExplanationRequestSchema.safeParse({ ...input, ...patch }).success, false);
  }
  assert.equal(
    wordExplanationSchema.safeParse({ ...explanation, examples: explanation.examples.slice(0, 2) })
      .success,
    false,
  );
});

test('Flash-Lite lookup sends contextual data and returns exactly three examples', async (t) => {
  let sent;
  t.mock.method(globalThis, 'fetch', async (request, init) => {
    sent = JSON.parse(init?.body ?? (await request.text()));
    return mockResponse(explanation);
  });
  assert.deepEqual(
    await explainWord(input, { apiKey: 'test-key', model: 'gemini-3.5-flash-lite' }),
    explanation,
  );
  assert.deepEqual(JSON.parse(sent.contents[0].parts[0].text), input);
  assert.equal(sent.generationConfig.maxOutputTokens, 3072);
});

test('splitting annotated source into translation units preserves all characters and formatting', () => {
  const runs = [
    { text: 'Die Sonne', format: { bold: true } },
    { text: ' scheint. Sie wärmt uns 😊.', format: {} },
  ];
  const first = sliceTextRuns(runs, 0, 19);
  const second = sliceTextRuns(runs, 19, 100);
  assert.equal(
    [...first, ...second].map((run) => run.text).join(''),
    runs.map((run) => run.text).join(''),
  );
  assert.deepEqual(first[0].format, { bold: true });
  assert.deepEqual(readingWords('Er steht auf.', 'de'), [
    { start: 0, end: 2 },
    { start: 3, end: 8 },
    { start: 9, end: 12 },
  ]);
});
