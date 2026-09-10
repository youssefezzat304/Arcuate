'use client';

import { useNotice } from '@/hooks/use-notice';
import { StatusNotice } from '@/components/status-notice';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { analyzeTextExact, normalizeToken, type TextAnalysis } from '@arcuate/language';
import {
  annotationsToBlocks,
  blocksHaveAnnotations,
  blocksToAnnotations,
  formatSelection,
  selectionHasFormat,
  shortcutFormatPatch,
  type TextAnnotation,
  type TextFormat,
  type TextRun,
  type TextSelection,
} from '@/lib/text-formatting';

import { WordExplanationPopover, type WordLookup } from '@/components/word-explanation-popover';
import { readingWords, sliceTextRuns } from '@/lib/reader-translation';
import type { TextTranslation } from '@arcuate/ai/schema';
import type { CreateTextRequest } from '@/lib/reading-settings';
import { readingMarkdown } from '@/lib/markdown';
import { ClearAnnotationsDialog } from '@/components/clear-annotations-dialog';
import { SaveWordDialog } from '@/components/save-word-dialog';
import {
  listSavedWords,
  SAVED_WORDS_CHANGED_EVENT,
  saveWordToBookmarks,
  type SavedWord,
  type WordDraft,
} from '@/lib/saved-words';
import { findSavedWordRanges, type TextRange } from '@/lib/saved-word-matching';
import { translationShortcutAction } from '@/lib/reader-shortcuts';

const colors = ['yellow', 'rose', 'green', 'blue', 'purple'] as const;
const controlClass =
  'flex h-10 min-w-8 items-center justify-center rounded-md px-2 hover:bg-toolbar-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:bg-toolbar-muted';
type SelectedText = TextSelection & { left: number; top: number; below: boolean };
type TranslationRevealMode = 'sentence' | 'paragraph';
type TranslationHoverTarget = { paragraph: number; sentence: number };
type HeldTranslationTarget = TranslationHoverTarget & { mode: TranslationRevealMode };

function selectionText(range: Range) {
  const content = range.cloneContents();
  content.querySelectorAll('[data-reader-metadata]').forEach((node) => node.remove());
  return content.textContent ?? '';
}

function restoreSelection(root: HTMLElement, selected: TextSelection) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest('[data-reader-metadata]')
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  const range = document.createRange();
  let offset = 0;
  let hasStart = false;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const length = node.textContent?.length ?? 0;
    if (!hasStart && selected.start < offset + length) {
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

export function FormattableReader({
  title,
  paragraphs,
  metadata,
  textId,
  language,
  analysis,
  annotations,
  onAnnotationsChange,
  translation,
  translationLanguage,
  level,
}: {
  translation?: TextTranslation;
  translationLanguage: CreateTextRequest['language'];
  level: CreateTextRequest['level'];
  title: string;
  metadata: string;
  paragraphs: string[];
  textId: string;
  language: WordDraft['language'];
  analysis: TextAnalysis;
  annotations: TextAnnotation[];
  onAnnotationsChange: (annotations: TextAnnotation[]) => void;
}) {
  const [heldTranslations, setHeldTranslations] = useState<Set<string>>(new Set());
  const [lookup, setLookup] = useState<WordLookup | null>(null);
  const closeLookup = useCallback(() => setLookup(null), []);
  const texts = useMemo(() => [title, ...paragraphs], [paragraphs, title]);
  const wordRanges = useMemo(
    () => texts.map((text) => readingWords(text, language)),
    [texts, language],
  );
  const [blocks, setBlocks] = useState<TextRun[][]>(() => annotationsToBlocks(texts, annotations));
  const [selected, setSelected] = useState<SelectedText | null>(null);
  const [palette, setPalette] = useState<'color' | 'highlight' | null>(null);
  const [lastHighlight, setLastHighlight] =
    useState<NonNullable<TextFormat['highlight']>>('var(--highlight-yellow)');
  const [confirmClear, setConfirmClear] = useState(false);
  const [word, setWord] = useState<WordDraft | null>(null);
  const [notice, setNotice] = useNotice();
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const pendingSelection = useRef<TextSelection | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const hoveredTranslationUnit = useRef<TranslationHoverTarget | null>(null);
  const hoveredWord = useRef<{
    blockIndex: number;
    start: number;
    end: number;
    element: HTMLElement;
  } | null>(null);
  const heldTranslationMode = useRef<TranslationRevealMode | null>(null);
  const heldTranslationTarget = useRef<HeldTranslationTarget | null>(null);

  useLayoutEffect(() => {
    if (pendingSelection.current && rootRef.current) {
      restoreSelection(rootRef.current, pendingSelection.current);
      pendingSelection.current = null;
    }
  }, [blocks]);

  useEffect(() => {
    function loadSavedWords() {
      try {
        setSavedWords(listSavedWords().filter((saved) => saved.language === language));
      } catch {
        setSavedWords([]);
      }
    }
    loadSavedWords();
    window.addEventListener('storage', loadSavedWords);
    window.addEventListener(SAVED_WORDS_CHANGED_EVENT, loadSavedWords);
    return () => {
      window.removeEventListener('storage', loadSavedWords);
      window.removeEventListener(SAVED_WORDS_CHANGED_EVENT, loadSavedWords);
    };
  }, [language]);

  const savedRanges = useMemo(() => {
    const titleTokens = analyzeTextExact([title], language).paragraphs[0] ?? [];
    return [
      findSavedWordRanges(title, titleTokens, savedWords, language),
      ...paragraphs.map((paragraph, index) =>
        findSavedWordRanges(
          paragraph,
          analysis.paragraphs[index] ?? analyzeTextExact([paragraph], language).paragraphs[0]!,
          savedWords,
          language,
        ),
      ),
    ];
  }, [analysis, language, paragraphs, savedWords, title]);

  useEffect(() => {
    function updateSelection(event: Event) {
      const root = rootRef.current;
      const selection = window.getSelection();
      if (event.type === 'selectionchange' && toolbarRef.current?.contains(document.activeElement))
        return;
      if (!root || !selection || selection.isCollapsed || !selection.rangeCount) {
        setSelected(null);
        setPalette(null);
        return;
      }
      const range = selection.getRangeAt(0);
      const crossesTranslation = Array.from(root.querySelectorAll('[data-translated=true]')).some(
        (node) => range.intersectsNode(node),
      );
      if (
        crossesTranslation ||
        !root.contains(range.startContainer) ||
        !root.contains(range.endContainer) ||
        !selectionText(range).trim()
      ) {
        setSelected(null);
        setPalette(null);
        return;
      }
      const prefix = document.createRange();
      prefix.selectNodeContents(root);
      prefix.setEnd(range.startContainer, range.startOffset);
      const start = selectionText(prefix).length;
      const rect = range.getBoundingClientRect();
      const below = rect.top < window.innerHeight * 0.25;
      const halfWidth = Math.min(160, (window.innerWidth - 16) / 2);
      setSelected({
        start,
        end: start + selectionText(range).length,
        left: Math.max(
          halfWidth + 8,
          Math.min(window.innerWidth - halfWidth - 8, rect.left + rect.width / 2),
        ),
        top: below ? rect.bottom + 10 : rect.top - 10,
        below,
      });
    }
    function dismiss(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelected(null);
        setPalette(null);
        if (toolbarRef.current?.contains(document.activeElement)) rootRef.current?.focus();
      }
    }
    function outsidePointer(event: PointerEvent) {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        if (toolbarRef.current?.contains(document.activeElement))
          (document.activeElement as HTMLElement).blur();
        setSelected(null);
        setPalette(null);
      }
    }
    document.addEventListener('selectionchange', updateSelection);
    document.addEventListener('pointerup', updateSelection);
    document.addEventListener('pointerdown', outsidePointer);
    document.addEventListener('keydown', dismiss);
    window.addEventListener('scroll', updateSelection, true);
    window.addEventListener('resize', updateSelection);
    return () => {
      document.removeEventListener('selectionchange', updateSelection);
      document.removeEventListener('pointerup', updateSelection);
      document.removeEventListener('pointerdown', outsidePointer);
      document.removeEventListener('keydown', dismiss);
      window.removeEventListener('scroll', updateSelection, true);
      window.removeEventListener('resize', updateSelection);
    };
  }, []);

  const commitBlocks = useCallback(
    (next: TextRun[][], successMessage?: string) => {
      setBlocks(next);
      try {
        onAnnotationsChange(blocksToAnnotations(next));
        if (successMessage) setNotice(successMessage);
      } catch {
        setNotice('This annotation change is visible now, but could not be saved in your browser.');
      }
    },
    [onAnnotationsChange, setNotice],
  );

  function apply(patch: TextFormat) {
    if (!selected) return;
    pendingSelection.current = selected;
    commitBlocks(formatSelection(blocks, selected, patch));
  }

  useEffect(() => {
    function applyShortcut(event: KeyboardEvent) {
      if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || !selected) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
      )
        return;
      const patch = shortcutFormatPatch(event.key, blocks, selected, lastHighlight);
      if (!patch) return;
      event.preventDefault();
      pendingSelection.current = selected;
      commitBlocks(formatSelection(blocks, selected, patch));
    }
    document.addEventListener('keydown', applyShortcut);
    return () => document.removeEventListener('keydown', applyShortcut);
  }, [blocks, commitBlocks, lastHighlight, selected]);

  function clearAnnotations() {
    window.getSelection()?.removeAllRanges();
    setSelected(null);
    setPalette(null);
    setConfirmClear(false);
    commitBlocks(
      annotationsToBlocks(texts, []),
      'All text annotations were cleared. Saved-word styling remains.',
    );
    requestAnimationFrame(() => clearButtonRef.current?.focus());
  }

  function closeClearDialog() {
    setConfirmClear(false);
    requestAnimationFrame(() => clearButtonRef.current?.focus());
  }

  function bookmark() {
    if (!selected) return;
    const text = blocks
      .flat()
      .map((run) => run.text)
      .join('')
      .slice(selected.start, selected.end)
      .trim();
    if (!text || text.length > 200) {
      setNotice('Select a word or short phrase of up to 200 characters.');
      return;
    }
    let blockStart = 0;
    let identity: Pick<WordDraft, 'lemmas' | 'partOfSpeech' | 'analysisVersion'> = {};
    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
      const blockText = blocks[blockIndex]!.map((run) => run.text).join('');
      const localStart = selected.start - blockStart;
      const localEnd = selected.end - blockStart;
      if (blockIndex > 0 && localStart >= 0 && localEnd <= blockText.length) {
        const selectedTokens = (analysis.paragraphs[blockIndex - 1] ?? []).filter(
          (token) => token.start >= localStart && token.end <= localEnd,
        );
        const lexemes = selectedTokens.flatMap((token) => token.lexemes);
        if (lexemes.length)
          identity = {
            lemmas: lexemes.map((lexeme) => lexeme.lemma),
            partOfSpeech: lexemes.length === 1 ? lexemes[0]!.partOfSpeech : undefined,
            analysisVersion: analysis.version,
          };
        break;
      }
      blockStart += blockText.length;
    }
    setWord({
      text,
      language,
      sourceTextId: textId,
      sourceTitle: title,
      normalizedText: normalizeToken(text, language),
      ...identity,
    });
    setSelected(null);
    setNotice('');
  }

  function lookupWordDraft(value: WordLookup): WordDraft {
    const { input, blockIndex } = value;
    let identity: Pick<WordDraft, 'lemmas' | 'partOfSpeech' | 'analysisVersion'> = {};
    if (blockIndex > 0) {
      const selectedTokens = (analysis.paragraphs[blockIndex - 1] ?? []).filter(
        (token) => token.start >= input.start && token.end <= input.end,
      );
      const lexemes = selectedTokens.flatMap((token) => token.lexemes);
      if (lexemes.length)
        identity = {
          lemmas: lexemes.map((lexeme) => lexeme.lemma),
          partOfSpeech: lexemes.length === 1 ? lexemes[0]!.partOfSpeech : undefined,
          analysisVersion: analysis.version,
        };
    }
    return {
      text: input.surface,
      language,
      sourceTextId: textId,
      sourceTitle: title,
      normalizedText: normalizeToken(input.surface, language),
      ...identity,
    };
  }

  const showWord = useCallback(
    (blockIndex: number, start: number, end: number, element: HTMLElement) => {
      if (window.getSelection()?.toString().trim()) return;
      if (end - start > 200) {
        setNotice('Select a shorter word for an explanation.');
        return;
      }
      const rect = element.getBoundingClientRect();
      setLookup({
        blockIndex,
        input: {
          surface: texts[blockIndex]!.slice(start, end),
          paragraph: texts[blockIndex]!,
          start,
          end,
          sourceLanguage: language,
          targetLanguage: translationLanguage,
          level,
        },
        rect: { left: rect.left, top: rect.top, bottom: rect.bottom, width: rect.width },
      });
    },
    [language, level, setNotice, texts, translationLanguage],
  );

  const revealHoveredTranslation = useCallback(
    (mode: TranslationRevealMode | null, target: TranslationHoverTarget | null) => {
      const previous = heldTranslationTarget.current;
      if (
        previous?.mode === mode &&
        previous?.paragraph === target?.paragraph &&
        (mode === 'paragraph' || previous?.sentence === target?.sentence)
      ) {
        return;
      }

      heldTranslationTarget.current = mode && target ? { ...target, mode } : null;
      if (!translation || !mode || !target) {
        setHeldTranslations(new Set());
        return;
      }

      if (mode === 'sentence') {
        setHeldTranslations(new Set([`${target.paragraph}:${target.sentence}`]));
        return;
      }

      setHeldTranslations(
        new Set(
          translation.paragraphs[target.paragraph]?.sentences.map(
            (_, sentence) => `${target.paragraph}:${sentence}`,
          ) ?? [],
        ),
      );
    },
    [translation],
  );

  function updateHoveredReaderTarget(event: ReactPointerEvent<HTMLDivElement>) {
    const element = event.target instanceof HTMLElement ? event.target : null;
    const unit = element?.closest<HTMLElement>('[data-translation-unit]');
    hoveredTranslationUnit.current = unit
      ? {
          paragraph: Number(unit.dataset.paragraph),
          sentence: Number(unit.dataset.sentence),
        }
      : null;

    const wordElement = element?.closest<HTMLElement>('[data-reader-word]');
    hoveredWord.current = wordElement
      ? {
          blockIndex: Number(wordElement.dataset.blockIndex),
          start: Number(wordElement.dataset.wordStart),
          end: Number(wordElement.dataset.wordEnd),
          element: wordElement,
        }
      : null;

    if (heldTranslationMode.current)
      revealHoveredTranslation(heldTranslationMode.current, hoveredTranslationUnit.current);
  }

  useEffect(() => {
    function clearHeldTranslation() {
      heldTranslationMode.current = null;
      revealHoveredTranslation(null, null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
      )
        return;

      const root = rootRef.current;
      if (!root?.matches(':hover')) return;
      const hoveredUnit = root.querySelector<HTMLElement>('[data-translation-unit]:hover');
      hoveredTranslationUnit.current = hoveredUnit
        ? {
            paragraph: Number(hoveredUnit.dataset.paragraph),
            sentence: Number(hoveredUnit.dataset.sentence),
          }
        : null;
      const hoveredWordElement = root.querySelector<HTMLElement>('[data-reader-word]:hover');
      hoveredWord.current = hoveredWordElement
        ? {
            blockIndex: Number(hoveredWordElement.dataset.blockIndex),
            start: Number(hoveredWordElement.dataset.wordStart),
            end: Number(hoveredWordElement.dataset.wordEnd),
            element: hoveredWordElement,
          }
        : null;

      const action = translationShortcutAction(event.key);
      if (!action) return;

      if (action === 'word') {
        if (!hoveredWord.current) return;
        event.preventDefault();
        if (!event.repeat) {
          const { blockIndex, start, end, element } = hoveredWord.current;
          showWord(blockIndex, start, end, element);
        }
        return;
      }

      if (!translation || !hoveredTranslationUnit.current) return;
      event.preventDefault();
      heldTranslationMode.current = action;
      revealHoveredTranslation(action, hoveredTranslationUnit.current);
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === 'Control' || ['r', 't'].includes(event.key.toLocaleLowerCase()))
        clearHeldTranslation();
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearHeldTranslation);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearHeldTranslation);
    };
  }, [revealHoveredTranslation, showWord, translation]);

  function renderRuns(runs: TextRun[], ranges: TextRange[], blockIndex: number, baseOffset = 0) {
    let offset = baseOffset;
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
      for (const word of wordRanges[blockIndex] ?? []) {
        if (word.start < offset && word.end > runStart) {
          boundaries.add(Math.max(0, word.start - runStart));
          boundaries.add(Math.min(text.length, word.end - runStart));
        }
      }
      const sorted = [...boundaries].sort((left, right) => left - right);
      return sorted.slice(0, -1).map((start, index) => {
        const end = sorted[index + 1]!;
        const absoluteStart = runStart + start;
        const saved = ranges.some(
          (range) => range.start <= absoluteStart && range.end >= runStart + end,
        );
        const token = wordRanges[blockIndex]?.find(
          (word) => word.start <= absoluteStart && word.end >= runStart + end,
        );
        return (
          <span
            role={token ? 'button' : undefined}
            tabIndex={token ? 0 : undefined}
            title={token ? 'Click for meaning and examples' : undefined}
            onClick={
              token
                ? (event) => {
                    if (event.detail <= 1)
                      showWord(blockIndex, token.start, token.end, event.currentTarget);
                  }
                : undefined
            }
            onKeyDown={
              token
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      showWord(blockIndex, token.start, token.end, event.currentTarget);
                    }
                  }
                : undefined
            }
            key={`${runStart}:${start}`}
            data-reader-word={token || undefined}
            data-block-index={token ? blockIndex : undefined}
            data-word-start={token?.start}
            data-word-end={token?.end}
            data-saved-word={saved || undefined}
            className={`${token ? 'cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-foreground' : ''} ${saved ? 'font-bold underline decoration-accent decoration-2 underline-offset-4' : ''}`}
            style={{
              fontWeight: format.bold ? 700 : undefined,
              fontStyle: format.italic ? 'italic' : undefined,
              textDecorationLine:
                [(format.underline || saved) && 'underline', format.strikethrough && 'line-through']
                  .filter(Boolean)
                  .join(' ') || undefined,
              color: format.color,
              backgroundColor: format.highlight,
            }}
          >
            {text.slice(start, end)}
          </span>
        );
      });
    });
  }

  return (
    <>
      <div dir="ltr" className="mb-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(readingMarkdown(title, paragraphs, metadata));
              setNotice('Copied as Markdown.');
            } catch {
              setNotice('Could not copy. Allow clipboard access and try again.');
            }
          }}
          className="min-h-9 rounded-lg border border-border bg-paper px-3 py-2 font-sans text-xs font-semibold text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Copy as Markdown
        </button>
        <button
          ref={clearButtonRef}
          type="button"
          dir="ltr"
          disabled={!blocksHaveAnnotations(blocks)}
          onClick={() => setConfirmClear(true)}
          className="min-h-9 rounded-lg border border-border bg-paper px-3 py-2 font-sans text-xs font-semibold text-muted-foreground hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Clear annotations
        </button>
      </div>
      <div
        ref={rootRef}
        tabIndex={-1}
        className="focus:outline-none"
        onPointerEnter={updateHoveredReaderTarget}
        onPointerMove={updateHoveredReaderTarget}
        onPointerLeave={() => {
          hoveredTranslationUnit.current = null;
          hoveredWord.current = null;
          heldTranslationMode.current = null;
          revealHoveredTranslation(null, null);
        }}
      >
        <h1 className="mb-4 font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">
          {renderRuns(blocks[0]!, savedRanges[0]!, 0)}
        </h1>
        <p
          data-reader-metadata
          dir="ltr"
          lang="en"
          className="mb-10 select-none border-b border-border pb-8 font-sans text-xs font-semibold tracking-[0.08em] text-muted-foreground"
        >
          {metadata}
        </p>
        <div
          className="space-y-7 font-serif leading-[1.75] text-ink-secondary"
          style={{ fontSize: 'var(--reader-font-size)' }}
        >
          {blocks.slice(1).map((runs, index) => {
            return (
              <p key={index}>
                {translation
                  ? translation.paragraphs[index]!.sentences.map(
                      (sentence, sentenceIndex, sentences) => {
                        const key = `${index}:${sentenceIndex}`;
                        const revealed = heldTranslations.has(key);
                        const sourceEnd =
                          sentences[sentenceIndex + 1]?.start ?? paragraphs[index]!.length;
                        return (
                          <span
                            key={key}
                            data-translation-unit
                            data-paragraph={index}
                            data-sentence={sentenceIndex}
                            data-translated={revealed || undefined}
                          >
                            <span hidden={revealed}>
                              {renderRuns(
                                sliceTextRuns(runs, sentence.start, sourceEnd),
                                savedRanges[index + 1]!,
                                index + 1,
                                sentence.start,
                              )}
                            </span>
                            {revealed && (
                              <span
                                data-reader-metadata
                                lang={translation.language}
                                dir="auto"
                                className="underline decoration-accent decoration-2 underline-offset-4"
                              >
                                {sentence.text}
                                {sourceEnd > sentence.end ? ' ' : ''}
                              </span>
                            )}
                          </span>
                        );
                      },
                    )
                  : renderRuns(runs, savedRanges[index + 1]!, index + 1)}
              </p>
            );
          })}
        </div>
      </div>
      {lookup && (
        <WordExplanationPopover
          lookup={lookup}
          onClose={closeLookup}
          onBookmark={() => {
            const draft = lookupWordDraft(lookup);
            try {
              const { list, duplicate } = saveWordToBookmarks(draft);
              setNotice(duplicate ? `Already saved in ${list.name}.` : `Saved to ${list.name}.`);
            } catch (failure) {
              setNotice(
                failure instanceof DOMException
                  ? 'This word could not be bookmarked. Browser storage may be full or blocked.'
                  : failure instanceof Error
                    ? failure.message
                    : 'This word could not be bookmarked. Please try again.',
              );
            }
          }}
          onAddToList={() => {
            setWord(lookupWordDraft(lookup));
            setLookup(null);
            setNotice('');
          }}
        />
      )}
      {selected && (
        <div
          ref={toolbarRef}
          role="group"
          aria-label="Text formatting"
          onPointerDown={(event) => event.preventDefault()}
          className="fixed z-50 flex w-96 max-w-[calc(100vw-16px)] items-center justify-between gap-1 rounded-xl border border-toolbar-muted bg-toolbar p-1.5 font-sans text-sm text-toolbar-foreground shadow-sm"
          style={{
            left: selected.left,
            top: selected.top,
            transform: `translate(-50%, ${selected.below ? '0' : '-100%'})`,
          }}
        >
          {palette ? (
            <>
              <button
                type="button"
                className={controlClass}
                aria-label="Back to formatting"
                onClick={() => setPalette(null)}
              >
                ←
              </button>
              <span className="sr-only">
                {palette === 'color' ? 'Text color' : 'Highlight color'}
              </span>
              <button
                type="button"
                className={controlClass}
                aria-label={palette === 'color' ? 'Default text color' : 'Remove highlight'}
                onClick={() => apply({ [palette]: undefined })}
              >
                ∅
              </button>
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={controlClass}
                  aria-label={`${color} ${palette === 'color' ? 'text' : 'highlight'}`}
                  onClick={() => {
                    if (palette === 'highlight') {
                      const value = `var(--highlight-${color})` as NonNullable<
                        TextFormat['highlight']
                      >;
                      setLastHighlight(value);
                      apply({ highlight: value });
                    } else {
                      apply({ color: `var(--color-${color})` as NonNullable<TextFormat['color']> });
                    }
                  }}
                >
                  <span
                    className="size-6 rounded-md border border-toolbar-foreground/30"
                    style={{ backgroundColor: `var(--${palette}-${color})` }}
                  />
                </button>
              ))}
            </>
          ) : (
            <>
              <button
                type="button"
                className={controlClass}
                aria-label="Highlight text"
                title="Highlight text (Ctrl+H)"
                onClick={() => setPalette('highlight')}
              >
                <span className="border-b-4 border-highlight-yellow">Highlight</span>
              </button>
              {(['bold', 'italic', 'underline'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={controlClass}
                  aria-label={key[0]!.toUpperCase() + key.slice(1)}
                  title={
                    key === 'bold'
                      ? 'Bold (Ctrl+B)'
                      : key === 'underline'
                        ? 'Underline (Ctrl+U)'
                        : 'Italic'
                  }
                  aria-pressed={selectionHasFormat(blocks, selected, key)}
                  onClick={() => apply({ [key]: !selectionHasFormat(blocks, selected, key) })}
                >
                  <span
                    className={
                      key === 'bold'
                        ? 'text-xl font-bold'
                        : key === 'italic'
                          ? 'font-serif text-xl italic'
                          : 'text-xl underline'
                    }
                  >
                    {key[0]!.toUpperCase()}
                  </span>
                </button>
              ))}
              <button
                type="button"
                className={controlClass}
                aria-label="Strikethrough"
                aria-pressed={selectionHasFormat(blocks, selected, 'strikethrough')}
                title="Strikethrough (Ctrl+Y)"
                onClick={() =>
                  apply({ strikethrough: !selectionHasFormat(blocks, selected, 'strikethrough') })
                }
              >
                <span className="text-xl line-through">S</span>
              </button>
              <button
                type="button"
                className={controlClass}
                aria-label="Save word"
                title="Save word to a list"
                onClick={bookmark}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                  className="size-5"
                >
                  <path d="M6 3h12v18l-6-4-6 4V3Z" />
                </svg>
              </button>
              <button
                type="button"
                className={controlClass}
                aria-label="Text color"
                onClick={() => setPalette('color')}
              >
                <span className="border-b-2 border-warm-highlight text-xl">A</span>
              </button>
            </>
          )}
        </div>
      )}
      {confirmClear && (
        <ClearAnnotationsDialog onClose={closeClearDialog} onConfirm={clearAnnotations} />
      )}
      {word && (
        <SaveWordDialog
          word={word}
          onSaved={setNotice}
          onClose={() => {
            setWord(null);
            rootRef.current?.focus({ preventScroll: true });
          }}
        />
      )}
      <StatusNotice message={notice} />
    </>
  );
}
