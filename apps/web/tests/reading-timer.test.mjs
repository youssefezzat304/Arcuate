import assert from "node:assert/strict";
import { test } from "node:test";
import { readTimerHistory, saveTimerSession, timerStorageKey, formatDuration } from "../src/lib/reading-timer.ts";

const id = "123e4567-e89b-42d3-a456-426614174000";
const otherId = "223e4567-e89b-42d3-a456-426614174000";
function storage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test("timer retains ten latest sessions and all-time shortest for each text", () => {
  const store = storage();
  saveTimerSession(id, 1000, store);
  for (let i = 1; i <= 12; i++) saveTimerSession(id, i * 2000, store);
  const history = readTimerHistory(id, store);
  assert.equal(history.sessions.length, 10);
  assert.equal(history.sessions[0].durationMs, 24000);
  assert.equal(history.sessions[9].durationMs, 6000);
  assert.equal(history.bestMs, 1000);
  assert.deepEqual(readTimerHistory(otherId, store), { bestMs: null, sessions: [] });
  saveTimerSession(otherId, 3000, store);
  assert.equal(readTimerHistory(otherId, store).bestMs, 3000);
});

test("timer rejects invalid durations and preserves corrupt history", () => {
  const store = storage();
  for (const duration of [0, -1, Infinity, NaN]) assert.throws(() => saveTimerSession(id, duration, store));
  store.setItem(timerStorageKey(id), "broken");
  assert.throws(() => readTimerHistory(id, store));
  assert.throws(() => saveTimerSession(id, 3000, store));
  assert.equal(store.getItem(timerStorageKey(id)), "broken");
});

test("timer saving failures propagate without replacing previous sessions", () => {
  const store = storage();
  saveTimerSession(id, 2000, store);
  const failing = { ...store, setItem() { throw new Error("Blocked"); } };
  assert.throws(() => saveTimerSession(id, 1000, failing), /Blocked/);
  assert.equal(readTimerHistory(id, store).bestMs, 2000);
});

test("timer display keeps minutes beyond one hour", () => {
  assert.equal(formatDuration(0), "00:00");
  assert.equal(formatDuration(61999), "01:01");
  assert.equal(formatDuration(3600000), "60:00");
});
