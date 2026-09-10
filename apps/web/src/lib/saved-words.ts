import { escapeMarkdown } from './markdown.ts';
import { z } from 'zod';
import { normalizeToken } from '@arcuate/language';
import { createTextRequestSchema } from './reading-settings.ts';

export const SAVED_WORDS_CHANGED_EVENT = 'arcuate:saved-words-changed';
export const BOOKMARKS_LIST_NAME = 'Bookmarks';

export const wordDraftSchema = z.object({
  text: z.string().trim().min(1).max(200),
  language: createTextRequestSchema.shape.language,
  sourceTextId: z.uuid(),
  sourceTitle: z.string().trim().min(1).max(300),
  normalizedText: z.string().min(1).max(200).optional(),
  lemmas: z.array(z.string().min(1).max(200)).max(20).optional(),
  partOfSpeech: z.string().min(1).max(30).optional(),
  analysisVersion: z.number().int().positive().optional(),
});
export type WordDraft = z.infer<typeof wordDraftSchema>;
const savedWordSchema = wordDraftSchema.extend({ id: z.uuid(), createdAt: z.iso.datetime() });
export type SavedWord = z.infer<typeof savedWordSchema>;
const listNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter a list name.')
  .max(60, 'Use 60 characters or fewer.');
const wordListSchema = z.object({
  id: z.uuid(),
  name: listNameSchema,
  createdAt: z.iso.datetime(),
  words: z.array(savedWordSchema),
});
export type WordList = z.infer<typeof wordListSchema>;
const prefix = 'arcuate:word-list:v1:';

export function readWordList(id: string) {
  const raw = localStorage.getItem(prefix + id);
  if (raw === null)
    throw new Error('This list is no longer available. Reopen the picker and choose another list.');
  const list = wordListSchema.parse(JSON.parse(raw));
  if (list.id !== id) throw new Error('This saved list could not be read.');
  return list;
}

export function listWordLists() {
  const lists: WordList[] = [];
  let invalidCount = 0;
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (!key?.startsWith(prefix)) continue;
    try {
      lists.push(readWordList(key.slice(prefix.length)));
    } catch {
      invalidCount++;
    }
  }
  return { lists: lists.sort((a, b) => a.createdAt.localeCompare(b.createdAt)), invalidCount };
}

function writeList(list: WordList) {
  localStorage.setItem(prefix + list.id, JSON.stringify(wordListSchema.parse(list)));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SAVED_WORDS_CHANGED_EVENT));
}

function nameKey(name: string) {
  return name.trim().normalize('NFC').toLocaleLowerCase();
}

function enrichWord(draft: WordDraft) {
  const word = wordDraftSchema.parse(draft);
  return {
    ...word,
    normalizedText: word.normalizedText ?? normalizeToken(word.text, word.language),
    lemmas: word.lemmas?.map((lemma) => normalizeToken(lemma, word.language)) ?? [],
  };
}

export function listSavedWords() {
  return listWordLists().lists.flatMap((list) => list.words);
}

export function createWordList(name: string, draft: WordDraft) {
  const parsedName = listNameSchema.safeParse(name);
  if (!parsedName.success) throw new Error(parsedName.error.issues[0].message);
  const word = enrichWord(draft);
  if (listWordLists().lists.some((list) => nameKey(list.name) === nameKey(parsedName.data))) {
    throw new Error('A list with this name already exists. Choose it above or use another name.');
  }
  const list: WordList = {
    id: crypto.randomUUID(),
    name: parsedName.data,
    createdAt: new Date().toISOString(),
    words: [{ ...word, id: crypto.randomUUID(), createdAt: new Date().toISOString() }],
  };
  // Persist the list and its first word together, so a failed save leaves no empty list.
  writeList(list);
  return list;
}

export function saveWordToList(listId: string, draft: WordDraft) {
  const word = enrichWord(draft);
  const list = readWordList(listId);
  const duplicate = list.words.some(
    (saved) =>
      saved.language === word.language &&
      saved.text.normalize('NFC').toLocaleLowerCase(word.language) ===
        word.text.normalize('NFC').toLocaleLowerCase(word.language),
  );
  if (!duplicate) {
    list.words.push({ ...word, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    writeList(list);
  }
  return { list, duplicate };
}

export function saveWordToBookmarks(draft: WordDraft) {
  const existing = listWordLists().lists.find(
    (list) => nameKey(list.name) === nameKey(BOOKMARKS_LIST_NAME),
  );
  if (existing) return saveWordToList(existing.id, draft);
  return { list: createWordList(BOOKMARKS_LIST_NAME, draft), duplicate: false };
}

export function renameWordList(id: string, name: string) {
  const parsed = listNameSchema.safeParse(name);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const list = readWordList(id);
  if (
    listWordLists().lists.some(
      (other) => other.id !== id && nameKey(other.name) === nameKey(parsed.data),
    )
  ) {
    throw new Error('A list with this name already exists. Use another name.');
  }
  writeList({ ...list, name: parsed.data });
}

export function removeSavedWord(listId: string, wordId: string) {
  const list = readWordList(listId);
  writeList({ ...list, words: list.words.filter((word) => word.id !== wordId) });
}

export function deleteWordList(id: string) {
  readWordList(id);
  localStorage.removeItem(prefix + id);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SAVED_WORDS_CHANGED_EVENT));
}

export function wordListMarkdown(list: WordList) {
  return `# ${escapeMarkdown(list.name)}\n\n${list.words.map((word) => `- ${escapeMarkdown(word.text)} (${word.language})`).join('\n')}\n`;
}
