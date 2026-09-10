'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { createTextRequestSchema } from '@/lib/reading-settings';
import { savedTextSchema, saveText, type SavedText } from '@/lib/saved-texts';

export function GenerationForm({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsaved, setUnsaved] = useState<SavedText | null>(null);
  const inFlight = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  function persist(text: SavedText) {
    try {
      saveText(text);
      setUnsaved(null);
      router.push(`/texts/${text.id}`);
    } catch {
      setUnsaved(text);
      setError(
        'Your text was generated, but could not be saved. Browser storage may be full or blocked. Allow storage, then retry saving without generating again. Keep this page open to retain your text.',
      );
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || unsaved) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = createTextRequestSchema.safeParse({ ...fields, length: Number(fields.length) });
    if (!parsed.success) {
      setError('Check the topic and reading settings.');
      return;
    }
    inFlight.current = true;
    setPending(true);
    setError(null);
    controller.current = new AbortController();
    try {
      const response = await fetch('/api/texts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
        signal: AbortSignal.any([controller.current.signal, AbortSignal.timeout(250000)]),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const failure = z.object({ error: z.string() }).safeParse(body);
        throw new Error(
          failure.success ? failure.data.error : 'Unable to generate text. Please try again.',
        );
      }
      const result = savedTextSchema.safeParse(body);
      if (!result.success)
        throw new Error('The server returned an invalid text. Please try again.');
      persist(result.data);
    } catch (failure) {
      if (!controller.current.signal.aborted) {
        setError(
          failure instanceof Error &&
            failure.name !== 'TimeoutError' &&
            failure.name !== 'TypeError'
            ? failure.message
            : 'The request timed out or the connection failed. Please try again.',
        );
      }
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={submit}
        aria-busy={pending}
        className="relative rounded-xl border border-border bg-paper"
      >
        <fieldset
          disabled={pending || Boolean(unsaved)}
          inert={pending ? true : undefined}
          className={`min-w-0 transition-opacity duration-300 ${pending ? 'pointer-events-none opacity-0' : 'disabled:opacity-60'}`}
        >
          {children}
        </fieldset>
        {pending && (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[inherit] bg-paper px-6 py-8"
          >
            <div className="flex w-full max-w-md items-center gap-6 sm:gap-8">
              <div className="generation-proof" aria-hidden="true">
                <span className="generation-proof__folio">A</span>
                <span className="generation-proof__rule" />
                <span className="generation-proof__line generation-proof__line--1" />
                <span className="generation-proof__line generation-proof__line--2" />
                <span className="generation-proof__line generation-proof__line--3" />
                <span className="generation-proof__line generation-proof__line--4" />
                <span className="generation-proof__line generation-proof__line--5" />
                <span className="generation-proof__page-number">01</span>
              </div>
              <div className="min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Setting the type
                </p>
                <p className="font-serif text-2xl leading-tight tracking-[-0.025em] sm:text-3xl">
                  Writing your reading
                  <span className="generation-ellipsis" aria-hidden="true" />
                  <span className="sr-only">…</span>
                </p>
                <p className="mt-3 text-xs leading-5 text-muted-foreground sm:text-sm">
                  Longer reads may take a few minutes. Keep this page open.
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
      {error && (
        <p role="alert" className="mt-4 text-sm leading-6 text-foreground">
          {error}
        </p>
      )}
      {unsaved && (
        <button
          type="button"
          onClick={() => persist(unsaved)}
          className="mt-3 rounded-lg bg-accent px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Retry saving
        </button>
      )}
    </div>
  );
}
