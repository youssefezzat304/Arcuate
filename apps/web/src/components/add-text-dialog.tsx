'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  countManualTextCharacters,
  createManualText,
  manualTextInputSchema,
  saveText,
  type SavedText,
} from '@/lib/saved-texts';
import { CEFR_LEVELS } from '@/lib/reading-settings';
import { SUPPORTED_LANGUAGES } from '@/lib/supported-languages';

const fieldClass =
  'mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-foreground';
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxImageBytes = 1_000_000;

export function AddTextDialog({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (text: SavedText) => void;
}) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<string>();
  const [imageName, setImageName] = useState('');
  const [readingImage, setReadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    setError(null);
    if (!file) {
      setReadingImage(false);
      setBackgroundImage(undefined);
      setImageName('');
      return;
    }
    if (!allowedImageTypes.has(file.type)) {
      setReadingImage(false);
      input.value = '';
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > maxImageBytes) {
      setReadingImage(false);
      input.value = '';
      setError('Choose an image smaller than 1 MB.');
      return;
    }
    setReadingImage(true);
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!manualTextInputSchema.shape.backgroundImage.safeParse(result).success) {
        input.value = '';
        setReadingImage(false);
        setError('This image could not be read. Choose another JPG, PNG, or WebP image.');
        return;
      }
      setBackgroundImage(result);
      setImageName(file.name);
      setReadingImage(false);
    });
    reader.addEventListener('error', () => {
      input.value = '';
      setReadingImage(false);
      setError('This image could not be read. Choose another image.');
    });
    reader.readAsDataURL(file);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = manualTextInputSchema.safeParse({
      backgroundImage,
      title: fields.title,
      text: fields.text,
      language: fields.language,
      level: fields.level,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the text details and try again.');
      return;
    }
    try {
      const saved = createManualText(parsed.data);
      saveText(saved);
      onAdded(saved);
    } catch (failure) {
      setError(
        failure instanceof DOMException
          ? 'This text could not be saved. Browser storage may be full or blocked.'
          : failure instanceof Error
            ? failure.message
            : 'This text could not be saved. Please try again.',
      );
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-32px)] w-2xl max-w-[calc(100vw-32px)] overflow-y-auto rounded-xl border border-border bg-paper p-0 font-sans text-foreground shadow-lg backdrop:bg-overlay/60"
    >
      <form onSubmit={submit} className="p-6 sm:p-8">
        <div className="border-b border-border pb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Your reading collection
          </p>
          <h2 id={`${id}-title`} className="font-serif text-3xl">
            Add text
          </h2>
        </div>

        <div className="mt-6 grid gap-5">
          <label className="text-sm font-semibold">
            Background image <span className="font-normal text-muted-foreground">(optional)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={chooseImage}
              className={`${fieldClass} file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-2 file:text-sm file:font-semibold file:text-paper`}
            />
          </label>
          {backgroundImage && (
            <div className="flex items-center gap-4 rounded-lg border border-border bg-background p-3">
              <div
                aria-hidden="true"
                className="h-16 w-24 shrink-0 rounded-md bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImage})` }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{imageName}</p>
                <button
                  type="button"
                  onClick={() => {
                    setBackgroundImage(undefined);
                    setImageName('');
                  }}
                  className="mt-1 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-2"
                >
                  Remove image
                </button>
              </div>
            </div>
          )}

          <label className="text-sm font-semibold">
            Title
            <input
              autoFocus
              required
              minLength={1}
              maxLength={300}
              name="title"
              className={fieldClass}
            />
          </label>

          <label className="text-sm font-semibold">
            Text
            <textarea
              required
              minLength={1}
              maxLength={100_000}
              name="text"
              rows={9}
              value={text}
              onChange={(event) => setText(event.target.value)}
              className={`${fieldClass} resize-y leading-6`}
            />
            <span className="mt-2 block text-right text-xs font-normal tabular-nums text-muted-foreground">
              {countManualTextCharacters(text).toLocaleString()} characters
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Language
              <select name="language" defaultValue="de" className={fieldClass}>
                {SUPPORTED_LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Level
              <select name="level" defaultValue="A2" className={fieldClass}>
                {CEFR_LEVELS.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-5 text-sm leading-6 text-destructive">
            {error}
          </p>
        )}

        <div className="mt-7 flex justify-end gap-3 border-t border-border pt-5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={readingImage}
            className="min-h-11 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
          >
            {readingImage ? 'Reading image…' : 'Add text'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
