import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createWordList, listWordLists, saveWordToList } from "../src/lib/saved-words.ts";

const data = new Map();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  get length() { return data.size; },
  key(index) { return [...data.keys()][index] ?? null; },
  getItem(key) { return data.get(key) ?? null; },
  setItem(key, value) { data.set(key, value); },
} });
afterEach(() => data.clear());
const word = { text: "Sonne", language: "de", sourceTextId: "123e4567-e89b-42d3-a456-426614174000", sourceTitle: "Solarenergie" };

test("creates a list and bookmarks the first word in one persistent record", () => {
  const list = createWordList("  German  ", word);
  assert.equal(list.name, "German");
  assert.equal(data.size, 1);
  assert.deepEqual(listWordLists().lists, [list]);
  assert.equal(list.words[0].sourceTextId, word.sourceTextId);
  assert.equal(list.words[0].normalizedText, "sonne");
  assert.deepEqual(list.words[0].lemmas, []);
});

test("adds to existing lists without losing words, avoids duplicates per language", () => {
  const list = createWordList("German", word);
  saveWordToList(list.id, { ...word, text: "Licht" });
  assert.equal(saveWordToList(list.id, { ...word, text: "sonne" }).duplicate, true);
  saveWordToList(list.id, { ...word, language: "fr" });
  assert.equal(listWordLists().lists[0].words.length, 3);
  const another = createWordList("Favorites", word);
  assert.equal(another.words.length, 1);
});

test("rejects blank or duplicate list names and invalid selections", () => {
  assert.throws(() => createWordList(" ", word));
  createWordList("German", word);
  assert.throws(() => createWordList("german", word), /already exists/);
  assert.throws(() => createWordList("Long", { ...word, text: "a".repeat(201) }));
  assert.equal(data.size, 1);
});

test("reports corrupt lists without removing them or hiding valid ones", () => {
  createWordList("German", word);
  data.set("arcuate:word-list:v1:bad", "broken");
  assert.equal(listWordLists().invalidCount, 1);
  assert.equal(listWordLists().lists.length, 1);
  assert.equal(data.size, 2);
});

test("failed writes propagate and leave existing words unchanged", (t) => {
  const list = createWordList("German", word);
  t.mock.method(localStorage, "setItem", () => { throw new Error("Storage full"); });
  assert.throws(() => saveWordToList(list.id, { ...word, text: "Licht" }), /Storage full/);
  assert.equal(listWordLists().lists[0].words.length, 1);
  assert.throws(() => createWordList("Other", word), /Storage full/);
});
