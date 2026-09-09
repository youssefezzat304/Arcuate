'use client';

import { useNotice } from '@/hooks/use-notice';
import { StatusNotice } from '@/components/status-notice';
import { useEffect, useRef, useState } from 'react';
import {
  emptyTimerHistory,
  formatDuration,
  readTimerHistory,
  saveTimerSession,
  timerStorageKey,
} from '@/lib/reading-timer';

const buttonClass =
  'min-h-10 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-40';

export function ReadingTimer({ textId }: { textId: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState(emptyTimerHistory);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useNotice();
  const accumulated = useRef(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    function load() {
      try {
        setHistory(readTimerHistory(textId));
        setError(null);
      } catch {
        setError(
          'Timer history could not be loaded. Check browser storage; existing records have been kept.',
        );
      }
      setReady(true);
    }
    function refresh(event: StorageEvent) {
      if (event.key === timerStorageKey(textId) || event.key === null) load();
    }
    load();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [textId]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setElapsed(
        accumulated.current +
          (startedAt.current === null ? 0 : performance.now() - startedAt.current),
      );
    }, 200);
    return () => window.clearInterval(interval);
  }, [running]);

  function pause() {
    accumulated.current += startedAt.current === null ? 0 : performance.now() - startedAt.current;
    startedAt.current = null;
    setElapsed(accumulated.current);
    setRunning(false);
    return accumulated.current;
  }

  function toggle() {
    setNotice(null);
    if (running) pause();
    else {
      startedAt.current = performance.now();
      setRunning(true);
    }
  }

  function reset() {
    accumulated.current = 0;
    startedAt.current = running ? performance.now() : null;
    setElapsed(0);
    setNotice(null);
  }

  function stop() {
    const duration = pause();
    if (duration < 1) return;
    try {
      setHistory(saveTimerSession(textId, duration));
      accumulated.current = 0;
      setElapsed(0);
      setError(null);
      setNotice('Session saved.');
    } catch {
      setError(
        'Could not save this session. It is paused; try Stop & save again when browser storage is available.',
      );
    }
  }

  return (
    <aside
      aria-label="Reading timer"
      className="mb-4 ml-auto w-full max-w-sm rounded-xl border border-border bg-paper p-4 text-foreground 2xl:fixed 2xl:top-8 2xl:right-5 2xl:z-10 2xl:w-60"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-lg">Reading timer</h2>
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-controls={collapsed ? undefined : `timer-${textId}`}
          aria-label={collapsed ? 'Expand reading timer' : 'Collapse reading timer'}
          onClick={() => setCollapsed(!collapsed)}
          className="flex size-9 items-center justify-center rounded-md hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span aria-hidden="true">{collapsed ? '+' : '−'}</span>
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span
          role="timer"
          aria-label="Elapsed reading time"
          className="font-mono text-2xl tabular-nums"
        >
          {formatDuration(elapsed)}
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${running ? 'bg-accent motion-safe:animate-pulse' : 'bg-muted-foreground'}`}
          />
          {running ? 'Running' : elapsed > 0 ? 'Paused' : 'Ready'}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!ready}
          onClick={toggle}
          className={`${buttonClass} flex-1 bg-accent text-accent-foreground hover:bg-accent`}
        >
          {running ? 'Pause' : elapsed > 0 || collapsed ? 'Resume' : 'Start'}
        </button>
        {!collapsed && (
          <>
            <button
              type="button"
              disabled={!ready || (!running && elapsed === 0)}
              onClick={reset}
              className={buttonClass}
            >
              Restart
            </button>
            <button
              type="button"
              disabled={!ready || (!running && elapsed === 0)}
              onClick={stop}
              className={`${buttonClass} w-full`}
            >
              Stop &amp; save
            </button>
          </>
        )}
      </div>
      {!collapsed && (
        <div id={`timer-${textId}`} className="mt-4 border-t border-border pt-3">
          <p className="flex justify-between gap-2 text-sm">
            <span>Best (shortest)</span>
            <span className="font-mono tabular-nums">
              {history.bestMs === null ? '—' : formatDuration(history.bestMs)}
            </span>
          </p>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent sessions
          </h3>
          {history.sessions.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Stop the timer to save a session for this reading.
            </p>
          ) : (
            <ol className="mt-2 max-h-56 overflow-y-auto divide-y divide-border">
              {history.sessions.map((session) => (
                <li key={session.id} className="flex justify-between gap-2 py-2 text-xs">
                  <time dateTime={session.stoppedAt} className="text-muted-foreground">
                    {new Date(session.stoppedAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                  <span className="font-mono tabular-nums">
                    {formatDuration(session.durationMs)}
                  </span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Restart clears the current timer. Completed sessions stay saved in this browser.
          </p>
        </div>
      )}
      <StatusNotice message={notice} />
      {error && (
        <p role="alert" className="mt-3 text-xs leading-5">
          {error}
        </p>
      )}
    </aside>
  );
}
