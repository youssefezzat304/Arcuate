[SNAPSHOT]

- 2026-09-03 [CODE] Goal: build a small functional MVP for an AI-powered graded reader.
- 2026-09-06 [CODE] Current state: Next.js at `apps/web` and provider/structured generation in `packages/ai`.
- 2026-09-06 [CODE] Current state: Gemini generation replaces mock content; validated texts are saved in browser localStorage and listed in My texts.
- 2026-09-07 [CODE] Now: saved words are recognized across readings, reader annotations persist per text, and Settings provides browser-local display preferences.
- 2026-09-06 [CODE] Next: evaluate generated language, level, and length quality; authentication/cloud storage remain deferred.
- 2026-09-08 [CODE] Provider: Gemini generation with optional aligned translations; Flash-Lite supplies contextual word explanations.
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

D013 SUPERSEDED BY D019 — 2026-09-06 [USER]
Use character targets instead of word targets: short 2,000, medium 4,000, long 5,500. Other generation settings remain unchanged.
2026-09-06 [CODE] Count Unicode grapheme clusters including spaces, punctuation, and paragraph breaks, excluding the title. Derive counts from saved bodies to keep existing records readable.

D014 ACTIVE — 2026-09-07 [USER]
Extend the selection toolbar with a bookmark button that saves a word into an existing or newly created list. Keep its formatting controls and above/below placement rule. Add Saved words and Settings navigation.
2026-09-07 [CODE] Lists persist in browser localStorage; duplicate text/language entries within one list are suppressed. Settings is a placeholder until preferences are specified.

D015 ACTIVE — 2026-09-07 [USER]
Provide Settings preferences for dark mode, app language, and font size.
2026-09-07 [USER] Appearance supports light, dark, and system. Font size controls reader body text in pixels and defaults to 14px rather than scaling the full interface.
2026-09-07 [CODE] Preferences persist in browser localStorage. System appearance follows live device changes; app language updates the document language while translated interface copy remains deferred.

D016 ACTIVE — 2026-09-07 [USER]
Use a versioned token record as the shared foundation for saved-word recognition and future contextual translation, pronunciation, grammar, and vocabulary features.
2026-09-07 [CODE] `packages/language` owns provider-neutral token/lexeme schemas and contracts. Locale-aware exact analysis is always available; an optional private Stanza service adds lemma/POS/morphology data without coupling it to the reader.
Reason: one validated offset-based representation prevents separate, conflicting text parsing implementations for each language feature.

D017 ACTIVE — 2026-09-07 [USER]
Add Control-key shortcuts for bold, last-color highlighting, underline, and strikethrough. Keep the selection toolbar black in every appearance mode and use deeper, muted annotation colors in dark mode.
2026-09-07 [CODE] Shortcuts act only on an active reader selection and do not intercept editable form controls. The last highlight choice is retained for the current reader session.
Reason: frequent formatting actions should remain fast while annotations stay legible against both light and dark reading surfaces.

D018 ACTIVE — 2026-09-07 [USER]
Persist highlights and text styles with each saved reading in browser localStorage. Provide a top-of-reading action that clears all annotations only after confirmation while preserving saved-word styling.
2026-09-07 [CODE] Persist validated offset/style records rather than formatted text copies. Legacy readings default to an empty annotation set; saved-word styling remains a separately computed vocabulary overlay.
Reason: offsets keep generated text canonical and let annotation clearing avoid any mutation of saved vocabulary.

D019 ACTIVE — 2026-09-07 [USER]
Replace text-length presets with a slider from 2,000 to 20,000 characters in steps of 2,000.
2026-09-07 [CODE] Keep the 4,000-character default, validate numeric targets for new requests, and accept legacy presets only in saved records. Before replacement, code used 7,000 for long while documentation recorded 5,500.

D020 SUPERSEDED BY D021 — 2026-09-07 [USER]
Show saved-word lists collapsed to their names, opening on click. Provide Copy as Markdown, per-word removal, and list rename/delete actions.
2026-09-07 [CODE] Markdown exports the list heading and words with language codes. List deletion requires confirmation; removing the final word retains an empty list. Mutations notify the existing vocabulary subscribers.

D021 ACTIVE — 2026-09-07 [USER]
Open saved-word lists on dedicated `/saved-words/[id]` pages instead of expanding them inline. Retain list copy/rename/delete and word removal. Add Copy as Markdown beside Clear annotations on each reading.
2026-09-07 [CODE] Reading exports contain the original title and paragraphs, with literal Markdown escaped and annotations omitted. Successful list deletion returns to Saved words.

2026-09-07 [USER] List action menus are also available in the Saved words library, with in-place name editing. Reading language/level/character-count metadata appears below the title and is included in Markdown copies.
2026-09-07 [CODE] Metadata is excluded from annotation offsets and selection restoration to preserve saved formatting.

D022 ACTIVE — 2026-09-08 [USER]
Use the shared in-app confirmation dialog for list deletion and annotation clearing. Replace composer language/CEFR native selects with custom dropdowns. Add a bottom-right reader info button for shortcut help.
2026-09-08 [CODE] The guide and formatting handler share a shortcut registry for future additions; the guide lists only implemented shortcuts.

D023 ACTIVE — 2026-09-08 [USER]
Sidebar toggling must leave every page centered and stationary. Add a collapsible per-reading timer with start/pause, restart, stop/save, best time, and ten recent sessions.
2026-09-08 [ASSUMPTION] Best means the shortest completed session for that reading. Completed history persists locally; unfinished timer state lasts while the reading remains open.
2026-09-08 [CODE] Closed mobile navigation is a compact floating control; expanded navigation overlays the page.
2026-09-08 [CODE] The timer uses monotonic elapsed intervals, keeps all-time best beyond the recent-ten window, and falls above the article when the right margin is too narrow.

D024 ACTIVE — 2026-09-08 [USER]
Generate source text and selected-language translation in one Gemini response. Reveal sentence translations with a draggable circle; double-click changes to paragraph mode; single-click restores originals. Clicking a source word opens meaning, context, grammar, and three examples from Gemini Flash-Lite.
2026-09-08 [CODE] Source sentences are assembled into canonical paragraphs and translations use code-derived offsets. Bounded contextual caches, request limits, and server-only credentials support the first version. Existing texts remain readable; they use English for word explanations and need regeneration for aligned translations. No dictionary or local model is introduced.
2026-09-08 [USER] The circle is symbol-only and behaves like an inventory item: press and hold to move it, highlight the sentence or paragraph under it, reveal that target immediately on release, and return the circle home after every drop.

[PROGRESS]

- 2026-09-07 [CODE] Added exact and Stanza-backed language analysis, lazy text enrichment, linguistic saved-word identity, and reactive cross-text highlighting.
- 2026-09-07 [CODE] Added reader formatting shortcuts, strikethrough, a theme-invariant black toolbar, and dark-mode annotation colors.
- 2026-09-07 [CODE] Added validated per-text annotation persistence and confirmation-protected annotation clearing.
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

- 2026-09-08 [TOOL] Gemini 3.6 Flash rejected the bilingual structured-output schema with HTTP 400 when both nested array levels advertised `maxItems: 300`. Omitting provider-facing `maxItems` from the bilingual schema resolves the rejection; post-response Zod validation continues to enforce the limits.
- 2026-09-06 [TOOL] Model listing included Gemini 2.5 Flash, but generation rejected it for new users and recommended Gemini 3.6 Flash. Default updated to 3.6 Flash; GEMINI_MODEL remains configurable.

- 2026-09-03 [TOOL] The initial lint command passed.
- 2026-09-03 [TOOL] The initial production build failed because `next/font` could not fetch Geist from Google Fonts.
- 2026-09-06 [CODE] `packages/ai` now exists; the CEFR evaluation package remains planned.
- 2026-09-06 [CODE] Zod is installed; shadcn/ui remains a planned stack choice.
- 2026-09-03 [TOOL] Current OpenAI models advertise multilingual capability, while Google publishes an explicit language list for Gemini; neither establishes equal graded-reading quality across languages.
- 2026-09-03 [TOOL] Next.js route-aware helpers require `next typegen` before standalone TypeScript checks on a clean or stale build tree.

[OUTCOMES]

- 2026-09-07 [CODE] Highlights and text styles now survive reopening a reading. A disabled-when-empty action at the reading top clears them after confirmation and leaves saved-word styling intact.
- 2026-09-07 [CODE] Reader selections now support Ctrl+B bold, Ctrl+H last-color highlighting, Ctrl+U underline, and Ctrl+Y strikethrough. The toolbar remains black across themes, while highlight fills and text colors use dark-mode-specific muted variants.
- 2026-09-07 [CODE] Saved words now appear bold with a warm underline across same-language texts. Exact forms work without services; lemma-inflected forms activate when Stanza annotations are available.
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

- `apps/web/src/lib/saved-texts.ts`
- `apps/web/src/lib/saved-words.ts`
- `apps/web/src/lib/saved-word-matching.ts`
- `apps/web/src/lib/text-formatting.ts`
- `apps/web/src/components/clear-annotations-dialog.tsx`
- `apps/web/src/components/formattable-reader.tsx`
- `apps/web/src/components/saved-reader.tsx`
- `apps/web/tests/generation.test.mjs`
- `apps/web/tests/text-formatting.test.mjs`
- `docs/PRODUCT.md`

[RECEIPTS]

- 2026-09-09 [TOOL] Translation orb interaction: 47 tests, lint, typecheck, and production build passed. Browser checks verified symbol-only sentence/paragraph modes, automatic translation on drop, single-click restore, and return-to-home after both sentence and paragraph drops.
- 2026-09-08 [TOOL] Bilingual generation fix: 47 tests, lint, typecheck, and production build passed. Lint retained one pre-existing unused-variable warning in `translation.test.mjs`. A live Gemini request returned three source paragraphs with three aligned translation paragraphs.
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
- 2026-09-07 [TOOL] Language analysis: 23 tests, lint, typecheck, and build passed; Python service syntax parsed. Browser verified legacy text upgrade and saved exact forms styled across repeated title/body occurrences.
- 2026-09-07 [TOOL] Formatting shortcuts: all 25 tests, lint, typecheck, build, and diff validation passed. Browser accessibility checks confirmed Ctrl+B and Ctrl+Y state changes; visual checks confirmed the fixed black toolbar, muted dark palettes, and saved dark mode after a direct reader load.
- 2026-09-07 [TOOL] Annotation persistence: all 27 tests, lint, typecheck, build, and diff validation passed. Browser verified annotate/reload, confirmation cancel/accept, persistent clearing, and preserved saved-word styling.
