# Arcuate — Codex Project Guidance

Arcuate is an AI-powered graded reader for language learners.

Users choose a topic, target language, CEFR level, text length, and optional translation language. The system generates reading material appropriate for the selected proficiency level.

This file defines the working agreements for Codex when operating in this repository.

---

# 1. Project goals

The current priority is to build a small, functional MVP before investing heavily in visual design or infrastructure.

The core MVP flow is:

1. User enters a topic.
2. User selects a target language.
3. User selects a CEFR level (`A1`–`C2`).
4. User selects text length.
5. User optionally selects a translation language.
6. The application generates a graded text.
7. The user reads the generated text in a clean reader interface.
8. Translation can be revealed where appropriate.

Future features may include:

- CEFR validation and automatic rewriting
- vocabulary explanations
- sentence-level explanations
- saved vocabulary
- user accounts
- saved texts
- sharing
- likes and social features
- browser-local inference through WebGPU
- alternative AI providers
- self-hosted inference

Do not prematurely implement future features unless explicitly requested.

---

# 2. Current technology stack

The repository uses:

- TypeScript
- pnpm workspaces
- Turborepo
- Next.js
- React
- Next.js App Router
- Tailwind CSS
- shadcn/ui
- Zod

Expected future technologies include:

- PostgreSQL
- Drizzle ORM
- cloud LLM APIs
- browser-local WebGPU inference

Do not introduce an alternative framework, package manager, styling system, ORM, or runtime without a clear reason and user approval.

---

# 3. Project context

Before making non-trivial changes, read the relevant project documentation:

- `docs/PRODUCT.md` — product goals, MVP scope, UX principles, and planned features.
- `docs/ARCHITECTURE.md` — repository structure, package responsibilities, technology choices, and system architecture.
- `docs/DECISIONS.md` — durable decisions and current implementation state.

Treat these files as the canonical sources of project-specific information.

Do not duplicate their contents in `AGENTS.md`.

If implementation and documentation disagree, inspect the code and flag the inconsistency rather than silently choosing one.

---

# 4. Code quality

## General rules

- Use TypeScript unless there is a strong technical reason not to.
- Prefer simple code over premature abstraction.
- Make the smallest safe change that solves the task.
- Preserve existing repository conventions.
- Avoid unrelated refactors.
- Avoid adding dependencies unless they materially simplify the implementation.
- Use existing dependencies and components where practical.
- Delete dead code created by the change.
- Do not leave commented-out implementations.
- Do not silently swallow errors.

## React

- Prefer Server Components where appropriate.
- Add `"use client"` only when client-side behavior is actually required.
- Keep business/domain logic outside presentation components.
- Prefer composition over large configurable components.
- Avoid unnecessary `useEffect`.
- Do not introduce global state management unless local/server state is insufficient.

## TypeScript

- Avoid `any` unless unavoidable and documented.
- Prefer explicit domain types.
- Prefer discriminated unions when modeling states.
- Do not duplicate types that can be inferred from Zod or existing APIs.

## Validation

Treat all external input as untrusted, including:

- HTTP requests
- LLM responses
- database data crossing trust boundaries
- URL parameters
- user-generated content

Use Zod where runtime validation is appropriate.

---

# 5. Dependencies

Before adding a dependency:

1. Check whether the capability already exists in the platform or current dependencies.
2. Prefer small, well-maintained libraries.
3. Check package compatibility with the current stack.
4. Avoid packages that duplicate existing functionality.
5. Explain meaningful new dependencies in the final response.

Use:

```bash
pnpm add <package>
```

for application dependencies.

Use:

```bash
pnpm add -D <package>
```

for development dependencies.

When targeting a workspace package, use pnpm workspace filtering rather than installing from the wrong directory where practical.

Do not use npm or yarn in this repository.

Commit `pnpm-lock.yaml`.

---

# 6. Commands and workspace usage

Run repository-wide commands from the workspace root unless the task specifically requires a package-level command.

Common commands include:

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
```

Use Turborepo-aware filtered commands when useful:

```bash
pnpm turbo build --filter=<workspace>
pnpm turbo lint --filter=<workspace>
```

Do not manually edit generated lockfile contents.

---

# 7. Accuracy, recency, and sourcing

When a request depends materially on current information such as:

- current package APIs
- framework behavior
- latest versions
- deployment limits
- provider pricing
- cloud platform behavior
- current security advisories
- deprecated APIs

establish the current date first.

Preferred:

```bash
date -Is
```

When researching technical information:

1. Prefer official documentation.
2. Prefer upstream repositories and release notes.
3. Prefer documentation matching the project's installed version.
4. Use Context7 when appropriate for library/API documentation.
5. Use web search only when it materially improves correctness.
6. Avoid relying on old blog posts when authoritative current documentation exists.

When compatibility or security is important, cross-check multiple authoritative sources where practical.

Do not browse merely for routine coding tasks that can be answered from the repository itself.

---

# 8. Context7 MCP

Use Context7 when accurate library or API documentation is needed.

When possible:

- identify the exact library,
- target the installed version,
- fetch only the relevant documentation,
- summarize rather than dumping large documentation sections.

Repository source code and installed package metadata take precedence when determining the version actually in use.

---

# 9. Remote APIs and production safety

Default to read-only operations against remote services.

Do not:

- delete production resources,
- mutate production databases,
- deploy to production,
- send emails/messages,
- modify remote repositories,
- change cloud infrastructure,
- make paid API actions,

unless explicitly requested.

For potentially destructive remote changes:

1. inspect first,
2. explain the intended mutation,
3. use a dry-run when supported,
4. perform the mutation only when explicitly authorized.

Keep ordinary code edits workspace-scoped.

---

# 10. Secrets and sensitive data

Never print or commit:

- API keys
- access tokens
- passwords
- private keys
- database credentials
- session secrets

Never ask the user to paste secrets into chat when a safer authenticated workflow exists.

Avoid broad commands that may expose secrets, such as dumping the entire environment.

Use environment variables for secret configuration.

Keep local secret files ignored by Git.

Where helpful, provide sanitized examples using `.env.example`.

Client-accessible environment variables must never contain private provider credentials.

---

# 11. Containers

Do not install system packages on the host without explicit user approval.

However, containers are **not required for ordinary Arcuate development**.

Use the project's native pnpm/Node.js workflow by default.

Prefer containers when:

- the repository already has a container workflow,
- a service genuinely requires one,
- reproducible infrastructure is needed,
- native dependencies are difficult to isolate,
- or the user explicitly requests containerization.

Do not create Dockerfiles, Compose files, or container infrastructure merely because none currently exists.

If container infrastructure is introduced later, document it in the relevant project documentation.

---

# 12. Reading project documents

When a task depends on a project document, dataset, PDF, long text, or similar source:

1. Inspect enough of the source to understand its full relevant context.
2. Do not infer unseen content.
3. Draft the requested output.
4. Re-check relevant source passages before finalizing when factual fidelity matters.
5. Never invent details missing from the source.

When explicitly paraphrasing source material, preserve meaning rather than wording.

---

# 13. Baseline workflow

Before implementing a non-trivial task:

1. Determine the goal.
2. Determine acceptance criteria.
3. Read `docs/DECISIONS.md`.
4. Read the relevant sections of `docs/PRODUCT.md` and `docs/ARCHITECTURE.md`.
5. Inspect relevant code before proposing changes.
6. Identify package boundaries affected by the task.
7. Determine whether current external documentation is needed.
8. Make the smallest coherent implementation.
9. Verify the change.
10. Update `docs/DECISIONS.md` when there is a meaningful project-state delta.

Do not ask unnecessary clarifying questions when the repository or existing documentation can resolve the ambiguity.

Ask before making an irreversible assumption that materially changes product behavior or architecture.

---

# 14. Continuity ledger

The canonical project continuity file is:

```text
docs/DECISIONS.md
```

Do not create or maintain a second root-level `DECISIONS.md`.

The ledger exists to preserve important project context across Codex sessions and context compaction.

Read it at the beginning of non-trivial tasks.

Do not treat chat history as authoritative when an applicable decision has been recorded in the ledger.

## Update only for meaningful changes

Update `docs/DECISIONS.md` when there is a meaningful change in:

- product goals
- success criteria
- architectural decisions
- package boundaries
- important constraints
- project state
- current implementation direction
- significant discoveries
- unresolved architectural questions
- major tool outcomes

Do not update it for routine formatting changes or trivial bug fixes unless they reveal a durable constraint.

## Ledger sections

Use:

```text
[SNAPSHOT]
[DECISIONS]
[PROGRESS]
[DISCOVERIES]
[OUTCOMES]
[WORKING SET]
[RECEIPTS]
```

### `[SNAPSHOT]`

Keep to approximately 25 lines or fewer.

Capture:

- Goal
- Current state
- Now
- Next
- Important open questions

### `[DECISIONS]`

Record durable choices as ADR-lite entries.

Example:

```text
D001 ACTIVE — 2026-09-02 [USER]
Use Next.js Route Handlers for the MVP rather than introducing a separate backend service.
Reason: current backend requirements are small.
```

If replaced:

```text
D001 SUPERSEDED BY D007
```

Never silently rewrite architectural history.

### `[PROGRESS]`

Record meaningful implementation milestones or changes in direction.

### `[DISCOVERIES]`

Record findings that affect future implementation, such as:

- framework behavior
- API limitations
- performance characteristics
- unexpected bugs
- model limitations
- CEFR evaluation findings

Include concise evidence where useful.

### `[OUTCOMES]`

Use when completing a significant feature or implementation plan.

Capture:

- what was achieved,
- what remains,
- important lessons.

### `[WORKING SET]`

Keep no more than approximately 12 active paths.

### `[RECEIPTS]`

Keep only recent important commands/tool outcomes.

Do not paste raw logs.

## Anti-bloat rules

Every durable ledger entry should include:

- ISO date or timestamp
- provenance tag

Allowed provenance tags:

```text
[USER]
[CODE]
[TOOL]
[ASSUMPTION]
```

If something is unknown:

```text
UNCONFIRMED
```

Never guess.

Keep:

- recent completed items to roughly 7 bullets,
- working paths to roughly 12,
- receipts to approximately 10–20 entries.

Compress older history into `[MILESTONE]` entries when needed.

Facts only.

Do not store transcripts.

Do not use the ledger as a micro-task checklist.

---

# 15. Planning

Use a short execution plan for complex tasks when useful.

Plans should generally contain 3–7 meaningful steps.

Plans are temporary execution scaffolding.

`docs/DECISIONS.md` is for durable context.

Keep the two consistent at the intent/state level.

Do not fill the continuity ledger with every individual implementation step.

---

# 16. Testing and verification

When source code changes, run the checks relevant to the affected workspace.

At minimum, where available:

```bash
pnpm lint
pnpm build
```

Run additionally when applicable:

```bash
pnpm test
pnpm typecheck
```

Prefer filtered checks when only one workspace changed and repository-wide verification would be unnecessarily expensive.

For example:

```bash
pnpm turbo lint --filter=web
pnpm turbo build --filter=web
```

When changing important user flows, run relevant integration/e2e tests if they exist.

Do not claim verification succeeded unless the command actually ran successfully.

If verification cannot run:

- state why,
- report the exact limitation,
- distinguish it from a successful result.

Warnings introduced by the change should be addressed where practical.

Existing unrelated warnings should not trigger unrelated refactoring.

---

# 17. Documentation

Update documentation when a change affects:

- architecture
- developer setup
- public APIs
- environment configuration
- important behavior
- durable project decisions

Do not update documentation exhaustively for implementation details that users or future contributors do not need.

Keep documentation concise and accurate.

Avoid duplicating the same architectural truth across several files unless each location has a clear purpose.

Canonical ownership is:

- `docs/PRODUCT.md` for product goals, scope, UX principles, and planned features.
- `docs/ARCHITECTURE.md` for repository structure, technology choices, package boundaries, and system architecture.
- `docs/DECISIONS.md` for durable decisions and current project state.
- `docs/STYLE.md` — canonical visual language, typography, color palette, layout principles, and UI implementation guidance. Read it before making UI or styling changes.
- `AGENTS.md` for Codex working rules.

---

# 18. Definition of done

A coding task is complete when:

1. The requested behavior is implemented.
2. The implementation respects the architecture documented in `docs/ARCHITECTURE.md`.
3. Relevant validation has been run.
4. Build/lint/typecheck/tests are run as applicable.
5. New errors introduced by the change are fixed.
6. Documentation is updated where materially necessary.
7. `docs/DECISIONS.md` is updated if the task changes durable project state.
8. The final response clearly states:

   - what changed,
   - where it changed,
   - verification performed,
   - anything intentionally left unresolved.

Do not claim a task is fully complete when required verification failed.

---

# 19. Current project decisions

Do not duplicate detailed product or architectural decisions here.

Follow:

- `docs/PRODUCT.md` for product direction and MVP scope.
- `docs/ARCHITECTURE.md` for technology and architecture.
- `docs/DECISIONS.md` for active and superseded durable decisions.
- `docs/STYLE.md` — canonical visual language, typography, color palette, layout principles, and UI implementation guidance. Read it before making UI or styling changes.

Do not replace established project technologies or architectural decisions without explicit approval.

# 20. Commit message

After each completed coding task, provide a suggested Git commit message following the Conventional Commits specification.

Use the format:

```text
<type>(<optional scope>): <short description>
```

Common types include:

- `feat` — new functionality
- `fix` — bug fix
- `refactor` — code restructuring without behavior changes
- `docs` — documentation changes
- `test` — test-related changes
- `chore` — maintenance, tooling, or configuration changes
- `style` — formatting or styling changes
- `perf` — performance improvements

Keep the subject concise, imperative, and specific to the completed change.

Examples:

```text
feat(reader): add paragraph translation toggle
fix(ai): validate generated text before returning response
docs: update MVP product scope
chore: configure Turborepo workspace
```

Provide only one recommended commit message unless multiple commits are clearly warranted.
