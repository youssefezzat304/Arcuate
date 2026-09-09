# Architecture

## Generation

apps/web
↓
Next.js route handler
↓
packages/ai
↓
LLM provider

## Validation

LLM output
↓
packages/cefr
↓
valid
├─ yes → return
└─ no → rewrite

## Package boundaries

### packages/ai

Responsible for:

- prompts
- providers
- structured generation

Must not contain:

- React UI
- database logic

### packages/cefr

Responsible for:

- vocabulary analysis
- grammar analysis
- readability
- CEFR scoring

Must not depend on a particular LLM provider.

### packages/language

Responsible for:

- validated token, lexeme, and text-analysis types
- locale-aware exact tokenization and normalization
- provider-neutral analyzer, translation, and pronunciation contracts
- the optional Stanza HTTP adapter

Must not contain React UI, persistence, or provider credentials.

## Language analysis

Generated paragraphs are analyzed before they are returned. By default,
`Intl.Segmenter` supplies word/sentence boundaries and UTF-16 offsets with an
identity lemma. If `LANGUAGE_ANALYZER_URL` is configured, the server calls the
private Stanza service for tokenization, multi-word expansion, POS, morphology,
and lemmatization; failures fall back to exact analysis and never fail text
generation.

Analysis is stored with each text as compact paragraph-relative offsets and
lexemes. Stored analysis is checked against the language, paragraph count, and
text bounds before use. Legacy text records receive exact analysis on first read
and are upgraded in localStorage when possible. When Stanza becomes available,
the reader can enrich exact-analyzed records through `POST /api/language/analyze`
without delaying their initial render.

`services/language` is an optional private Python sidecar. It caches up to eight
Stanza language pipelines, loads only tokenize/MWT/POS/lemma processors, limits
request size, and converts Python character indices to JavaScript UTF-16 offsets.
It binds to localhost by default and is not exposed directly to browsers.

## Current generation and storage

`POST /api/texts` validates topic, supported language, CEFR level, and length with
Zod. It calls `@arcuate/ai` server-side, which uses the Google GenAI SDK's
Generate Content API with structured JSON output. The browser
never receives the API key. The `@arcuate/ai/schema` export contains only the
shared output schema, so client code does not import the provider SDK.

The browser saves each validated response under `arcuate:text:v1:<uuid>` in
localStorage before opening `/texts/[id]`. Records contain the title, paragraphs,
settings, actual character count, creation time, and validated formatting
annotations represented as text offsets plus semantic style values. `/texts` lists these records.
Per-record keys avoid replacing the whole library during concurrent tab writes.
Corrupt records are reported and retained; storage failures allow retrying the
save without another generation request. Clearing site data removes the library.

The CEFR validation/rewrite pipeline above remains planned. Current levels and
character counts are prompt targets; `Intl.Segmenter` with grapheme granularity measures the returned body, including spaces and paragraph breaks but excluding the title. Counts are derived on validation, so older word-count records remain readable. Reader formatting is stored per text in localStorage and restored from validated offset annotations. Clearing annotations writes an empty annotation set without changing saved-word records or their independent rendering overlay. Selection formatting supports Control-key shortcuts for bold, last-color highlighting, underline, and strikethrough; shortcut handling is scoped to active reader selections. Authentication, cloud persistence, and distributed abuse controls remain unimplemented.

## Local setup and verification

Use Node.js 22.18+ (native TypeScript stripping for tests) and the repository's
pnpm version. Run `pnpm install`, then put `GEMINI_API_KEY` in
`apps/web/.env.local`. Optionally set `GEMINI_MODEL`; the default is
`gemini-3.6-flash`. Restart `pnpm dev` after changing environment configuration.
Keep the project on Gemini's free tier if zero API charges are required; quota
exhaustion is shown as an error, with no automatic retries or paid fallback.

For lemma-aware matching, follow `services/language/README.md` to install Stanza
in an isolated Python environment and download only the intended language
models, then set `LANGUAGE_ANALYZER_URL`. Without it, the application remains
fully usable with exact-token matching.

Generation has a four-minute provider timeout and a five-minute route budget;
a deployed host must permit that duration. The current local implementation is
not a production rate limiter. The SDK's optional install scripts are disabled
in pnpm because this HTTP generation path does not require them.

Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` from the root.
Tests use Node's built-in runner and mocked provider responses, never real keys.
The web TypeScript/build checks also check the imported AI package source.

## Word bookmarks

`apps/web/src/lib/saved-words.ts` validates and persists one record per list under
`arcuate:word-list:v1:<uuid>`. Entries contain the selected text, language, source
text ID/title, UUID, creation time, normalized text, and optional lemma/POS
identity derived from the source analysis. The reader captures the selection before
opening a native modal dialog, which supports selecting a list or creating and
saving atomically. Duplicate words are compared using Unicode NFC and
language-aware case folding within each list. Storage failures are surfaced;
invalid records are retained and reported. Lists refresh on cross-tab storage
events, and an app event updates the current reader immediately.
`apps/web/src/lib/saved-word-matching.ts` matches complete tokens by language and
lemma/POS when available, otherwise by normalized surface form. The reader
overlays semantic saved-word spans without mutating session-only formatting.
`/saved-words` links to dedicated `/saved-words/[id]` pages. Each page loads its
validated list from browser storage and refreshes on vocabulary and storage events.

## Preferences

`/settings` stores one validated record under `arcuate:preferences:v1` in
localStorage. Light/dark appearance is applied through a data attribute on the
document root; system mode follows `prefers-color-scheme`, including live device
changes. Reader body-text size is stored as pixels and applied through the
`--reader-font-size` custom property without scaling the surrounding interface.
App language updates the root `lang` attribute; interface translations remain
future work. Invalid stored records fall back to defaults, and the original
boolean/theme-size record shape is migrated when read.

The Gemini master prompt is maintained separately in `packages/ai/src/prompt.ts`
and imported by the provider in `packages/ai/src/index.ts`.

## Reading timer

`apps/web/src/lib/reading-timer.ts` validates per-reading timer history stored at
`arcuate:timer:v1:<uuid>`. Stop saves a positive duration, timestamp, and session
UUID, retaining ten recent records plus the all-time shortest duration. The
widget measures active intervals with `performance.now()` so delayed rendering
does not slow the stopwatch. Pause excludes inactive time; the active timer is
component-local. Storage failures preserve the paused session for another save
attempt, and invalid histories are reported without overwriting them.

## Bilingual generation and contextual lookups

When `translationLanguage` is supplied, `packages/ai` requests a translated title
and paragraphs of source/translation sentence pairs in the same Gemini response.
Code assembles canonical source paragraphs and computes UTF-16 sentence offsets;
the model does not generate offsets. Saved records optionally contain
`translation: { language, title, paragraphs: [{ sentences: [{ start, end, text }] }] }`.
Validation requires complete, ordered alignment and matching translation language.
Legacy records can omit translation. Source counts and annotations remain attached
to the original text. The reader keeps hidden original runs while showing translated
spans, excludes translation/metadata from selection offsets, and rejects annotation
selections crossing a revealed translation.

`POST /api/words/explain` validates the selected surface against its offsets in a
bounded source paragraph, language pair, and CEFR level. `packages/ai` owns the
Flash-Lite prompt and structured output for meaning, context, grammar, and three
translated examples. `GEMINI_LOOKUP_MODEL` defaults to `gemini-3.5-flash-lite` and
uses the existing server-only `GEMINI_API_KEY`. No dictionary or local model is used.

Lookups have a 30-second provider timeout, a 35-second client timeout, no automatic
retries, and a bounded output. Closing or changing a popover aborts the browser
request and suppresses stale results; provider work already started may continue.
Browser memory caches 100 contextual results. The server process caches 100 results
for 30 minutes, keyed by input, model, and prompt version, and limits work to four
concurrent calls and 60 uncached requests per minute. These limits are local to one
process, not production authentication or distributed abuse prevention. Cache hits
never reuse an explanation solely because the surface word matches.
