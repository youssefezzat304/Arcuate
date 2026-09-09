// Add future formatting shortcuts here so the handler and reader guide stay aligned.
export const READER_SHORTCUTS = [
  { key: 'b', label: 'Bold', format: 'bold' },
  { key: 'h', label: 'Highlight with the last color', format: 'highlight' },
  { key: 'u', label: 'Underline', format: 'underline' },
  { key: 'y', label: 'Strikethrough', format: 'strikethrough' },
] as const;

export const TRANSLATION_SHORTCUTS = [
  { key: 'e', label: 'Translate hovered word', action: 'word', hold: false },
  { key: 'r', label: 'Reveal hovered sentence', action: 'sentence', hold: true },
  { key: 't', label: 'Reveal hovered paragraph', action: 'paragraph', hold: true },
] as const;

export type TranslationShortcutAction = (typeof TRANSLATION_SHORTCUTS)[number]['action'];

export function translationShortcutAction(key: string): TranslationShortcutAction | null {
  return (
    TRANSLATION_SHORTCUTS.find((shortcut) => shortcut.key === key.toLocaleLowerCase())?.action ??
    null
  );
}
