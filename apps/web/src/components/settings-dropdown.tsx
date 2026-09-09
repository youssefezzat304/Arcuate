'use client';

import { useEffect, useId, useRef, useState } from 'react';

type Option = { value: string; label: string };

export function SettingsDropdown({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: Option[];
}) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const search = useRef({ text: '', time: 0 });

  useEffect(() => {
    if (!open) return;
    items.current[options.findIndex((option) => option.value === value)]?.focus();
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open, options, value]);

  return (
    <div
      ref={root}
      className="relative min-w-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <input type="hidden" name={name} value={value} />
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border border-border bg-paper px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-wait"
      >
        <span
          id={`${id}-label`}
          className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground"
        >
          {label}
        </span>
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <span id={`${id}-value`} className="truncate">
            {options.find((option) => option.value === value)?.label}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="size-4 shrink-0"
          >
            <path d="m4 6 4 4 4-4" />
          </svg>
        </span>
      </button>
      {open && (
        <div
          id={id}
          role="listbox"
          aria-labelledby={`${id}-label`}
          className="absolute left-0 top-full z-30 mt-2 max-h-64 w-full overflow-y-auto overscroll-contain rounded-lg border border-border bg-paper p-1 shadow-sm"
          onKeyDown={(event) => {
            const current = items.current.findIndex((item) => item === document.activeElement);
            let next: number;
            if (event.key === 'ArrowDown') next = (current + 1) % options.length;
            else if (event.key === 'ArrowUp')
              next = (current - 1 + options.length) % options.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = options.length - 1;
            else if (
              event.key.length === 1 &&
              event.key !== ' ' &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.altKey
            ) {
              const now = Date.now();
              search.current = {
                text:
                  (now - search.current.time < 700 ? search.current.text : '') +
                  event.key.toLowerCase(),
                time: now,
              };
              next = options.findIndex((option) =>
                option.label.toLowerCase().startsWith(search.current.text),
              );
              if (next < 0) return;
            } else return;
            event.preventDefault();
            items.current[next]?.focus();
          }}
        >
          {options.map((option, index) => (
            <button
              ref={(element) => {
                items.current[index] = element;
              }}
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              tabIndex={-1}
              onClick={() => {
                setValue(option.value);
                setOpen(false);
                trigger.current?.focus();
              }}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-background focus:bg-background focus:outline-none aria-selected:bg-warm-highlight"
            >
              {option.label}
              <span aria-hidden="true">{value === option.value ? '✓' : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
