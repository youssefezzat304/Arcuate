'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { wordExplanationSchema, type WordExplanation } from '@arcuate/ai/schema';
import type { WordExplanationRequest } from '@/lib/word-explanation';

export type WordLookup = {
  input: WordExplanationRequest;
  rect: { left: number; top: number; bottom: number; width: number };
};
const cache = new Map<string, WordExplanation>();
type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; answer: WordExplanation };

export function WordExplanationPopover({
  lookup,
  onClose,
}: {
  lookup: WordLookup;
  onClose: () => void;
}) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [position, setPosition] = useState({ left: 16, top: 16, maxHeight: 440 });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    const key = JSON.stringify(lookup.input);
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
  }, [lookup, attempt]);

  useLayoutEffect(() => {
    const panel = ref.current!;
    const bounds = panel.getBoundingClientRect();
    const { rect } = lookup;
    const maxHeight =
      rect.top >= 220
        ? Math.min(rect.top - 22, window.innerHeight - 24)
        : Math.min(440, window.innerHeight - 24);
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

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Explain ${lookup.input.surface}`}
      tabIndex={-1}
      dir="ltr"
      className="fixed z-50 w-88 max-w-[calc(100vw-24px)] rounded-[18px] border-2 border-foreground/75 bg-paper p-1 font-sans text-foreground shadow-[0_18px_50px_rgba(0,0,0,0.22)] outline-none"
      style={position}
    >
      <div
        className="overflow-y-auto rounded-xl border border-border px-3.5 py-3"
        style={{ maxHeight: Math.max(160, position.maxHeight - 10) }}
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2
            lang={lookup.input.sourceLanguage}
            dir="auto"
            className="break-words font-serif text-xl leading-tight"
          >
            {lookup.input.surface}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close word explanation"
            className="flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-background focus-visible:outline-2"
          >
            ×
          </button>
        </div>
        {state.status === 'loading' && (
          <p role="status" className="text-sm text-muted-foreground">
            Looking up this word in context…
          </p>
        )}
        {state.status === 'error' && (
          <>
            <p role="alert" className="text-sm">
              {state.message}
            </p>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="mt-3 min-h-9 rounded-md bg-accent px-3 text-sm text-accent-foreground"
            >
              Try again
            </button>
          </>
        )}
        {state.status === 'ready' && (
          <div className="space-y-2.5 text-[13px] leading-5">
            <p lang={lookup.input.targetLanguage} dir="auto" className="font-semibold">
              {state.answer.translation}
            </p>
            {(
              [
                ['Meaning', state.answer.meaning],
                ['In this context', state.answer.contextMeaning],
                ['Grammar', state.answer.grammar],
              ] as const
            ).map(([label, value]) => (
              <section key={label}>
                <h3 className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {label}
                </h3>
                <p lang={lookup.input.targetLanguage} dir="auto">
                  {value}
                </p>
              </section>
            ))}
            <section className="rounded-lg bg-background px-3 py-2.5">
              <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Examples
              </h3>
              <ol className="space-y-2">
                {state.answer.examples.map((example, index) => (
                  <li key={index}>
                    <p lang={lookup.input.sourceLanguage} dir="auto">
                      {example.source}
                    </p>
                    <p
                      lang={lookup.input.targetLanguage}
                      dir="auto"
                      className="text-muted-foreground"
                    >
                      {example.translation}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
            <p className="pt-0.5 text-[10px] text-muted-foreground">AI-generated explanation</p>
          </div>
        )}
      </div>
    </div>
  );
}
