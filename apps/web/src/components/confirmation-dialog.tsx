"use client";

import { useEffect, useId, useRef } from "react";

export function ConfirmationDialog({ title, description, confirmLabel, onClose, onConfirm }: {
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="m-auto w-md max-w-[calc(100vw-32px)] rounded-xl border border-border bg-paper p-0 font-sans text-foreground shadow-lg backdrop:bg-foreground/25"
    >
      <div className="p-6">
        <h2 id={`${id}-title`} className="font-serif text-2xl">{title}</h2>
        <p id={`${id}-description`} className="mt-3 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="min-h-11 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-paper focus-visible:outline-2 focus-visible:outline-offset-2">
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
