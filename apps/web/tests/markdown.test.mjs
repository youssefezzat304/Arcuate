import assert from "node:assert/strict";
import { test } from "node:test";
import { readingMarkdown } from "../src/lib/markdown.ts";

test("reading Markdown preserves Unicode, title, and paragraph separation", () => {
  assert.equal(readingMarkdown("Die Sonne", ["Schön 😊", "Zweiter Absatz"]), "# Die Sonne\n\nSchön 😊\n\nZweiter Absatz\n");
});

test("reading Markdown escapes literal formatting and HTML", () => {
  assert.equal(readingMarkdown("A *title*", ["[word] <b>"]), "# A \\*title\\*\n\n\\[word\\] \\<b\\>\n");
});

test("reading Markdown places language, level, and character count below the title", () => {
  assert.equal(
    readingMarkdown("Die Sonne", ["Ein Absatz"], "German · A2 · 4,082 characters"),
    "# Die Sonne\n\nGerman · A2 · 4,082 characters\n\nEin Absatz\n",
  );
});
