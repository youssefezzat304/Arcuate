import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { analyzeTextExact } from '@arcuate/language';
import { assembleBilingualText } from '../../../packages/ai/src/translation-schema.ts';
import { extendText } from '../../../packages/ai/src/index.ts';
import { extensionMasterPrompt } from '../../../packages/ai/src/prompt.ts';
import {
  savedTextSchema,
  saveText,
  readText,
  saveTextAnnotations,
} from '../src/lib/saved-texts.ts';
import {
  extensionRequestSchema,
  extensionOriginal,
  appendTextExtension,
  saveTextExtension,
  textExtensionSchema,
} from '../src/lib/text-extension.ts';

const data = new Map();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  },
});
afterEach(() => data.clear());

const record = savedTextSchema.parse({
  id: '123e4567-e89b-42d3-a456-426614174000',
  createdAt: '2026-10-04T12:00:00.000Z',
  settings: { topic: 'The sun', language: 'de', level: 'A2', length: 4000 },
  title: 'Die Sonne',
  paragraphs: ['Die Sonne scheint.'],
  source: 'manual',
  backgroundImage: 'data:image/png;base64,aA==',
});
const extension = textExtensionSchema.parse({
  paragraphs: ['Wir gehen nach draußen.'],
  analysis: analyzeTextExact(['Wir gehen nach draußen.'], 'de'),
});

function bilingualReading() {
  return savedTextSchema.parse({
    ...record,
    settings: { ...record.settings, translationLanguage: 'en' },
    translation: {
      language: 'en',
      title: 'The Sun',
      paragraphs: [
        {
          sentences: [{ start: 0, end: record.paragraphs[0].length, text: 'The sun is shining.' }],
        },
      ],
    },
  });
}
function bilingualExtension() {
  return textExtensionSchema.parse({
    ...extension,
    translation: {
      language: 'en',
      paragraphs: [
        { sentences: [{ start: 0, end: extension.paragraphs[0].length, text: 'We go outside.' }] },
      ],
    },
  });
}

test('extension requests validate prompt, inherited settings, bounded context, and all home-slider lengths', () => {
  for (let length = 2000; length <= 20000; length += 2000) {
    assert.equal(
      extensionRequestSchema.parse({
        prompt: ' Continue the story. ',
        length,
        original: extensionOriginal(record),
      }).prompt,
      'Continue the story.',
    );
  }
  for (const patch of [
    { prompt: ' ' },
    { prompt: 'x'.repeat(2001) },
    { length: 3000 },
    { length: '4000' },
    { length: 22000 },
  ]) {
    assert.equal(
      extensionRequestSchema.safeParse({
        prompt: 'Continue.',
        length: 4000,
        original: extensionOriginal(record),
        ...patch,
      }).success,
      false,
    );
  }
  for (const patch of [
    { language: 'xx' },
    { level: 'A3' },
    { translationLanguage: 'xx' },
    {
      paragraphs: [
        'x'.repeat(20000),
        'x'.repeat(20000),
        'x'.repeat(20000),
        'x'.repeat(20000),
        'x'.repeat(20000),
      ],
    },
    { paragraphs: Array(300).fill('A sentence.') },
  ]) {
    assert.equal(
      extensionRequestSchema.safeParse({
        prompt: 'Continue.',
        length: 4000,
        original: { ...extensionOriginal(record), ...patch },
      }).success,
      false,
    );
  }
});

test('appending preserves original content, identity, settings, cover, annotations, and paragraph token offsets', () => {
  const annotated = savedTextSchema.parse({
    ...record,
    annotations: [{ start: 0, end: 3, format: { bold: true } }],
  });
  const updated = appendTextExtension(annotated, extension);
  assert.deepEqual(updated.paragraphs, [...record.paragraphs, ...extension.paragraphs]);
  for (const key of [
    'id',
    'title',
    'settings',
    'createdAt',
    'source',
    'backgroundImage',
    'annotations',
  ]) {
    assert.deepEqual(updated[key], annotated[key]);
  }
  assert.deepEqual(updated.analysis.paragraphs, [
    ...record.analysis.paragraphs,
    ...extension.analysis.paragraphs,
  ]);
  assert.equal(updated.characterCount, record.characterCount + extension.paragraphs[0].length + 2);
  assert.deepEqual(record.paragraphs, ['Die Sonne scheint.']);
});

test('bilingual extensions preserve the translated title and append fully aligned sentence translations', () => {
  const original = bilingualReading();
  const extra = bilingualExtension();
  const updated = appendTextExtension(original, extra);
  assert.equal(updated.translation.title, original.translation.title);
  assert.deepEqual(updated.translation.paragraphs, [
    ...original.translation.paragraphs,
    ...extra.translation.paragraphs,
  ]);
  assert.equal(savedTextSchema.safeParse(updated).success, true);
  assert.equal(updated.translation.paragraphs[1].sentences[0].start, 0);
});

test('source-only readings remain source-only, including legacy lookup language settings', () => {
  const legacy = savedTextSchema.parse({
    ...record,
    settings: { ...record.settings, translationLanguage: 'en', length: 'short' },
  });
  assert.equal(extensionOriginal(legacy).translationLanguage, undefined);
  assert.equal(appendTextExtension(legacy, extension).translation, undefined);
  assert.equal(appendTextExtension(legacy, extension).settings.length, 'short');
});

test('wrong language, missing or incompatible translations, and broken sentence alignment are rejected', () => {
  assert.throws(
    () =>
      appendTextExtension(record, {
        ...extension,
        analysis: analyzeTextExact(extension.paragraphs, 'fr'),
      }),
    /reading language/,
  );
  assert.throws(() => appendTextExtension(bilingualReading(), extension), /same translation/);
  assert.throws(() => appendTextExtension(record, bilingualExtension()), /same translation/);
  const extra = bilingualExtension();
  assert.throws(
    () =>
      appendTextExtension(bilingualReading(), {
        ...extra,
        translation: { ...extra.translation, language: 'fr' },
      }),
    /same translation/,
  );
  assert.equal(
    textExtensionSchema.safeParse({
      ...extra,
      translation: { ...extra.translation, paragraphs: [] },
    }).success,
    false,
  );
});

test('mixed analysis retains existing lemma information while preserving appended token offsets', () => {
  const original = savedTextSchema.parse({
    ...record,
    analysis: { ...record.analysis, analyzer: 'stanza' },
  });
  const updated = appendTextExtension(original, extension);
  assert.equal(updated.analysis.analyzer, 'mixed');
  assert.deepEqual(updated.analysis.paragraphs[0], original.analysis.paragraphs[0]);
  assert.deepEqual(updated.analysis.paragraphs[1], extension.analysis.paragraphs[0]);
});

test('saving appends to the existing record and preserves annotations added while generation was pending', () => {
  saveText(record);
  const original = extensionOriginal(record);
  const annotations = [{ start: 0, end: 3, format: { underline: true } }];
  saveTextAnnotations(record.id, annotations);
  const saved = saveTextExtension(record.id, original, extension);
  assert.deepEqual(saved.annotations, annotations);
  assert.deepEqual(readText(record.id), saved);
  assert.equal(data.size, 1);
});

test('concurrent extensions and deleted readings cannot overwrite or resurrect saved text', () => {
  saveText(record);
  const original = extensionOriginal(record);
  const updated = saveTextExtension(record.id, original, extension);
  assert.throws(() => saveTextExtension(record.id, original, extension), /changed while/);
  assert.deepEqual(readText(record.id).paragraphs, updated.paragraphs);
  data.delete(`arcuate:text:v1:${record.id}`);
  assert.throws(() => saveTextExtension(record.id, original, extension), /no longer saved/);
  assert.equal(data.size, 0);
});

test('storage failures retain the original and allow retrying the cached extension without regeneration', (t) => {
  saveText(record);
  const original = extensionOriginal(record);
  const blocked = t.mock.method(localStorage, 'setItem', () => {
    throw new DOMException('Full', 'QuotaExceededError');
  });
  assert.throws(() => saveTextExtension(record.id, original, extension), /Full/);
  assert.deepEqual(readText(record.id).paragraphs, record.paragraphs);
  blocked.mock.restore();
  assert.equal(saveTextExtension(record.id, original, extension).paragraphs.length, 2);
});

test('extending beyond the saved reading paragraph limit is rejected before persistence', () => {
  const long = savedTextSchema.parse({ ...record, paragraphs: Array(300).fill('Ein Satz.') });
  assert.throws(() => appendTextExtension(long, extension), /300-paragraph/);
});

function mockGemini(t, result) {
  let sent;
  t.mock.method(globalThis, 'fetch', async (request, init) => {
    sent = JSON.parse(init?.body ?? (await request.text()));
    return Response.json({
      candidates: [
        {
          finishReason: 'STOP',
          content: { role: 'model', parts: [{ text: JSON.stringify(result) }] },
        },
      ],
    });
  });
  return () => sent;
}

test('provider uses the extension master prompt and sends full original text, user instructions, language, CEFR, and extension-only length', async (t) => {
  const sent = mockGemini(t, { title: record.title, paragraphs: extension.paragraphs });
  const result = await extendText(
    {
      originalText: { title: record.title, paragraphs: record.paragraphs },
      userPrompt: 'Explain solar energy next.',
      language: 'German',
      level: 'A2',
      characterTarget: 6000,
    },
    { apiKey: 'test-key', model: 'gemini-3.6-flash' },
  );
  const payload = sent();
  const prompt = payload.systemInstruction.parts.map(({ text }) => text).join('');
  assert.ok(prompt.startsWith(extensionMasterPrompt));
  assert.match(prompt, /Do not repeat, rewrite, summarize, or replace the original text/);
  const request = JSON.parse(payload.contents[0].parts[0].text);
  assert.deepEqual(request.originalText, { title: record.title, paragraphs: record.paragraphs });
  assert.equal(request.userPrompt, 'Explain solar energy next.');
  assert.equal(request.language, 'German');
  assert.equal(request.level, 'A2');
  assert.equal(request.characterTarget, 6000);
  assert.equal(result.translation, undefined);
});

test('provider generates aligned extension translations in the inherited translation language', async (t) => {
  const bilingual = {
    title: record.title,
    translatedTitle: 'The Sun',
    paragraphs: [
      { sentences: [{ source: extension.paragraphs[0], translation: 'We go outside.' }] },
    ],
  };
  const sent = mockGemini(t, bilingual);
  const result = await extendText(
    {
      originalText: { title: record.title, paragraphs: record.paragraphs },
      userPrompt: 'Continue the story.',
      language: 'German',
      level: 'A2',
      characterTarget: 2000,
      translationLanguage: 'en',
    },
    { apiKey: 'test-key', model: 'gemini-3.6-flash' },
  );
  assert.deepEqual(result, assembleBilingualText(bilingual, 'en'));
  assert.equal(JSON.parse(sent().contents[0].parts[0].text).translationLanguage, 'en');
});

test('provider rejects incomplete bilingual extensions', async (t) => {
  mockGemini(t, {
    title: record.title,
    translatedTitle: 'The Sun',
    paragraphs: [{ sentences: [{ source: 'Neuer Text.' }] }],
  });
  await assert.rejects(
    extendText(
      {
        originalText: { title: record.title, paragraphs: record.paragraphs },
        userPrompt: 'Continue.',
        language: 'German',
        level: 'A2',
        characterTarget: 2000,
        translationLanguage: 'en',
      },
      { apiKey: 'test-key', model: 'gemini-3.6-flash' },
    ),
  );
});
