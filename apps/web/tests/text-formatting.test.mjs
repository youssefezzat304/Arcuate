import assert from "node:assert/strict";
import test from "node:test";
import { formatSelection, shortcutFormatPatch } from "../src/lib/text-formatting.ts";

const selection = { start: 0, end: 4 };
const plain = [[{ text: "Text", format: {} }]];

test("formatting shortcuts toggle bold, underline, and strikethrough", () => {
  for (const [key, property] of [["b", "bold"], ["u", "underline"], ["y", "strikethrough"]]) {
    const enabled = shortcutFormatPatch(key, plain, selection, "var(--highlight-yellow)");
    assert.deepEqual(enabled, { [property]: true });
    const formatted = formatSelection(plain, selection, enabled);
    assert.deepEqual(shortcutFormatPatch(key, formatted, selection, "var(--highlight-yellow)"), { [property]: false });
  }
});

test("highlight shortcut applies the last selected highlight color", () => {
  assert.deepEqual(shortcutFormatPatch("h", plain, selection, "var(--highlight-blue)"), {
    highlight: "var(--highlight-blue)",
  });
  assert.equal(shortcutFormatPatch("x", plain, selection, "var(--highlight-blue)"), null);
});
