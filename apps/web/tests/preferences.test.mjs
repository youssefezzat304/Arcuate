import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  applyPreferences,
  readPreferences,
  savePreferences,
} from '../src/lib/preferences.ts';

function createStorage(value = null) {
  const values = new Map(value === null ? [] : [[PREFERENCES_STORAGE_KEY, value]]);
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, next) {
      values.set(key, next);
    },
  };
}

test('preferences persist as a validated browser-local record', () => {
  const storage = createStorage();
  const preferences = { theme: 'system', appLanguage: 'de', readerFontSize: 18 };

  savePreferences(preferences, storage);

  assert.deepEqual(readPreferences(storage), preferences);
});

test('missing or invalid preferences safely use defaults', () => {
  assert.deepEqual(readPreferences(createStorage()), DEFAULT_PREFERENCES);
  assert.deepEqual(readPreferences(createStorage('not json')), DEFAULT_PREFERENCES);
  assert.deepEqual(
    readPreferences(
      createStorage(JSON.stringify({ theme: 'midnight', appLanguage: 'xx', readerFontSize: 48 })),
    ),
    DEFAULT_PREFERENCES,
  );
});

test('preferences are applied to the document root', () => {
  const properties = new Map();
  const root = {
    dataset: {},
    lang: '',
    style: {
      setProperty(key, value) {
        properties.set(key, value);
      },
    },
  };

  applyPreferences({ theme: 'system', appLanguage: 'fr', readerFontSize: 16 }, root, true);

  assert.deepEqual(root.dataset, { theme: 'dark' });
  assert.equal(root.lang, 'fr');
  assert.equal(properties.get('--reader-font-size'), '16px');
});

test('legacy display preferences migrate to the new model', () => {
  const storage = createStorage(
    JSON.stringify({ darkMode: true, appLanguage: 'en', fontSize: 'medium' }),
  );

  assert.deepEqual(readPreferences(storage), {
    theme: 'dark',
    appLanguage: 'en',
    readerFontSize: 14,
  });
});
