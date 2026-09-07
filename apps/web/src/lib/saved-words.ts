import { z } from "zod";
import { createTextRequestSchema } from "./reading-settings.ts";

export const wordDraftSchema = z.object({
  text: z.string().trim().min(1).max(200),
  language: createTextRequestSchema.shape.language,
  sourceTextId: z.uuid(),
  sourceTitle: z.string().trim().min(1).max(300),
});
export type WordDraft = z.infer<typeof wordDraftSchema>;
const savedWordSchema = wordDraftSchema.extend({ id: z.uuid(), createdAt: z.iso.datetime() });
const listNameSchema = z.string().trim().min(1, "Enter a list name.").max(60, "Use 60 characters or fewer.");
const wordListSchema = z.object({
  id: z.uuid(), name: listNameSchema, createdAt: z.iso.datetime(), words: z.array(savedWordSchema),
});
export type WordList = z.infer<typeof wordListSchema>;
const prefix = "arcuate:word-list:v1:";

function readList(id: string) {
  const raw = localStorage.getItem(prefix + id);
  if (raw === null) throw new Error("This list is no longer available. Reopen the picker and choose another list.");
  const list = wordListSchema.parse(JSON.parse(raw));
  if (list.id !== id) throw new Error("This saved list could not be read.");
  return list;
}

export function listWordLists() {
  const lists: WordList[] = [];
  let invalidCount = 0;
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (!key?.startsWith(prefix)) continue;
    try { lists.push(readList(key.slice(prefix.length))); }
    catch { invalidCount++; }
  }
  return { lists: lists.sort((a, b) => a.createdAt.localeCompare(b.createdAt)), invalidCount };
}

function writeList(list: WordList) {
  localStorage.setItem(prefix + list.id, JSON.stringify(wordListSchema.parse(list)));
}

function nameKey(name: string) {
  return name.trim().normalize("NFC").toLocaleLowerCase();
}

export function createWordList(name: string, draft: WordDraft) {
  const parsedName = listNameSchema.safeParse(name);
  if (!parsedName.success) throw new Error(parsedName.error.issues[0].message);
  const word = wordDraftSchema.parse(draft);
  if (listWordLists().lists.some((list) => nameKey(list.name) === nameKey(parsedName.data))) {
    throw new Error("A list with this name already exists. Choose it above or use another name.");
  }
  const list: WordList = {
    id: crypto.randomUUID(), name: parsedName.data, createdAt: new Date().toISOString(),
    words: [{ ...word, id: crypto.randomUUID(), createdAt: new Date().toISOString() }],
  };
  // Persist the list and its first word together, so a failed save leaves no empty list.
  writeList(list);
  return list;
}

export function saveWordToList(listId: string, draft: WordDraft) {
  const word = wordDraftSchema.parse(draft);
  const list = readList(listId);
  const duplicate = list.words.some((saved) => saved.language === word.language &&
    saved.text.normalize("NFC").toLocaleLowerCase(word.language) === word.text.normalize("NFC").toLocaleLowerCase(word.language));
  if (!duplicate) {
    list.words.push({ ...word, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    writeList(list);
  }
  return { list, duplicate };
}
