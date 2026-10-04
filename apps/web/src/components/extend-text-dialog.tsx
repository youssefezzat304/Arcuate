'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { FiLoader } from 'react-icons/fi';
import { TextLengthSlider } from '@/components/text-length-slider';
import { readText, type SavedText } from '@/lib/saved-texts';
import {
  extensionOriginal,
  extensionRequestSchema,
  saveTextExtension,
  textExtensionSchema,
  type ExtensionRequest,
  type TextExtension,
} from '@/lib/text-extension';
import { SUPPORTED_LANGUAGES } from '@/lib/supported-languages';

type UnsavedExtension = { original: ExtensionRequest['original']; extension: TextExtension };
const buttonClass =
  'min-h-11 rounded-md px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground';

export function ExtendTextDialog({
  text,
  onClose,
  onExtended,
}: {
  text: SavedText;
  onClose: () => void;
  onExtended: (text: SavedText) => void;
}) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsaved, setUnsaved] = useState<UnsavedExtension | null>(null);
  const language = SUPPORTED_LANGUAGES.find(({ code }) => code === text.settings.language)?.name;
  const translationLanguage = text.translation
    ? SUPPORTED_LANGUAGES.find(({ code }) => code === text.translation?.language)?.name
    : undefined;

  useEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal();
    return () => {
      controllerRef.current?.abort();
      dialog.close();
    };
  }, []);

  function close() {
    controllerRef.current?.abort();
    dialogRef.current?.close();
    onClose();
  }

  function persist(result: UnsavedExtension) {
    try {
      const updated = saveTextExtension(text.id, result.original, result.extension);
      onExtended(updated);
      close();
    } catch (failure) {
      setUnsaved(result);
      setError(
        failure instanceof DOMException
          ? 'Your extension was generated, but browser storage is full or blocked. Allow storage and retry saving. Keep this dialog open to retain the extension.'
          : failure instanceof Error
            ? failure.message
            : 'The extension could not be saved. Please retry saving.',
      );
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || unsaved) return;
    setError(null);
    const fields = new FormData(event.currentTarget);
    let request: ExtensionRequest;
    try {
      const latest = readText(text.id);
      if (!latest) throw new Error('This text is no longer saved in this browser.');
      request = extensionRequestSchema.parse({
        prompt: fields.get('prompt'),
        length: Number(fields.get('length')),
        original: extensionOriginal(latest),
      });
    } catch (failure) {
      setError(
        failure instanceof z.ZodError
          ? (failure.issues[0]?.message ?? 'Check your prompt and length.')
          : failure instanceof Error
            ? failure.message
            : 'The saved reading could not be loaded.',
      );
      return;
    }

    inFlight.current = true;
    setPending(true);
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const response = await fetch('/api/texts/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(250_000)]),
      });
      const body: unknown = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) {
        const failure = z.object({ error: z.string().max(1000) }).safeParse(body);
        throw new Error(
          failure.success ? failure.data.error : 'Unable to extend the text. Please try again.',
        );
      }
      const result = textExtensionSchema.safeParse(body);
      if (!result.success)
        throw new Error('The server returned an invalid extension. Please try again.');
      persist({ original: request.original, extension: result.data });
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(
          failure instanceof Error && !['TimeoutError', 'TypeError'].includes(failure.name)
            ? failure.message
            : 'The request timed out or the connection failed. Please try again.',
        );
      }
    } finally {
      inFlight.current = false;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="m-auto max-h-[calc(100dvh-32px)] w-2xl max-w-[calc(100vw-32px)] overflow-y-auto rounded-xl border border-border bg-paper p-0 font-sans text-foreground shadow-lg backdrop:bg-overlay/60"
    >
      <form onSubmit={submit} aria-busy={pending} className="p-6 sm:p-8">
        <div className="border-b border-border pb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Continue your reading
          </p>
          <h2 id={`${id}-title`} className="font-serif text-3xl">
            Extend text
          </h2>
          <p
            id={`${id}-description`}
            className="mt-3 text-sm leading-relaxed text-muted-foreground"
          >
            Add new paragraphs to “{text.title}”. The original text stays intact.
          </p>
          <p className="mt-3 text-xs font-semibold tracking-wide text-muted-foreground">
            {language} · {text.settings.level}
            {translationLanguage ? ` · Translation: ${translationLanguage}` : ''}
          </p>
        </div>
        <fieldset
          disabled={pending || unsaved !== null}
          className="mt-6 space-y-5 disabled:opacity-60"
        >
          <label htmlFor={`${id}-prompt`} className="block text-sm font-semibold">
            How should the text continue?
            <textarea
              id={`${id}-prompt`}
              name="prompt"
              autoFocus
              required
              maxLength={2000}
              rows={4}
              placeholder="Continue the story, explore a new idea, or explain what happens next…"
              className="mt-2 block w-full resize-y rounded-md border border-border bg-background px-3 py-3 text-base font-normal leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            />
          </label>
          <TextLengthSlider label="Extension length" />
        </fieldset>
        {pending && (
          <p role="status" className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <FiLoader
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
            Writing your extension…
          </p>
        )}
        {error && (
          <p role="alert" className="mt-5 text-sm leading-relaxed text-destructive">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
          <button
            type="button"
            onClick={close}
            className={`${buttonClass} border border-border hover:bg-background`}
          >
            {pending ? 'Cancel' : 'Close'}
          </button>
          {unsaved ? (
            <button
              type="button"
              onClick={() => persist(unsaved)}
              className={`${buttonClass} bg-accent text-accent-foreground`}
            >
              Retry saving
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className={`${buttonClass} bg-accent text-accent-foreground disabled:cursor-wait disabled:opacity-60`}
            >
              {pending ? 'Extending…' : 'Extend text'}
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
}
