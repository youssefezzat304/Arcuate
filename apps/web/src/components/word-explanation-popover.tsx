'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { wordExplanationSchema, type WordExplanation } from '@arcuate/ai/schema';
import type { WordExplanationRequest } from '@/lib/word-explanation';

export type WordLookup = {
  blockIndex: number;
  input: WordExplanationRequest;
  rect: { left: number; top: number; bottom: number; width: number };
};
const cache = new Map<string, WordExplanation>();
type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; answer: WordExplanation };
type ExplanationTab = 'explain' | 'examples' | 'grammar';

const tabs = [
  { id: 'explain', label: 'Explain' },
  { id: 'examples', label: 'Examples' },
  { id: 'grammar', label: 'Grammar' },
] as const satisfies ReadonlyArray<{ id: ExplanationTab; label: string }>;

export function WordExplanationPopover({
  lookup,
  onClose,
  onBookmark,
  onAddToList,
}: {
  lookup: WordLookup;
  onClose: () => void;
  onBookmark: () => void;
  onAddToList: () => void;
}) {
  const lookupKey = JSON.stringify(lookup.input);
  const [state, setState] = useState<State>({ status: 'loading' });
  const [tabSelection, setTabSelection] = useState<{
    lookupKey: string;
    tab: ExplanationTab;
  }>({ lookupKey, tab: 'explain' });
  const activeTab = tabSelection.lookupKey === lookupKey ? tabSelection.tab : 'explain';
  const [attempt, setAttempt] = useState(0);
  const [position, setPosition] = useState({ left: 16, top: 16, maxHeight: 520 });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    const key = lookupKey;
    async function load() {
      const cached = cache.get(key);
      if (cached) {
        setState({ status: 'ready', answer: cached });
        return;
      }
      setState({ status: 'loading' });
      try {
        const response = await fetch('/api/words/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: key,
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(35000)]),
        });
        const body: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof body === 'object' &&
            body !== null &&
            'error' in body &&
            typeof body.error === 'string'
              ? body.error
              : 'Unable to explain this word.';
          throw new Error(message);
        }
        const answer = wordExplanationSchema.parse(body);
        if (controller.signal.aborted) return;
        if (cache.size >= 100) cache.delete(cache.keys().next().value!);
        cache.set(key, answer);
        setState({ status: 'ready', answer });
      } catch (failure) {
        if (!controller.signal.aborted)
          setState({
            status: 'error',
            message:
              failure instanceof Error && failure.name === 'Error'
                ? failure.message
                : 'The lookup timed out or returned an invalid answer. Please try again.',
          });
      }
    }
    void load();
    return () => controller.abort();
  }, [lookup, lookupKey, attempt]);

  useLayoutEffect(() => {
    const panel = ref.current!;
    const bounds = panel.getBoundingClientRect();
    const { rect } = lookup;
    const maxHeight =
      rect.top >= 220
        ? Math.min(rect.top - 22, window.innerHeight - 24)
        : Math.min(520, window.innerHeight - 24);
    const height = Math.min(panel.scrollHeight, maxHeight);
    setPosition({
      maxHeight,
      left: Math.max(
        12,
        Math.min(
          window.innerWidth - bounds.width - 12,
          rect.left + rect.width / 2 - bounds.width / 2,
        ),
      ),
      top:
        rect.top - height - 10 >= 12
          ? rect.top - height - 10
          : Math.max(12, Math.min(rect.bottom + 10, window.innerHeight - height - 12)),
    });
  }, [lookup, state]);

  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus({ preventScroll: true });
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) onClose();
    }
    function dismiss(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        if (previous instanceof HTMLElement && previous.isConnected)
          previous.focus({ preventScroll: true });
      }
    }
    function scroll(event: Event) {
      if (!(event.target instanceof Node) || !ref.current?.contains(event.target)) onClose();
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', dismiss);
    window.addEventListener('scroll', scroll, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', dismiss);
      window.removeEventListener('scroll', scroll, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  function moveTab(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = tabs[nextIndex]!;
    setTabSelection({ lookupKey, tab: nextTab.id });
    requestAnimationFrame(() => document.getElementById(`word-${nextTab.id}-tab`)?.focus());
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Explain ${lookup.input.surface}`}
      tabIndex={-1}
      dir="ltr"
      className="fixed z-50 w-[30rem] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl bg-paper font-sans text-foreground shadow-[0_18px_50px_rgba(0,0,0,0.22)] outline-none"
      style={{ ...position, fontSize: 'var(--reader-font-size)' }}
    >
      <div
        className="overflow-y-auto bg-paper"
        style={{ maxHeight: Math.max(160, position.maxHeight) }}
      >
        <header className="flex items-start justify-between gap-4 bg-toolbar px-5 py-4 text-toolbar-foreground">
          <div className="min-w-0">
            <h2
              lang={lookup.input.sourceLanguage}
              dir="auto"
              className="break-words font-serif text-3xl leading-none text-accent"
            >
              {lookup.input.surface}
            </h2>
            {state.status === 'ready' && (
              <p
                lang={lookup.input.targetLanguage}
                dir="auto"
                className="mt-2 text-[1.125em] font-semibold leading-[1.45]"
              >
                {state.answer.translation}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onBookmark}
              aria-label="Save word to Bookmarks"
              title="Save to Bookmarks"
              className="flex size-9 items-center justify-center rounded-md text-accent hover:bg-toolbar-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
                className="size-5"
              >
                <path d="M6 3h12v18l-6-4-6 4V3Z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onAddToList}
              aria-label="Save word to another list"
              title="Choose or create a list"
              className="flex size-9 items-center justify-center rounded-md hover:bg-toolbar-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="size-5"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close word explanation"
              className="flex size-9 items-center justify-center rounded-md text-2xl leading-none hover:bg-toolbar-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              ×
            </button>
          </div>
        </header>
        {state.status === 'loading' && (
          <p role="status" className="px-5 py-6 text-base text-muted-foreground">
            Looking up this word in context…
          </p>
        )}
        {state.status === 'error' && (
          <div className="px-5 py-6">
            <p role="alert" className="text-base leading-7">
              {state.message}
            </p>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="mt-4 min-h-10 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground"
            >
              Try again
            </button>
          </div>
        )}
        {state.status === 'ready' && (
          <>
            <div
              role="tablist"
              aria-label="Word explanation sections"
              className="sticky top-0 z-10 flex gap-6 border-b border-border bg-paper px-5"
            >
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  id={`word-${tab.id}-tab`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`word-${tab.id}-panel`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onClick={() => setTabSelection({ lookupKey, tab: tab.id })}
                  onKeyDown={(event) => moveTab(event, index)}
                  className="border-b-2 border-transparent py-3 text-[0.875em] font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 aria-selected:border-accent aria-selected:text-foreground"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'explain' && (
              <section
                id="word-explain-panel"
                role="tabpanel"
                aria-labelledby="word-explain-tab"
                className="space-y-5 px-5 py-5"
              >
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    In this context
                  </h3>
                  <p
                    lang={lookup.input.targetLanguage}
                    dir="auto"
                    className="font-serif text-[1em] leading-[1.75]"
                  >
                    {state.answer.contextMeaning}
                  </p>
                </div>
                <div className="rounded-lg bg-background px-4 py-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    General meaning
                  </h3>
                  <p lang={lookup.input.targetLanguage} dir="auto" className="leading-[1.75]">
                    {state.answer.meaning}
                  </p>
                </div>
              </section>
            )}

            {activeTab === 'examples' && (
              <section
                id="word-examples-panel"
                role="tabpanel"
                aria-labelledby="word-examples-tab"
                className="px-5 py-5"
              >
                <ol className="divide-y divide-border overflow-hidden rounded-lg bg-background px-4">
                  {state.answer.examples.map((example, index) => (
                    <li key={index} className="py-4">
                      <p
                        lang={lookup.input.sourceLanguage}
                        dir="auto"
                        className="font-serif text-[1em] leading-[1.75]"
                      >
                        {example.source}
                      </p>
                      <p
                        lang={lookup.input.targetLanguage}
                        dir="auto"
                        className="mt-1 leading-[1.75] text-muted-foreground"
                      >
                        {example.translation}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {activeTab === 'grammar' && (
              <section
                id="word-grammar-panel"
                role="tabpanel"
                aria-labelledby="word-grammar-tab"
                className="px-5 py-5"
              >
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Grammar in this sentence
                </h3>
                <p
                  lang={lookup.input.targetLanguage}
                  dir="auto"
                  className="font-serif text-[1em] leading-[1.75]"
                >
                  {state.answer.grammar}
                </p>
              </section>
            )}

            <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
              AI-generated explanation
            </p>
          </>
        )}
      </div>
    </div>
  );
}
