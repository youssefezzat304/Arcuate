import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createWordList, listWordLists, saveWordToList, renameWordList, removeSavedWord, deleteWordList, wordListMarkdown } from "../src/lib/saved-words.ts";

const data = new Map();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  get length() { return data.size; },
  key(index) { return [...data.keys()][index] ?? null; },
  getItem(key) { return data.get(key) ?? null; },
  setItem(key, value) { data.set(key, value); },
  removeItem(key) { data.delete(key); },
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


test("renames lists while preserving words and rejects conflicting names", () => {
  const list = createWordList("German", word);
  createWordList("Favorites", word);
  renameWordList(list.id, " German ");
  renameWordList(list.id, " Reading ");
  const renamed = listWordLists().lists.find((item) => item.id === list.id);
  assert.deepEqual(renamed, { ...list, name: "Reading" });
  for (const name of [" ", "a".repeat(61), "FAVORITES"]) {
    assert.throws(() => renameWordList(list.id, name));
  }
});

test("removal reads the latest list and deletion leaves other lists intact", () => {
  const list = createWordList("German", word);
  const other = createWordList("Other", word);
  saveWordToList(list.id, { ...word, text: "Licht" });
  removeSavedWord(list.id, list.words[0].id);
  const updated = listWordLists().lists.find((item) => item.id === list.id);
  assert.deepEqual(updated.words.map((item) => item.text), ["Licht"]);
  removeSavedWord(list.id, updated.words[0].id);
  assert.equal(listWordLists().lists.find((item) => item.id === list.id).words.length, 0);
  deleteWordList(list.id);
  assert.deepEqual(listWordLists().lists, [other]);
});

test("management storage failures propagate without losing data", (t) => {
  const list = createWordList("German", word);
  t.mock.method(localStorage, "setItem", () => { throw new Error("Storage blocked"); });
  t.mock.method(localStorage, "removeItem", () => { throw new Error("Storage blocked"); });
  assert.throws(() => renameWordList(list.id, "New"), /Storage blocked/);
  assert.throws(() => removeSavedWord(list.id, list.words[0].id), /Storage blocked/);
  assert.throws(() => deleteWordList(list.id), /Storage blocked/);
  assert.deepEqual(listWordLists().lists, [list]);
});

test("Markdown export includes the list name and Unicode words with escaped formatting", () => {
  const list = createWordList("German", word);
  assert.equal(wordListMarkdown(list), "# German\n\n- Sonne (de)\n");
  const special = { ...list, name: "A*B", words: [{ ...list.words[0], text: "schön_[x]" }] };
  assert.equal(wordListMarkdown(special), "# A\\*B\n\n- schön\\_\\[x\\] (de)\n");
});
