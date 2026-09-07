"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { formatSelection, selectionHasFormat, type TextFormat, type TextRun, type TextSelection } from "@/lib/text-formatting";

import { SaveWordDialog } from "@/components/save-word-dialog";
import type { WordDraft } from "@/lib/saved-words";

const colors = ["yellow", "rose", "green", "blue", "purple"] as const;
const controlClass = "flex h-10 min-w-8 items-center justify-center rounded-md px-2 hover:bg-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:bg-ink-secondary";
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

export function FormattableReader({ title, paragraphs, textId, language }: { title: string; paragraphs: string[]; textId: string; language: WordDraft["language"] }) {
  const [blocks, setBlocks] = useState<TextRun[][]>(() => [title, ...paragraphs].map((text) => [{ text, format: {} }]));
  const [selected, setSelected] = useState<SelectedText | null>(null);
  const [palette, setPalette] = useState<"color" | "highlight" | null>(null);
  const [word, setWord] = useState<WordDraft | null>(null);
  const [notice, setNotice] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const pendingSelection = useRef<TextSelection | null>(null);

  useLayoutEffect(() => {
    if (pendingSelection.current && rootRef.current) {
      restoreSelection(rootRef.current, pendingSelection.current);
      pendingSelection.current = null;
    }
  }, [blocks]);

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

  function apply(patch: TextFormat) {
    if (!selected) return;
    pendingSelection.current = selected;
    setBlocks((current) => formatSelection(current, selected, patch));
  }

  function bookmark() {
    if (!selected) return;
    const text = blocks.flat().map((run) => run.text).join("").slice(selected.start, selected.end).trim();
    if (!text || text.length > 200) {
      setNotice("Select a word or short phrase of up to 200 characters.");
      return;
    }
    setWord({ text, language, sourceTextId: textId, sourceTitle: title });
    setSelected(null);
    setNotice("");
  }

  function renderRuns(runs: TextRun[]) {
    let offset = 0;
    return runs.map(({ text, format }) => {
      const key = offset;
      offset += text.length;
      return <span key={key} style={{ fontWeight: format.bold ? 700 : undefined, fontStyle: format.italic ? "italic" : undefined,
        textDecoration: format.underline ? "underline" : undefined, color: format.color, backgroundColor: format.highlight }}>{text}</span>;
    });
  }

  return <>
    <div ref={rootRef} tabIndex={-1} className="focus:outline-none">
      <h1 className="mb-10 border-b border-border pb-8 font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">{renderRuns(blocks[0]!)}</h1>
      <div className="space-y-7 font-serif text-lg leading-8 text-ink-secondary">
        {blocks.slice(1).map((runs, index) => <p key={index}>{renderRuns(runs)}</p>)}
      </div>
    </div>
    {selected && <div ref={toolbarRef} role="group" aria-label="Text formatting"
      onPointerDown={(event) => event.preventDefault()}
      className="fixed z-50 flex w-80 max-w-[calc(100vw-16px)] items-center justify-between gap-1 rounded-xl border border-ink-secondary bg-foreground p-1.5 font-sans text-sm text-paper shadow-sm"
      style={{ left: selected.left, top: selected.top, transform: `translate(-50%, ${selected.below ? "0" : "-100%"})` }}>
      {palette ? <>
        <button type="button" className={controlClass} aria-label="Back to formatting" onClick={() => setPalette(null)}>←</button>
        <span className="sr-only">{palette === "color" ? "Text color" : "Highlight color"}</span>
        <button type="button" className={controlClass} aria-label={palette === "color" ? "Default text color" : "Remove highlight"} onClick={() => apply({ [palette]: undefined })}>∅</button>
        {colors.map((color) => <button key={color} type="button" className={controlClass} aria-label={`${color} ${palette === "color" ? "text" : "highlight"}`} onClick={() => apply({ [palette]: `var(--${palette}-${color})` })}>
          <span className="size-6 rounded-md border border-paper/30" style={{ backgroundColor: `var(--${palette}-${color})` }} />
        </button>)}
      </> : <>
        <button type="button" className={controlClass} aria-label="Highlight text" onClick={() => setPalette("highlight")}><span className="border-b-4 border-warm-highlight">Highlight</span></button>
        {(["bold", "italic", "underline"] as const).map((key) => <button key={key} type="button" className={controlClass} aria-label={key[0]!.toUpperCase() + key.slice(1)} aria-pressed={selectionHasFormat(blocks, selected, key)} onClick={() => apply({ [key]: !selectionHasFormat(blocks, selected, key) })}>
          <span className={key === "bold" ? "text-xl font-bold" : key === "italic" ? "font-serif text-xl italic" : "text-xl underline"}>{key[0]!.toUpperCase()}</span>
        </button>)}
        <button type="button" className={controlClass} aria-label="Save word" title="Save word to a list" onClick={bookmark}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" className="size-5"><path d="M6 3h12v18l-6-4-6 4V3Z" /></svg>
        </button>
        <button type="button" className={controlClass} aria-label="Text color" onClick={() => setPalette("color")}><span className="border-b-2 border-warm-highlight text-xl">A</span></button>
      </>}
    </div>}
    {word && <SaveWordDialog word={word} onSaved={setNotice} onClose={() => { setWord(null); rootRef.current?.focus({ preventScroll: true }); }} />}
    {notice && <p role="status" className="fixed bottom-5 left-1/2 z-50 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-lg border border-border bg-paper px-4 py-3 font-sans text-sm text-foreground shadow-sm">{notice}</p>}
  </>;
}
