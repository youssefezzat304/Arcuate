import assert from "node:assert/strict";
import test from "node:test";
import { analysisFitsText, analyzeText, analyzeTextExact, normalizeToken } from "../../../packages/language/src/index.ts";
import { findSavedWordRanges } from "../src/lib/saved-word-matching.ts";

const savedBase = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  createdAt: "2026-09-07T12:00:00.000Z",
  language: "de",
  sourceTextId: "223e4567-e89b-42d3-a456-426614174000",
  sourceTitle: "Hunde",
};

test("exact analysis creates locale-aware word offsets and sentence context", () => {
  const paragraph = "Ein Hund. Zwei Hunde!";
  const analysis = analyzeTextExact([paragraph], "de");

  assert.equal(analysis.analyzer, "intl-segmenter");
  assert.equal(analysis.paragraphs[0].map((token) => paragraph.slice(token.start, token.end)).join("|"), "Ein|Hund|Zwei|Hunde");
  assert.deepEqual(analysis.paragraphs[0].map((token) => token.sentenceIndex), [0, 0, 1, 1]);
  assert.equal(analysisFitsText(analysis, [paragraph], "de"), true);
  assert.equal(normalizeToken("HU\u0308NDE", "de"), "hünde");
});

test("exact matching respects complete token boundaries", () => {
  const paragraph = "Hund hund Hunde Hundert.";
  const tokens = analyzeTextExact([paragraph], "de").paragraphs[0];
  const saved = [{ ...savedBase, text: "Hund", normalizedText: "hund" }];

  assert.deepEqual(findSavedWordRanges(paragraph, tokens, saved, "de").map(({ start, end }) => paragraph.slice(start, end)), ["Hund", "hund"]);
});

test("lemma matching highlights inflected forms and remains language-specific", () => {
  const paragraph = "Hunde und Hundes";
  const tokens = [
    { start: 0, end: 5, sentenceIndex: 0, lexemes: [{ lemma: "Hund", partOfSpeech: "NOUN" }] },
    { start: 6, end: 9, sentenceIndex: 0, lexemes: [{ lemma: "und", partOfSpeech: "CCONJ" }] },
    { start: 10, end: 16, sentenceIndex: 0, lexemes: [{ lemma: "Hund", partOfSpeech: "NOUN" }] },
  ];
  const saved = [{ ...savedBase, text: "Hund", normalizedText: "hund", lemmas: ["Hund"], partOfSpeech: "NOUN" }];

  assert.deepEqual(findSavedWordRanges(paragraph, tokens, saved, "de").map(({ start, end }) => paragraph.slice(start, end)), ["Hunde", "Hundes"]);
  assert.deepEqual(findSavedWordRanges(paragraph, tokens, saved, "fr"), []);
});

test("analyzer failure falls back to exact analysis", async () => {
  const analysis = await analyzeText(["Ein Hund"], "de", {
    stanzaEndpoint: "http://language.invalid",
    fetcher: async () => { throw new Error("offline"); },
  });

  assert.equal(analysis.analyzer, "intl-segmenter");
});

test("configured Stanza analysis is validated and returned", async () => {
  const stanza = {
    language: "de", analyzer: "stanza", version: 1,
    paragraphs: [[{ start: 0, end: 5, sentenceIndex: 0, lexemes: [{ lemma: "Hund", partOfSpeech: "NOUN" }] }]],
  };
  const analysis = await analyzeText(["Hunde"], "de", {
    stanzaEndpoint: "http://language.internal:8090",
    fetcher: async () => Response.json(stanza),
  });

  assert.deepEqual(analysis, stanza);
});
