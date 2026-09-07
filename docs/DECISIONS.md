[SNAPSHOT]

- 2026-09-03 [CODE] Goal: build a small functional MVP for an AI-powered graded reader.
- 2026-09-06 [CODE] Current state: Next.js at `apps/web` and provider/structured generation in `packages/ai`.
- 2026-09-06 [CODE] Current state: Gemini generation replaces mock content; validated texts are saved in browser localStorage and listed in My texts.
- 2026-09-07 [CODE] Now: the reader supports formatting and word bookmarks; Settings provides browser-local display preferences.
- 2026-09-06 [CODE] Next: evaluate generated language, level, and length quality; authentication/cloud storage remain deferred.
- 2026-09-06 [USER] Provider: Gemini; short/medium/long request 2,000/4,000/5,500 characters with no translation.
- 2026-09-06 [CODE] Tests: Node built-in runner with native TypeScript stripping (Node 22.18+).

[DECISIONS]

D001 ACTIVE — 2026-09-03 [USER]
Use the repository root as the only pnpm workspace and lockfile owner.
Reason: a single workspace definition keeps dependency resolution and CI installation deterministic.

D002 ACTIVE — 2026-09-03 [USER]
Use system font stacks for the initial application.
Reason: the MVP does not require custom typography, and system fonts keep local and CI builds independent of remote font services.

D003 SUPERSEDED BY D012 — 2026-09-03 [USER]
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

D007 SUPERSEDED BY D011 — 2026-09-03 [USER]
Include optional translation language and short, medium, or long text length in the initial composer settings.
Reason: these are core generation inputs in the MVP flow.

D008 ACTIVE — 2026-09-03 [USER]
Assign each newly created text an opaque UUID and expose it at `/texts/[id]`.
Reason: stable identifiers support direct navigation now and persisted, shareable text records later without coupling identity to mutable titles.

D009 SUPERSEDED BY D014 — 2026-09-06 [USER]
Show a reader selection toolbar with only highlight, bold, italic, underline, and text color controls. Place it above the selection unless the selection starts in the top 25% of the viewport, in which case place it below.
Reason: support focused text annotation while reading.

D010 ACTIVE — 2026-09-06 [USER]
Provide a floating collapsible sidebar with New text, My texts, and Login at the bottom. Move the Arcuate wordmark inside it and display A when collapsed.
Reason: establish navigation for a personal reading library. Guest texts should eventually be stored on-device and account texts in the cloud; authentication and persistence are outside the current sidebar task. The guest storage mechanism remains undecided (localStorage is a candidate).

D011 SUPERSEDED BY D013 — 2026-09-06 [USER]
Use Gemini for target-language and CEFR-controlled generation. Request 2,000 words for short, 4,000 for medium, and 5,500 for long. Defer translation. Store guest texts locally and reopen them through My texts.

D012 ACTIVE — 2026-09-06 [CODE]
Use Node's built-in test runner with native TypeScript stripping for input, storage, and provider tests. Keep provider tests mocked and API secrets server-side. AI package source is checked through the consuming web workspace.

D013 ACTIVE — 2026-09-06 [USER]
Use character targets instead of word targets: short 2,000, medium 4,000, long 5,500. Other generation settings remain unchanged.
2026-09-06 [CODE] Count Unicode grapheme clusters including spaces, punctuation, and paragraph breaks, excluding the title. Derive counts from saved bodies to keep existing records readable.

D014 ACTIVE — 2026-09-07 [USER]
Extend the selection toolbar with a bookmark button that saves a word into an existing or newly created list. Keep its formatting controls and above/below placement rule. Add Saved words and Settings navigation.
2026-09-07 [CODE] Lists persist in browser localStorage; duplicate text/language entries within one list are suppressed. Settings is a placeholder until preferences are specified.

D015 ACTIVE — 2026-09-07 [USER]
Provide Settings preferences for dark mode, app language, and font size.
2026-09-07 [USER] Appearance supports light, dark, and system. Font size controls reader body text in pixels and defaults to 14px rather than scaling the full interface.
2026-09-07 [CODE] Preferences persist in browser localStorage. System appearance follows live device changes; app language updates the document language while translated interface copy remains deferred.

[PROGRESS]

- 2026-09-07 [CODE] Replaced the Settings placeholder with persistent three-mode appearance, app language, and numeric reader font-size preferences.
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

- 2026-09-06 [TOOL] Model listing included Gemini 2.5 Flash, but generation rejected it for new users and recommended Gemini 3.6 Flash. Default updated to 3.6 Flash; GEMINI_MODEL remains configurable.

- 2026-09-03 [TOOL] The initial lint command passed.
- 2026-09-03 [TOOL] The initial production build failed because `next/font` could not fetch Geist from Google Fonts.
- 2026-09-06 [CODE] `packages/ai` now exists; the CEFR evaluation package remains planned.
- 2026-09-06 [CODE] Zod is installed; shadcn/ui remains a planned stack choice.
- 2026-09-03 [TOOL] Current OpenAI models advertise multilingual capability, while Google publishes an explicit language list for Gemini; neither establishes equal graded-reading quality across languages.
- 2026-09-03 [TOOL] Next.js route-aware helpers require `next typegen` before standalone TypeScript checks on a clean or stale build tree.

[OUTCOMES]

- 2026-09-07 [CODE] Added validated browser-local preferences with an accessible Settings interface, system-aware dark theme, and reader-only pixel sizing.
- 2026-09-07 [CODE] Added word bookmarking with list creation/selection, local persistence, source-text links, and Saved words/Settings routes. Preserved the user’s separate Gemini master prompt file.

- 2026-09-06 [CODE] Completed Gemini generation, local per-text persistence, library listing, saved reader loading, pending/error UI, and save retry. Translation removed from current inputs; exact word count and CEFR enforcement remain deferred.

- 2026-09-06 [CODE] Added the shared responsive sidebar, active navigation, and `/texts` placeholder. Desktop collapse survives client navigation; mobile starts collapsed and expands over content. Login is disabled and marked coming soon.

- 2026-09-06 [CODE] Added selection formatting with muted highlight/text palettes, composable styles, and viewport-relative placement. Formatting lives in client state and resets on reload; no persistence or dependencies were added.

- 2026-09-03 [CODE] Repository foundation stabilized with one pnpm workspace and lockfile, deterministic fonts, and lint, typecheck, and build verification.
- 2026-09-03 [CODE] Initial Arcuate input experience completed with a topic field, language selector, and six-level CEFR selector; generation remains intentionally unimplemented.
- 2026-09-03 [CODE] Composer settings now cover the four core generation dimensions requested so far; generation remains intentionally unimplemented.
- 2026-09-03 [CODE] The deterministic mock flow now simulates text creation and reading with a unique route per submission; persistence and LLM generation remain intentionally unimplemented.

[WORKING SET]

- `apps/web/src/app/globals.css`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/settings/page.tsx`
- `apps/web/src/components/preferences-section.tsx`
- `apps/web/src/lib/preferences.ts`
- `apps/web/tests/preferences.test.mjs`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`

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
- 2026-09-06 [TOOL] Sidebar verification: `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed. Browser checks confirmed desktop collapse, My texts navigation, mobile expansion/Escape dismissal, and readable composer settings at a 390px viewport.

- 2026-09-06 [TOOL] Gemini integration: seven Node tests, lint, typecheck, and build passed. Live German A2 short request returned 2,194 words; browser verified saving, reload, library listing, and reopening. Client build scan found no API key.

- 2026-09-06 [TOOL] Character-length update: nine tests, lint, typecheck, and build passed. Tests cover Unicode grapheme counting and compatibility with existing saved word-count records.

- 2026-09-07 [TOOL] Bookmarking: all 14 tests, lint, typecheck, and build passed. Browser verified list creation, adding a second word to an existing list, reopening the saved list in a new tab, and Settings navigation.
- 2026-09-07 [TOOL] Preferences: all 18 tests, lint, typecheck, and build passed. Browser verified three appearance choices, a 14px default, and persisted system/18px selections after reload.
