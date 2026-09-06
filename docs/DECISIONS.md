[SNAPSHOT]

- 2026-09-03 [CODE] Goal: build a small functional MVP for an AI-powered graded reader.
- 2026-09-03 [CODE] Current state: the pnpm/Turborepo workspace contains one Next.js application at `apps/web`.
- 2026-09-03 [CODE] Current state: submitting the validated composer creates a UUID and opens a dynamic reader route backed by deterministic mock content.
- 2026-09-06 [CODE] Now: the reader supports session-only selection formatting for its title and paragraphs.
- 2026-09-03 [CODE] Next: replace mock creation with provider-backed generation and persistent text records.
- 2026-09-03 [USER] Open question: select the first LLM provider before real generation is implemented.
- 2026-09-03 [CODE] Open question: select a test runner when the first automated tests are added.

[DECISIONS]

D001 ACTIVE — 2026-09-03 [USER]
Use the repository root as the only pnpm workspace and lockfile owner.
Reason: a single workspace definition keeps dependency resolution and CI installation deterministic.

D002 ACTIVE — 2026-09-03 [USER]
Use system font stacks for the initial application.
Reason: the MVP does not require custom typography, and system fonts keep local and CI builds independent of remote font services.

D003 ACTIVE — 2026-09-03 [USER]
Add a TypeScript typecheck command now and defer the test command until a test runner is selected.
Reason: a placeholder test command could report success without exercising application behavior.

D004 ACTIVE — 2026-09-03 [USER]
Start the product experience with a chat-style topic composer and place target-language and CEFR-level settings directly beneath it.
Reason: this exposes the core generation inputs without introducing secondary MVP controls prematurely.

D005 ACTIVE — 2026-09-03 [ASSUMPTION]
Use a conservative, provider-neutral language catalog until the first LLM provider is selected and evaluated.
Reason: multilingual capability and output quality vary by model even when a provider accepts a language.

D006 ACTIVE — 2026-09-03 [USER]
Use the retro-editorial visual direction and semantic palette defined in `docs/STYLE.md`.
Reason: Arcuate should feel like a calm printed reading product rather than a generic SaaS or AI interface.

D007 ACTIVE — 2026-09-03 [USER]
Include optional translation language and short, medium, or long text length in the initial composer settings.
Reason: these are core generation inputs in the MVP flow.

D008 ACTIVE — 2026-09-03 [USER]
Assign each newly created text an opaque UUID and expose it at `/texts/[id]`.
Reason: stable identifiers support direct navigation now and persisted, shareable text records later without coupling identity to mutable titles.

D009 ACTIVE — 2026-09-06 [USER]
Show a reader selection toolbar with only highlight, bold, italic, underline, and text color controls. Place it above the selection unless the selection starts in the top 25% of the viewport, in which case place it below.
Reason: support focused text annotation while reading.

[PROGRESS]

- 2026-09-03 [CODE] Consolidated workspace ownership at the repository root.
- 2026-09-03 [CODE] Added repository-wide and web-workspace typecheck commands.
- 2026-09-03 [CODE] Removed the runtime build dependency on Google-hosted fonts.
- 2026-09-03 [CODE] Replaced the default Next.js page with a flat, retro-editorial Arcuate topic-composer interface.
- 2026-09-03 [CODE] Added typed catalogs for supported languages and all six CEFR levels.
- 2026-09-03 [CODE] Added optional translation-language and three-choice text-length controls to the composer.
- 2026-09-03 [CODE] Added a validated Server Action that creates UUID-based mock text routes.
- 2026-09-03 [CODE] Added Enter-to-submit and Shift+Enter-to-newline composer behavior.
- 2026-09-03 [CODE] Added an editorial reader view that renders the mock title and paragraph content.

[DISCOVERIES]

- 2026-09-03 [TOOL] The initial lint command passed.
- 2026-09-03 [TOOL] The initial production build failed because `next/font` could not fetch Geist from Google Fonts.
- 2026-09-03 [CODE] The planned `packages/ai` and `packages/cefr` workspaces do not exist yet.
- 2026-09-03 [CODE] Zod and shadcn/ui are documented as stack choices but are not installed yet.
- 2026-09-03 [TOOL] Current OpenAI models advertise multilingual capability, while Google publishes an explicit language list for Gemini; neither establishes equal graded-reading quality across languages.
- 2026-09-03 [TOOL] Next.js route-aware helpers require `next typegen` before standalone TypeScript checks on a clean or stale build tree.

[OUTCOMES]

- 2026-09-06 [CODE] Added selection formatting with muted highlight/text palettes, composable styles, and viewport-relative placement. Formatting lives in client state and resets on reload; no persistence or dependencies were added.

- 2026-09-03 [CODE] Repository foundation stabilized with one pnpm workspace and lockfile, deterministic fonts, and lint, typecheck, and build verification.
- 2026-09-03 [CODE] Initial Arcuate input experience completed with a topic field, language selector, and six-level CEFR selector; generation remains intentionally unimplemented.
- 2026-09-03 [CODE] Composer settings now cover the four core generation dimensions requested so far; generation remains intentionally unimplemented.
- 2026-09-03 [CODE] The deterministic mock flow now simulates text creation and reading with a unique route per submission; persistence and LLM generation remain intentionally unimplemented.

[WORKING SET]

- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/actions.ts`
- `apps/web/src/app/texts/[id]/page.tsx`
- `apps/web/src/components/formattable-reader.tsx`
- `apps/web/src/lib/text-formatting.ts`
- `apps/web/src/lib/mock-text.ts`
- `apps/web/src/lib/reading-settings.ts`
- `docs/DECISIONS.md`

[RECEIPTS]

- 2026-09-03 [TOOL] `pnpm lint` passed before foundation changes.
- 2026-09-03 [TOOL] `pnpm build` failed before foundation changes because Google Fonts was unavailable.
- 2026-09-03 [TOOL] `pnpm install` recognized both workspace projects and confirmed the root lockfile was current.
- 2026-09-03 [TOOL] Only root `pnpm-workspace.yaml` and `pnpm-lock.yaml` files remain after consolidation.
- 2026-09-03 [TOOL] `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed after foundation changes.
- 2026-09-03 [TOOL] `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed for the initial composer interface.
- 2026-09-03 [TOOL] `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed after adding translation and length settings.
- 2026-09-03 [TOOL] A valid composer POST returned `303` to a newly generated UUID route; the route returned the mock title and content.
- 2026-09-03 [TOOL] Valid UUID reader routes returned `200`; malformed IDs returned `404`.
- 2026-09-03 [TOOL] `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed for the mock creation-to-reader flow.

- 2026-09-06 [TOOL] Selection toolbar: lint, typecheck, and build passed; browser checks verified five formatting actions and above/below placement. Node assertions verified cross-paragraph and overlapping formatting, partial toggles, and highlight removal.
