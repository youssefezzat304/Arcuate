'use client';

import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';

export type TranslationMode = 'sentence' | 'paragraph';
export type TranslationTarget = {
  paragraph: number;
  sentence: number;
  mode: TranslationMode;
};

export function TranslationOrb({
  rootRef,
  onTranslate,
  onTargetChange,
  onRestore,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  onTranslate: (paragraph: number, sentence: number, mode: TranslationMode) => void;
  onTargetChange: (target: TranslationTarget | null) => void;
  onRestore: () => void;
}) {
  const [mode, setMode] = useState<TranslationMode>('sentence');
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [keyboardTarget, setKeyboardTarget] = useState(-1);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveredTarget = useRef<TranslationTarget | null>(null);
  const gesture = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
    width: number;
    height: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(
    () => () => {
      if (clickTimer.current) clearTimeout(clickTimer.current);
    },
    [],
  );

  function updateTarget(target: TranslationTarget | null) {
    const previous = hoveredTarget.current;
    if (
      previous?.paragraph === target?.paragraph &&
      previous?.sentence === target?.sentence &&
      previous?.mode === target?.mode
    ) {
      return;
    }

    hoveredTarget.current = target;
    onTargetChange(target);
  }

  function targetAtPoint(x: number, y: number): TranslationTarget | null {
    const unit = document
      .elementsFromPoint(x, y)
      .map((element) => element.closest<HTMLElement>('[data-translation-unit]'))
      .find((element): element is HTMLElement =>
        Boolean(element && rootRef.current?.contains(element)),
      );
    if (!unit) return null;

    const paragraph = Number(unit.dataset.paragraph);
    const sentence = Number(unit.dataset.sentence);
    return Number.isInteger(paragraph) && Number.isInteger(sentence)
      ? { paragraph, sentence, mode }
      : null;
  }

  function dragPosition(event: PointerEvent<HTMLButtonElement>) {
    const start = gesture.current!;
    return {
      left: Math.max(
        8,
        Math.min(window.innerWidth - start.width - 8, start.left + event.clientX - start.x),
      ),
      top: Math.max(
        8,
        Math.min(window.innerHeight - start.height - 8, start.top + event.clientY - start.y),
      ),
    };
  }

  function targetAtOrb(position: { left: number; top: number }) {
    const start = gesture.current!;
    return targetAtPoint(position.left + start.width / 2, position.top + start.height / 2);
  }

  function translate(target: TranslationTarget | null) {
    if (!target) {
      setAnnouncement(
        `Drop the translation circle onto a ${mode === 'sentence' ? 'sentence' : 'paragraph'} in the reading.`,
      );
      return;
    }
    onTranslate(target.paragraph, target.sentence, target.mode);
    setAnnouncement(
      `${mode === 'sentence' ? 'Sentence' : 'Paragraph'} translated. Click the circle once to restore all originals.`,
    );
  }

  function switchMode() {
    if (clickTimer.current) clearTimeout(clickTimer.current);
    setMode((value) => (value === 'sentence' ? 'paragraph' : 'sentence'));
    setAnnouncement(
      mode === 'sentence' ? 'Paragraph translation mode.' : 'Sentence translation mode.',
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Translation circle: ${mode} mode`}
        aria-describedby="translation-orb-help"
        title="Hold and drag onto text, then release to translate. Click to restore originals. Double-click to switch mode."
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          suppressClick.current = false;
          const rect = event.currentTarget.getBoundingClientRect();
          gesture.current = {
            x: event.clientX,
            y: event.clientY,
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            moved: false,
          };
          setPosition({ left: rect.left, top: rect.top });
          setDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const start = gesture.current;
          if (!start) return;
          if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 3) start.moved = true;
          const nextPosition = dragPosition(event);
          setPosition(nextPosition);
          updateTarget(start.moved ? targetAtOrb(nextPosition) : null);
          if (start.moved && clickTimer.current) clearTimeout(clickTimer.current);
          // Scroll while dragging near the top/bottom edge.
          if (event.clientY < 48) window.scrollBy(0, -18);
          else if (event.clientY > window.innerHeight - 48) window.scrollBy(0, 18);
        }}
        onPointerUp={(event) => {
          const moved = gesture.current?.moved;
          const dropTarget = moved ? targetAtOrb(dragPosition(event)) : null;
          gesture.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
          if (moved) {
            suppressClick.current = true;
            translate(dropTarget);
          }
          updateTarget(null);
          setPosition(null);
          setDragging(false);
        }}
        onPointerCancel={() => {
          gesture.current = null;
          updateTarget(null);
          setPosition(null);
          setDragging(false);
          suppressClick.current = true;
        }}
        onClick={(event) => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          if (event.detail > 1) return;
          if (clickTimer.current) clearTimeout(clickTimer.current);
          clickTimer.current = setTimeout(() => {
            onRestore();
            updateTarget(null);
            setAnnouncement('Original text restored.');
          }, 300);
        }}
        onDoubleClick={switchMode}
        onKeyDown={(event) => {
          if (event.key.toLowerCase() === 'm') {
            event.preventDefault();
            switchMode();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            onRestore();
            updateTarget(null);
          } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const units = rootRef.current?.querySelectorAll<HTMLElement>('[data-translation-unit]');
            if (!units?.length) return;
            const index =
              (keyboardTarget + (event.key === 'ArrowDown' ? 1 : -1) + units.length) % units.length;
            setKeyboardTarget(index);
            units[index]!.scrollIntoView({ block: 'center' });
            updateTarget({
              paragraph: Number(units[index]!.dataset.paragraph),
              sentence: Number(units[index]!.dataset.sentence),
              mode,
            });
            setAnnouncement(
              `Sentence ${index + 1} selected. Press Enter to translate in ${mode} mode.`,
            );
          } else if (event.key === 'Enter' && keyboardTarget >= 0) {
            event.preventDefault();
            translate(hoveredTarget.current);
            updateTarget(null);
          }
        }}
        className={`fixed z-40 flex size-13 touch-none select-none items-center justify-center rounded-full border-2 border-paper text-xl font-bold shadow-md transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${mode === 'paragraph' ? 'bg-translation-paragraph text-translation-paragraph-foreground' : 'bg-accent text-accent-foreground'} ${dragging ? 'scale-110 cursor-grabbing shadow-lg' : 'cursor-grab'}`}
        style={position ?? { right: 20, top: '50%' }}
      >
        <span aria-hidden="true">{mode === 'paragraph' ? '¶' : '文'}</span>
      </button>
      <p id="translation-orb-help" className="sr-only">
        Hold and drag this circle onto a sentence or paragraph. The target highlights while the
        circle is over it; release to reveal its translation and return the circle to its starting
        place. Click once to restore all translated text. Double-click or press M to switch mode.
        With the circle focused, use arrow up or down to choose a target and Enter to translate;
        Escape restores originals.
      </p>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
