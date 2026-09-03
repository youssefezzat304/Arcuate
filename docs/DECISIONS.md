[SNAPSHOT]

- 2026-09-03 [CODE] Goal: build a small functional MVP for an AI-powered graded reader.
- 2026-09-03 [CODE] Current state: the pnpm/Turborepo workspace contains one Next.js application at `apps/web`.
- 2026-09-03 [CODE] Current state: the topic composer captures target language, CEFR level, optional translation language, and text length.
- 2026-09-03 [CODE] Now: define and validate the generation request contract represented by the initial form.
- 2026-09-03 [CODE] Next: connect the composer to deterministic mock generation and add the reader view.
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

[PROGRESS]

- 2026-09-03 [CODE] Consolidated workspace ownership at the repository root.
- 2026-09-03 [CODE] Added repository-wide and web-workspace typecheck commands.
- 2026-09-03 [CODE] Removed the runtime build dependency on Google-hosted fonts.
- 2026-09-03 [CODE] Replaced the default Next.js page with a flat, retro-editorial Arcuate topic-composer interface.
- 2026-09-03 [CODE] Added typed catalogs for supported languages and all six CEFR levels.
- 2026-09-03 [CODE] Added optional translation-language and three-choice text-length controls to the composer.

[DISCOVERIES]

- 2026-09-03 [TOOL] The initial lint command passed.
- 2026-09-03 [TOOL] The initial production build failed because `next/font` could not fetch Geist from Google Fonts.
- 2026-09-03 [CODE] The planned `packages/ai` and `packages/cefr` workspaces do not exist yet.
- 2026-09-03 [CODE] Zod and shadcn/ui are documented as stack choices but are not installed yet.
- 2026-09-03 [TOOL] Current OpenAI models advertise multilingual capability, while Google publishes an explicit language list for Gemini; neither establishes equal graded-reading quality across languages.

[OUTCOMES]

- 2026-09-03 [CODE] Repository foundation stabilized with one pnpm workspace and lockfile, deterministic fonts, and lint, typecheck, and build verification.
- 2026-09-03 [CODE] Initial Arcuate input experience completed with a topic field, language selector, and six-level CEFR selector; generation remains intentionally unimplemented.
- 2026-09-03 [CODE] Composer settings now cover the four core generation dimensions requested so far; generation remains intentionally unimplemented.

[WORKING SET]

- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `turbo.json`
- `apps/web/package.json`
- `apps/web/README.md`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/page.tsx`
- `apps/web/src/lib/supported-languages.ts`
- `docs/DECISIONS.md`

[RECEIPTS]

- 2026-09-03 [TOOL] `pnpm lint` passed before foundation changes.
- 2026-09-03 [TOOL] `pnpm build` failed before foundation changes because Google Fonts was unavailable.
- 2026-09-03 [TOOL] `pnpm install` recognized both workspace projects and confirmed the root lockfile was current.
- 2026-09-03 [TOOL] Only root `pnpm-workspace.yaml` and `pnpm-lock.yaml` files remain after consolidation.
- 2026-09-03 [TOOL] `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed after foundation changes.
- 2026-09-03 [TOOL] `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed for the initial composer interface.
- 2026-09-03 [TOOL] `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed after adding translation and length settings.
