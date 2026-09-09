import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createTextRequestSchema } from '../src/lib/reading-settings.ts';
import {
  saveText,
  readText,
  listTexts,
  countCharacters,
  saveTextAnnotations,
} from '../src/lib/saved-texts.ts';
import { generateText } from '../../../packages/ai/src/index.ts';

const data = new Map();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    get length() {
      return data.size;
    },
    key(index) {
      return [...data.keys()][index] ?? null;
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
  },
});
afterEach(() => data.clear());
const settings = { topic: 'Solar energy', language: 'de', level: 'A2', length: 2000 };
const record = {
  id: '123e4567-e89b-42d3-a456-426614174000',
  createdAt: '2026-09-06T12:00:00.000Z',
  settings,
  title: 'Die Sonne',
  paragraphs: ['Die Sonne scheint.'],
  characterCount: 18,
};

test('validates inputs and all slider intervals without translation', () => {
  for (let length = 2000; length <= 20000; length += 2000) {
    assert.equal(createTextRequestSchema.parse({ ...settings, length }).length, length);
  }
  for (const length of [0, 1999, 3000, 20001, 22000, 4000.5, '4000', 'short', null]) {
    assert.equal(createTextRequestSchema.safeParse({ ...settings, length }).success, false);
  }
  assert.equal(createTextRequestSchema.safeParse(settings).success, true);
  for (const patch of [
    { topic: ' ' },
    { topic: 'a'.repeat(501) },
    { language: 'invalid' },
    { level: 'A3' },
    { length: 'tiny' },
  ]) {
    assert.equal(createTextRequestSchema.safeParse({ ...settings, ...patch }).success, false);
  }
});

test('saved records survive reads, remain isolated, and sort newest first', () => {
  saveText(record);
  const second = {
    ...record,
    id: '223e4567-e89b-42d3-a456-426614174000',
    createdAt: '2026-09-07T12:00:00.000Z',
  };
  saveText(second);
  const saved = readText(record.id);
  assert.deepEqual(saved, { ...record, analysis: saved.analysis, annotations: [] });
  assert.deepEqual(
    listTexts().texts.map(({ id, createdAt }) => ({ id, createdAt })),
    [
      { id: second.id, createdAt: second.createdAt },
      { id: record.id, createdAt: record.createdAt },
    ],
  );
  assert.equal(readText('323e4567-e89b-42d3-a456-426614174000'), null);
});

test('corrupt records are retained and reported alongside healthy records', () => {
  saveText(record);
  data.set('arcuate:text:v1:broken', 'not JSON');
  data.set('unrelated-key', 'ignore me');
  assert.equal(listTexts().invalidCount, 1);
  assert.equal(listTexts().texts.length, 1);
  assert.equal(data.has('arcuate:text:v1:broken'), true);
});

test('storage failures propagate instead of pretending the text was saved', (t) => {
  t.mock.method(localStorage, 'setItem', () => {
    throw new Error('Quota exceeded');
  });
  assert.throws(() => saveText(record), /Quota exceeded/);
});

test('provider sends level and character target and validates structured output', async (t) => {
  let sent;
  t.mock.method(globalThis, 'fetch', async (request, init) => {
    sent = JSON.parse(init?.body ?? (await request.text()));
    return new Response(
      JSON.stringify({
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              role: 'model',
              parts: [
                { text: JSON.stringify({ title: record.title, paragraphs: record.paragraphs }) },
              ],
            },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  });
  const result = await generateText(
    { topic: settings.topic, language: 'German', level: 'A2', characterTarget: 2000 },
    { apiKey: 'test-key', model: 'gemini-3.6-flash' },
  );
  assert.deepEqual(result, { title: record.title, paragraphs: record.paragraphs });
  assert.equal(JSON.parse(sent.contents[0].parts[0].text).characterTarget, 2000);
  assert.equal(JSON.parse(sent.contents[0].parts[0].text).level, 'A2');
  assert.equal(sent.generationConfig.responseMimeType, 'application/json');
});

test('provider quota errors are safe and actionable', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(
        JSON.stringify({
          error: { code: 429, message: 'private provider details', status: 'RESOURCE_EXHAUSTED' },
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      ),
  );
  await assert.rejects(
    generateText(
      { topic: 'Sun', language: 'German', level: 'A2', characterTarget: 2000 },
      { apiKey: 'test-key', model: 'gemini-3.6-flash' },
    ),
    (error) => error.status === 429 && !error.message.includes('private provider details'),
  );
});

test('provider request errors are not reported as timeouts', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(
        JSON.stringify({
          error: { code: 400, message: 'private provider details', status: 'INVALID_ARGUMENT' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
  );
  await assert.rejects(
    generateText(
      { topic: 'Sun', language: 'German', level: 'A2', characterTarget: 2000 },
      { apiKey: 'test-key', model: 'gemini-3.6-flash' },
    ),
    (error) =>
      error.status === 503 &&
      error.message.includes('rejected the generation request') &&
      !error.message.includes('private provider details') &&
      !error.message.includes('timed out'),
  );
});

test('provider rejects malformed and incomplete responses', async (t) => {
  for (const [status, text] of [
    ['completed', 'not json'],
    ['completed', '{"title":"Empty","paragraphs":[]}'],
    ['incomplete', '{"title":"Cut off","paragraphs":["unfinished"]}'],
  ]) {
    const mock = t.mock.method(
      globalThis,
      'fetch',
      async () =>
        new Response(
          JSON.stringify({
            candidates: [
              {
                finishReason: status === 'completed' ? 'STOP' : 'MAX_TOKENS',
                content: { role: 'model', parts: [{ text }] },
              },
            ],
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
    );
    await assert.rejects(
      generateText(
        { topic: 'Sun', language: 'German', level: 'A2', characterTarget: 2000 },
        { apiKey: 'test-key', model: 'gemini-3.6-flash' },
      ),
    );
    mock.mock.restore();
  }
});

test('character counts include spaces and paragraph breaks without splitting Unicode characters', () => {
  assert.equal(countCharacters(['A B', 'C']), 6);
  assert.equal(countCharacters(['e\u0301😊']), 2);
});

test('existing word-count records remain readable with a derived character count', () => {
  const { characterCount, ...legacy } = record;
  data.set(`arcuate:text:v1:${record.id}`, JSON.stringify({ ...legacy, wordCount: 3 }));
  const upgraded = readText(record.id);
  const { analysis, ...upgradedText } = upgraded;
  assert.deepEqual(upgradedText, { ...record, annotations: [] });
  assert.equal(upgraded.characterCount, characterCount);
  assert.equal(analysis.analyzer, 'intl-segmenter');
  assert.equal(
    JSON.parse(data.get(`arcuate:text:v1:${record.id}`)).analysis.analyzer,
    'intl-segmenter',
  );
  assert.equal(listTexts().invalidCount, 0);
});

test('text annotations persist independently on each saved reading', () => {
  saveText(record);
  const annotations = [
    {
      start: 0,
      end: 3,
      format: { bold: true, highlight: 'var(--highlight-blue)' },
    },
  ];

  const updated = saveTextAnnotations(record.id, annotations);

  assert.deepEqual(updated.annotations, annotations);
  assert.deepEqual(readText(record.id).annotations, annotations);
  saveTextAnnotations(record.id, []);
  assert.deepEqual(readText(record.id).annotations, []);
  assert.throws(
    () => saveTextAnnotations('323e4567-e89b-42d3-a456-426614174000', annotations),
    /no longer saved/,
  );
});

test('legacy length presets remain readable in saved texts', () => {
  for (const length of ['short', 'medium', 'long']) {
    data.set(
      `arcuate:text:v1:${record.id}`,
      JSON.stringify({ ...record, settings: { ...settings, length } }),
    );
    assert.equal(readText(record.id).settings.length, length);
    assert.equal(listTexts().invalidCount, 0);
  }
});
