"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { analyzeTextExact, normalizeToken, type TextAnalysis } from "@arcuate/language";
import { annotationsToBlocks, blocksHaveAnnotations, blocksToAnnotations, formatSelection, selectionHasFormat, shortcutFormatPatch, type TextAnnotation, type TextFormat, type TextRun, type TextSelection } from "@/lib/text-formatting";

import { ClearAnnotationsDialog } from "@/components/clear-annotations-dialog";
import { SaveWordDialog } from "@/components/save-word-dialog";
import { listSavedWords, SAVED_WORDS_CHANGED_EVENT, type SavedWord, type WordDraft } from "@/lib/saved-words";
import { findSavedWordRanges, type TextRange } from "@/lib/saved-word-matching";

const colors = ["yellow", "rose", "green", "blue", "purple"] as const;
const controlClass = "flex h-10 min-w-8 items-center justify-center rounded-md px-2 hover:bg-toolbar-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:bg-toolbar-muted";
type SelectedText = TextSelection & { left: number; top: number; below: boolean };

function restoreSelection(root: HTMLElement, selected: TextSelection) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let offset = 0;
  let hasStart = false;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const length = node.textContent?.length ?? 0;
    if (!hasStart && selected.start <= offset + length) {
      range.setStart(node, selected.start - offset);
      hasStart = true;
    }
    if (hasStart && selected.end <= offset + length) {
      range.setEnd(node, selected.end - offset);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }
    offset += length;
  }
}

export function FormattableReader({ title, paragraphs, textId, language, analysis, annotations, onAnnotationsChange }: {
  title: string;
  paragraphs: string[];
  textId: string;
  language: WordDraft["language"];
  analysis: TextAnalysis;
  annotations: TextAnnotation[];
  onAnnotationsChange: (annotations: TextAnnotation[]) => void;
}) {
  const texts = useMemo(() => [title, ...paragraphs], [paragraphs, title]);
  const [blocks, setBlocks] = useState<TextRun[][]>(() => annotationsToBlocks(texts, annotations));
  const [selected, setSelected] = useState<SelectedText | null>(null);
  const [palette, setPalette] = useState<"color" | "highlight" | null>(null);
  const [lastHighlight, setLastHighlight] = useState<NonNullable<TextFormat["highlight"]>>("var(--highlight-yellow)");
  const [confirmClear, setConfirmClear] = useState(false);
  const [word, setWord] = useState<WordDraft | null>(null);
  const [notice, setNotice] = useState("");
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const pendingSelection = useRef<TextSelection | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (pendingSelection.current && rootRef.current) {
      restoreSelection(rootRef.current, pendingSelection.current);
      pendingSelection.current = null;
    }
  }, [blocks]);

  useEffect(() => {
    function loadSavedWords() {
      try { setSavedWords(listSavedWords().filter((saved) => saved.language === language)); }
      catch { setSavedWords([]); }
    }
    loadSavedWords();
    window.addEventListener("storage", loadSavedWords);
    window.addEventListener(SAVED_WORDS_CHANGED_EVENT, loadSavedWords);
    return () => {
      window.removeEventListener("storage", loadSavedWords);
      window.removeEventListener(SAVED_WORDS_CHANGED_EVENT, loadSavedWords);
    };
  }, [language]);

  const savedRanges = useMemo(() => {
    const titleTokens = analyzeTextExact([title], language).paragraphs[0] ?? [];
    return [
      findSavedWordRanges(title, titleTokens, savedWords, language),
      ...paragraphs.map((paragraph, index) => findSavedWordRanges(
        paragraph, analysis.paragraphs[index] ?? analyzeTextExact([paragraph], language).paragraphs[0]!, savedWords, language,
      )),
    ];
  }, [analysis, language, paragraphs, savedWords, title]);

  useEffect(() => {
    function updateSelection(event: Event) {
      const root = rootRef.current;
      const selection = window.getSelection();
      if (event.type === "selectionchange" && toolbarRef.current?.contains(document.activeElement)) return;
      if (!root || !selection || selection.isCollapsed || !selection.rangeCount) {
        setSelected(null);
        setPalette(null);
        return;
      }
      const range = selection.getRangeAt(0);
      if (!root.contains(range.startContainer) || !root.contains(range.endContainer) || !range.toString().trim()) {
        setSelected(null);
        setPalette(null);
        return;
      }
      const prefix = document.createRange();
      prefix.selectNodeContents(root);
      prefix.setEnd(range.startContainer, range.startOffset);
      const start = prefix.toString().length;
      const rect = range.getBoundingClientRect();
      const below = rect.top < window.innerHeight * 0.25;
      const halfWidth = Math.min(160, (window.innerWidth - 16) / 2);
      setSelected({ start, end: start + range.toString().length,
        left: Math.max(halfWidth + 8, Math.min(window.innerWidth - halfWidth - 8, rect.left + rect.width / 2)),
        top: below ? rect.bottom + 10 : rect.top - 10, below });
    }
    function dismiss(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelected(null);
        setPalette(null);
        if (toolbarRef.current?.contains(document.activeElement)) rootRef.current?.focus();
      }
    }
    function outsidePointer(event: PointerEvent) {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        if (toolbarRef.current?.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
        setSelected(null);
        setPalette(null);
      }
    }
    document.addEventListener("selectionchange", updateSelection);
    document.addEventListener("pointerup", updateSelection);
    document.addEventListener("pointerdown", outsidePointer);
    document.addEventListener("keydown", dismiss);
    window.addEventListener("scroll", updateSelection, true);
    window.addEventListener("resize", updateSelection);
    return () => {
      document.removeEventListener("selectionchange", updateSelection);
      document.removeEventListener("pointerup", updateSelection);
      document.removeEventListener("pointerdown", outsidePointer);
      document.removeEventListener("keydown", dismiss);
      window.removeEventListener("scroll", updateSelection, true);
      window.removeEventListener("resize", updateSelection);
    };
  }, []);

  const commitBlocks = useCallback((next: TextRun[][], successMessage?: string) => {
    setBlocks(next);
    try {
      onAnnotationsChange(blocksToAnnotations(next));
      if (successMessage) setNotice(successMessage);
    } catch {
      setNotice("This annotation change is visible now, but could not be saved in your browser.");
    }
  }, [onAnnotationsChange]);

  function apply(patch: TextFormat) {
    if (!selected) return;
    pendingSelection.current = selected;
    commitBlocks(formatSelection(blocks, selected, patch));
  }

  useEffect(() => {
    function applyShortcut(event: KeyboardEvent) {
      if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || !selected) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName))) return;
      const patch = shortcutFormatPatch(event.key, blocks, selected, lastHighlight);
      if (!patch) return;
      event.preventDefault();
      pendingSelection.current = selected;
      commitBlocks(formatSelection(blocks, selected, patch));
    }
    document.addEventListener("keydown", applyShortcut);
    return () => document.removeEventListener("keydown", applyShortcut);
  }, [blocks, commitBlocks, lastHighlight, selected]);

  function clearAnnotations() {
    window.getSelection()?.removeAllRanges();
    setSelected(null);
    setPalette(null);
    setConfirmClear(false);
    commitBlocks(annotationsToBlocks(texts, []), "All text annotations were cleared. Saved-word styling remains.");
    requestAnimationFrame(() => clearButtonRef.current?.focus());
  }

  function closeClearDialog() {
    setConfirmClear(false);
    requestAnimationFrame(() => clearButtonRef.current?.focus());
  }

  function bookmark() {
    if (!selected) return;
    const text = blocks.flat().map((run) => run.text).join("").slice(selected.start, selected.end).trim();
    if (!text || text.length > 200) {
      setNotice("Select a word or short phrase of up to 200 characters.");
      return;
    }
    let blockStart = 0;
    let identity: Pick<WordDraft, "lemmas" | "partOfSpeech" | "analysisVersion"> = {};
    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
      const blockText = blocks[blockIndex]!.map((run) => run.text).join("");
      const localStart = selected.start - blockStart;
      const localEnd = selected.end - blockStart;
      if (blockIndex > 0 && localStart >= 0 && localEnd <= blockText.length) {
        const selectedTokens = (analysis.paragraphs[blockIndex - 1] ?? []).filter(
          (token) => token.start >= localStart && token.end <= localEnd,
        );
        const lexemes = selectedTokens.flatMap((token) => token.lexemes);
        if (lexemes.length) identity = {
          lemmas: lexemes.map((lexeme) => lexeme.lemma),
          partOfSpeech: lexemes.length === 1 ? lexemes[0]!.partOfSpeech : undefined,
          analysisVersion: analysis.version,
        };
        break;
      }
      blockStart += blockText.length;
    }
    setWord({ text, language, sourceTextId: textId, sourceTitle: title,
      normalizedText: normalizeToken(text, language), ...identity });
    setSelected(null);
    setNotice("");
  }

  function renderRuns(runs: TextRun[], ranges: TextRange[]) {
    let offset = 0;
    return runs.flatMap(({ text, format }) => {
      const runStart = offset;
      offset += text.length;
      const boundaries = new Set([0, text.length]);
      for (const range of ranges) {
        if (range.start < offset && range.end > runStart) {
          boundaries.add(Math.max(0, range.start - runStart));
          boundaries.add(Math.min(text.length, range.end - runStart));
        }
      }
      const sorted = [...boundaries].sort((left, right) => left - right);
      return sorted.slice(0, -1).map((start, index) => {
        const end = sorted[index + 1]!;
        const absoluteStart = runStart + start;
        const saved = ranges.some((range) => range.start <= absoluteStart && range.end >= runStart + end);
        return <span key={`${runStart}:${start}`} data-saved-word={saved || undefined}
          className={saved ? "font-bold underline decoration-accent decoration-2 underline-offset-4" : undefined}
          style={{ fontWeight: format.bold ? 700 : undefined, fontStyle: format.italic ? "italic" : undefined,
            textDecorationLine: [(format.underline || saved) && "underline", format.strikethrough && "line-through"].filter(Boolean).join(" ") || undefined,
            color: format.color, backgroundColor: format.highlight }}>{text.slice(start, end)}</span>;
      });
    });
  }

  return <>
    <button ref={clearButtonRef} type="button" dir="ltr" disabled={!blocksHaveAnnotations(blocks)} onClick={() => setConfirmClear(true)}
      className="absolute top-3 right-3 min-h-9 rounded-lg border border-border bg-paper px-3 py-2 font-sans text-xs font-semibold text-muted-foreground hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:top-4 sm:right-4">
      Clear annotations
    </button>
    <div ref={rootRef} tabIndex={-1} className="focus:outline-none">
      <h1 className="mb-10 border-b border-border pb-8 font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">{renderRuns(blocks[0]!, savedRanges[0]!)}</h1>
      <div className="space-y-7 font-serif leading-[1.75] text-ink-secondary" style={{ fontSize: "var(--reader-font-size)" }}>
        {blocks.slice(1).map((runs, index) => <p key={index}>{renderRuns(runs, savedRanges[index + 1]!)}</p>)}
      </div>
    </div>
    {selected && <div ref={toolbarRef} role="group" aria-label="Text formatting"
      onPointerDown={(event) => event.preventDefault()}
      className="fixed z-50 flex w-96 max-w-[calc(100vw-16px)] items-center justify-between gap-1 rounded-xl border border-toolbar-muted bg-toolbar p-1.5 font-sans text-sm text-toolbar-foreground shadow-sm"
      style={{ left: selected.left, top: selected.top, transform: `translate(-50%, ${selected.below ? "0" : "-100%"})` }}>
      {palette ? <>
        <button type="button" className={controlClass} aria-label="Back to formatting" onClick={() => setPalette(null)}>←</button>
        <span className="sr-only">{palette === "color" ? "Text color" : "Highlight color"}</span>
        <button type="button" className={controlClass} aria-label={palette === "color" ? "Default text color" : "Remove highlight"} onClick={() => apply({ [palette]: undefined })}>∅</button>
        {colors.map((color) => <button key={color} type="button" className={controlClass} aria-label={`${color} ${palette === "color" ? "text" : "highlight"}`} onClick={() => {
          if (palette === "highlight") {
            const value = `var(--highlight-${color})` as NonNullable<TextFormat["highlight"]>;
            setLastHighlight(value);
            apply({ highlight: value });
          } else {
            apply({ color: `var(--color-${color})` as NonNullable<TextFormat["color"]> });
          }
        }}>
          <span className="size-6 rounded-md border border-toolbar-foreground/30" style={{ backgroundColor: `var(--${palette}-${color})` }} />
        </button>)}
      </> : <>
        <button type="button" className={controlClass} aria-label="Highlight text" title="Highlight text (Ctrl+H)" onClick={() => setPalette("highlight")}><span className="border-b-4 border-highlight-yellow">Highlight</span></button>
        {(["bold", "italic", "underline"] as const).map((key) => <button key={key} type="button" className={controlClass} aria-label={key[0]!.toUpperCase() + key.slice(1)}
          title={key === "bold" ? "Bold (Ctrl+B)" : key === "underline" ? "Underline (Ctrl+U)" : "Italic"}
          aria-pressed={selectionHasFormat(blocks, selected, key)} onClick={() => apply({ [key]: !selectionHasFormat(blocks, selected, key) })}>
          <span className={key === "bold" ? "text-xl font-bold" : key === "italic" ? "font-serif text-xl italic" : "text-xl underline"}>{key[0]!.toUpperCase()}</span>
        </button>)}
        <button type="button" className={controlClass} aria-label="Strikethrough" aria-pressed={selectionHasFormat(blocks, selected, "strikethrough")} title="Strikethrough (Ctrl+Y)" onClick={() => apply({ strikethrough: !selectionHasFormat(blocks, selected, "strikethrough") })}>
          <span className="text-xl line-through">S</span>
        </button>
        <button type="button" className={controlClass} aria-label="Save word" title="Save word to a list" onClick={bookmark}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" className="size-5"><path d="M6 3h12v18l-6-4-6 4V3Z" /></svg>
        </button>
        <button type="button" className={controlClass} aria-label="Text color" onClick={() => setPalette("color")}><span className="border-b-2 border-warm-highlight text-xl">A</span></button>
      </>}
    </div>}
    {confirmClear && <ClearAnnotationsDialog onClose={closeClearDialog} onConfirm={clearAnnotations} />}
    {word && <SaveWordDialog word={word} onSaved={setNotice} onClose={() => { setWord(null); rootRef.current?.focus({ preventScroll: true }); }} />}
    {notice && <p role="status" className="fixed bottom-5 left-1/2 z-50 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-lg border border-border bg-paper px-4 py-3 font-sans text-sm text-foreground shadow-sm">{notice}</p>}
  </>;
}
