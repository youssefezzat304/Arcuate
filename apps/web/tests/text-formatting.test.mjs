import assert from "node:assert/strict";
import test from "node:test";
import {
  annotationsToBlocks,
  blocksHaveAnnotations,
  blocksToAnnotations,
  formatSelection,
  shortcutFormatPatch,
} from "../src/lib/text-formatting.ts";

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

test("annotation ranges round-trip without persisting duplicate text", () => {
  const texts = ["Title", "Body text"];
  let blocks = annotationsToBlocks(texts, []);
  blocks = formatSelection(blocks, { start: 1, end: 8 }, { bold: true });
  blocks = formatSelection(blocks, { start: 6, end: 10 }, { highlight: "var(--highlight-green)" });

  const annotations = blocksToAnnotations(blocks);

  assert.equal(blocksHaveAnnotations(blocks), true);
  assert.deepEqual(annotationsToBlocks(texts, annotations), blocks);
  assert.equal(JSON.stringify(annotations).includes("Title"), false);
  assert.equal(blocksHaveAnnotations(annotationsToBlocks(texts, [])), false);
});
