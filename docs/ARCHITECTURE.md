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
    └─ no  → rewrite

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

## Current generation and storage

`POST /api/texts` validates topic, supported language, CEFR level, and length with
Zod. It calls `@arcuate/ai` server-side, which uses the Google GenAI SDK's
Generate Content API with structured JSON output. The browser
never receives the API key. The `@arcuate/ai/schema` export contains only the
shared output schema, so client code does not import the provider SDK.

The browser saves each validated response under `arcuate:text:v1:<uuid>` in
localStorage before opening `/texts/[id]`. Records contain the title, paragraphs,
settings, actual character count, and creation time. `/texts` lists these records.
Per-record keys avoid replacing the whole library during concurrent tab writes.
Corrupt records are reported and retained; storage failures allow retrying the
save without another generation request. Clearing site data removes the library.

The CEFR validation/rewrite pipeline above remains planned. Current levels and
character counts are prompt targets; `Intl.Segmenter` with grapheme granularity measures the returned body, including spaces and paragraph breaks but excluding the title. Counts are derived on validation, so older word-count records remain readable. Reader formatting remains session-only. Authentication, cloud
persistence, translation, and distributed abuse controls remain unimplemented.

## Local setup and verification

Use Node.js 22.18+ (native TypeScript stripping for tests) and the repository's
pnpm version. Run `pnpm install`, then put `GEMINI_API_KEY` in
`apps/web/.env.local`. Optionally set `GEMINI_MODEL`; the default is
`gemini-3.6-flash`. Restart `pnpm dev` after changing environment configuration.
Keep the project on Gemini's free tier if zero API charges are required; quota
exhaustion is shown as an error, with no automatic retries or paid fallback.

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
text ID/title, UUID, and creation time. The reader captures the selection before
opening a native modal dialog, which supports selecting a list or creating and
saving atomically. Duplicate words are compared using Unicode NFC and
language-aware case folding within each list. Storage failures are surfaced;
invalid records are retained and reported. Lists refresh on cross-tab storage
events. `/saved-words` displays the library; `/settings` is a placeholder.

The Gemini master prompt is maintained separately in `packages/ai/src/prompt.ts`
and imported by the provider in `packages/ai/src/index.ts`.
