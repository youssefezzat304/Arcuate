'use client';

import { useEffect, useState } from 'react';
import { readWordList, SAVED_WORDS_CHANGED_EVENT, type WordList } from '@/lib/saved-words';
import { WordListSection } from '@/components/word-list-section';

type ListState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; list: WordList };

export function SavedWordList({ id }: { id: string }) {
  const [state, setState] = useState<ListState>({ status: 'loading' });
  useEffect(() => {
    function load() {
      try {
        setState({ status: 'ready', list: readWordList(id) });
      } catch {
        setState({ status: 'error' });
      }
    }
    load();
    window.addEventListener('storage', load);
    window.addEventListener(SAVED_WORDS_CHANGED_EVENT, load);
    return () => {
      window.removeEventListener('storage', load);
      window.removeEventListener(SAVED_WORDS_CHANGED_EVENT, load);
    };
  }, [id]);

  if (state.status === 'loading') return <p role="status">Loading your word list…</p>;
  if (state.status === 'error')
    return (
      <p role="alert">
        This list could not be opened. It may have been deleted, saved in another browser, or
        browser storage may be unavailable.
      </p>
    );
  return <WordListSection list={state.list} />;
}
