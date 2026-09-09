'use client';

import { useEffect, useId, useRef, useState } from 'react';

type Action = { label: string; onSelect: () => void };

export function ListActionsMenu({ actions }: { actions: Action[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    items.current[0]?.focus();
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  return (
    <div
      ref={root}
      className="relative shrink-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label="List actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="flex size-11 items-center justify-center rounded-md border border-border text-2xl hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {open && (
        <div
          id={id}
          role="menu"
          aria-label="List actions"
          className="absolute right-0 top-full z-20 mt-2 w-52 max-w-[calc(100vw-64px)] rounded-lg border border-border bg-paper p-1 shadow-sm"
          onKeyDown={(event) => {
            const current = items.current.findIndex((item) => item === document.activeElement);
            let next: number;
            if (event.key === 'ArrowDown') next = (current + 1) % actions.length;
            else if (event.key === 'ArrowUp')
              next = (current - 1 + actions.length) % actions.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = actions.length - 1;
            else return;
            event.preventDefault();
            items.current[next]?.focus();
          }}
        >
          {actions.map((action, index) => (
            <button
              key={action.label}
              ref={(element) => {
                items.current[index] = element;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
                action.onSelect();
              }}
              className="block min-h-11 w-full rounded-md px-3 py-2 text-left text-sm hover:bg-background focus:bg-background focus:outline-none"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
