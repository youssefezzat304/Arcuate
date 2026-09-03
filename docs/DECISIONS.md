[SNAPSHOT]

- 2026-09-03 [CODE] Goal: build a small functional MVP for an AI-powered graded reader.
- 2026-09-03 [CODE] Current state: the pnpm/Turborepo workspace contains one Next.js application at `apps/web`.
- 2026-09-03 [CODE] Current state: the web application is still based on the default Next.js starter page.
- 2026-09-03 [CODE] Now: define the validated generation contract and build the form-to-reader vertical slice.
- 2026-09-03 [CODE] Next: implement the MVP flow with deterministic mock generation before connecting an LLM provider.
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

[PROGRESS]

- 2026-09-03 [CODE] Consolidated workspace ownership at the repository root.
- 2026-09-03 [CODE] Added repository-wide and web-workspace typecheck commands.
- 2026-09-03 [CODE] Removed the runtime build dependency on Google-hosted fonts.

[DISCOVERIES]

- 2026-09-03 [TOOL] The initial lint command passed.
- 2026-09-03 [TOOL] The initial production build failed because `next/font` could not fetch Geist from Google Fonts.
- 2026-09-03 [CODE] The planned `packages/ai` and `packages/cefr` workspaces do not exist yet.
- 2026-09-03 [CODE] Zod and shadcn/ui are documented as stack choices but are not installed yet.

[OUTCOMES]

- 2026-09-03 [CODE] Repository foundation stabilized with one pnpm workspace and lockfile, deterministic fonts, and lint, typecheck, and build verification.

[WORKING SET]

- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `turbo.json`
- `apps/web/package.json`
- `apps/web/README.md`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/globals.css`
- `docs/DECISIONS.md`

[RECEIPTS]

- 2026-09-03 [TOOL] `pnpm lint` passed before foundation changes.
- 2026-09-03 [TOOL] `pnpm build` failed before foundation changes because Google Fonts was unavailable.
- 2026-09-03 [TOOL] `pnpm install` recognized both workspace projects and confirmed the root lockfile was current.
- 2026-09-03 [TOOL] Only root `pnpm-workspace.yaml` and `pnpm-lock.yaml` files remain after consolidation.
- 2026-09-03 [TOOL] `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed after foundation changes.
