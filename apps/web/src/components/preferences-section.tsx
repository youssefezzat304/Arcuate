"use client";

import { useEffect, useState } from "react";
import {
  APP_PREFERENCE_LANGUAGES,
  DEFAULT_PREFERENCES,
  READER_FONT_SIZES,
  THEME_MODES,
  applyPreferences,
  readPreferences,
  savePreferences,
  type Preferences,
} from "@/lib/preferences";

const controlClass = "min-w-32 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

export function PreferencesSection() {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const stored = readPreferences();
      setPreferences(stored);
      applyPreferences(stored);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (preferences.theme !== "system") return;

    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const followSystemTheme = () => applyPreferences(preferences, document.documentElement, colorScheme.matches);
    colorScheme.addEventListener("change", followSystemTheme);
    return () => colorScheme.removeEventListener("change", followSystemTheme);
  }, [preferences]);

  function updatePreference<Key extends keyof Preferences>(key: Key, value: Preferences[Key]) {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    applyPreferences(next);

    try {
      savePreferences(next);
      setStorageError("");
    } catch {
      setStorageError("This preference could not be saved in your browser.");
    }
  }

  return (
    <section aria-labelledby="preferences-heading" className="border-t border-border">
      <div className="py-6 sm:py-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Personalization</p>
        <h2 id="preferences-heading" className="font-serif text-2xl tracking-[-0.02em] sm:text-3xl">Preferences</h2>
      </div>

      <div className="divide-y divide-border border-y border-border">
        <div className="flex min-h-24 flex-col items-stretch justify-between gap-3 py-5 sm:flex-row sm:items-center sm:gap-6">
          <div>
            <h3 className="text-sm font-semibold">Dark mode</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Choose a light or dark palette, or follow your device.</p>
          </div>
          <div role="radiogroup" aria-label="Dark mode" className="flex shrink-0 rounded-md border border-border bg-background p-1">
            {THEME_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={preferences.theme === mode}
                onClick={() => updatePreference("theme", mode)}
                className="rounded px-3 py-1.5 text-xs font-semibold capitalize text-muted-foreground transition-colors aria-checked:bg-accent aria-checked:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground"
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <label className="flex min-h-24 flex-col items-stretch justify-between gap-3 py-5 sm:flex-row sm:items-center sm:gap-6">
          <span>
            <span className="block text-sm font-semibold">App language</span>
            <span className="mt-1 block text-sm leading-6 text-muted-foreground">Used for accessibility and future interface translations.</span>
          </span>
          <select
            value={preferences.appLanguage}
            onChange={(event) => updatePreference("appLanguage", event.target.value as Preferences["appLanguage"])}
            className={`${controlClass} w-full sm:w-auto`}
          >
            {APP_PREFERENCE_LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.name}</option>)}
          </select>
        </label>

        <label className="flex min-h-24 flex-col items-stretch justify-between gap-3 py-5 sm:flex-row sm:items-center sm:gap-6">
          <span>
            <span className="block text-sm font-semibold">Font size</span>
            <span className="mt-1 block text-sm leading-6 text-muted-foreground">Adjust the body text size in the reader.</span>
          </span>
          <select
            value={preferences.readerFontSize}
            onChange={(event) => updatePreference("readerFontSize", Number(event.target.value))}
            className={`${controlClass} w-full sm:w-auto`}
          >
            {READER_FONT_SIZES.map((size) => <option key={size} value={size}>{size}px</option>)}
          </select>
        </label>
      </div>

      {storageError && <p role="alert" className="mt-4 text-sm text-[var(--color-rose)]">{storageError}</p>}
      <p className="mt-4 text-xs leading-5 text-muted-foreground">Preferences are saved in this browser.</p>
    </section>
  );
}
