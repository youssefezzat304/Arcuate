import { z } from "zod";

const sessionSchema = z.object({ id: z.uuid(), durationMs: z.number().int().positive(), stoppedAt: z.iso.datetime() });
const historySchema = z.object({ bestMs: z.number().int().positive().nullable(), sessions: z.array(sessionSchema).max(10) });
export type TimerHistory = z.infer<typeof historySchema>;
export const emptyTimerHistory: TimerHistory = { bestMs: null, sessions: [] };
export const timerStorageKey = (textId: string) => `arcuate:timer:v1:${z.uuid().parse(textId)}`;

export function readTimerHistory(textId: string, storage: Pick<Storage, "getItem"> = localStorage): TimerHistory {
  const raw = storage.getItem(timerStorageKey(textId));
  return raw === null ? emptyTimerHistory : historySchema.parse(JSON.parse(raw));
}

export function saveTimerSession(textId: string, durationMs: number, storage: Pick<Storage, "getItem" | "setItem"> = localStorage) {
  const session = sessionSchema.parse({ id: crypto.randomUUID(), durationMs: Math.round(durationMs), stoppedAt: new Date().toISOString() });
  const history = readTimerHistory(textId, storage);
  const updated = historySchema.parse({
    bestMs: Math.min(history.bestMs ?? session.durationMs, session.durationMs),
    sessions: [session, ...history.sessions].slice(0, 10),
  });
  storage.setItem(timerStorageKey(textId), JSON.stringify(updated));
  return updated;
}

export function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
