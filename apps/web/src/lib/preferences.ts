import { z } from 'zod';

export const APP_PREFERENCE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
] as const;

export const THEME_MODES = ['light', 'dark', 'system'] as const;
export const READER_FONT_SIZES = [12, 14, 16, 18, 20, 22, 24] as const;

export const preferencesSchema = z.object({
  theme: z.enum(THEME_MODES),
  appLanguage: z.enum(APP_PREFERENCE_LANGUAGES.map(({ code }) => code)),
  readerFontSize: z.number().int().min(12).max(24).multipleOf(2),
});

const legacyPreferencesSchema = z.object({
  darkMode: z.boolean(),
  appLanguage: z.enum(APP_PREFERENCE_LANGUAGES.map(({ code }) => code)),
  fontSize: z.enum(['small', 'medium', 'large']),
});

export type Preferences = z.infer<typeof preferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'light',
  appLanguage: 'en',
  readerFontSize: 14,
};

export const PREFERENCES_STORAGE_KEY = 'arcuate:preferences:v1';

export function readPreferences(storage: Pick<Storage, 'getItem'> = localStorage): Preferences {
  try {
    const stored = storage.getItem(PREFERENCES_STORAGE_KEY);
    if (!stored) return DEFAULT_PREFERENCES;

    const value: unknown = JSON.parse(stored);
    const parsed = preferencesSchema.safeParse(value);
    if (parsed.success) return parsed.data;

    const legacy = legacyPreferencesSchema.safeParse(value);
    if (!legacy.success) return DEFAULT_PREFERENCES;
    return {
      theme: legacy.data.darkMode ? 'dark' : 'light',
      appLanguage: legacy.data.appLanguage,
      readerFontSize: { small: 12, medium: 14, large: 18 }[legacy.data.fontSize],
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(
  preferences: Preferences,
  storage: Pick<Storage, 'setItem'> = localStorage,
) {
  storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferencesSchema.parse(preferences)));
}

export function applyPreferences(
  preferences: Preferences,
  root: HTMLElement = document.documentElement,
  systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches,
) {
  root.dataset.theme =
    preferences.theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preferences.theme;
  root.style.setProperty('--reader-font-size', `${preferences.readerFontSize}px`);
  root.lang = preferences.appLanguage;
}
