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