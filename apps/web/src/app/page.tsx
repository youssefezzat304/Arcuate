import { SUPPORTED_LANGUAGES } from "@/lib/supported-languages";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const TEXT_LENGTHS = ["short", "medium", "long"] as const;

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center px-5 py-5 sm:px-8">
        <span className="font-serif text-xl font-semibold tracking-[-0.03em]">
          Arcuate
        </span>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 pb-24 sm:px-8">
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Your next read
          </p>
          <h1 className="max-w-2xl font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">
            What would you like to read about?
          </h1>
        </div>

        <form className="overflow-hidden rounded-xl border border-border bg-paper">
          <label htmlFor="topic" className="sr-only">
            Reading topic
          </label>
          <textarea
            id="topic"
            name="topic"
            rows={4}
            required
            placeholder="Ask for a story, an explanation, or any topic..."
            className="block w-full resize-none bg-transparent px-5 pt-5 pb-3 text-base leading-7 outline-none placeholder:text-muted-foreground sm:px-6 sm:pt-6"
          />

          <div className="border-t border-border bg-background px-4 py-4 sm:px-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Text settings
              </p>
              <button
                type="submit"
                aria-label="Generate text"
                className="flex size-10 items-center justify-center rounded-lg bg-accent text-xl leading-none text-accent-foreground transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                <span aria-hidden="true">↑</span>
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-paper px-4 py-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-foreground">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Language
                </span>
                <select
                  name="language"
                  defaultValue="de"
                  className="min-w-0 bg-transparent text-right text-sm font-medium outline-none"
                >
                  {SUPPORTED_LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-paper px-4 py-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-foreground">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  CEFR level
                </span>
                <select
                  name="level"
                  defaultValue="A2"
                  className="min-w-0 bg-transparent text-right text-sm font-medium outline-none"
                >
                  {CEFR_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-paper px-4 py-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-foreground">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Translation
                </span>
                <select
                  name="translationLanguage"
                  defaultValue=""
                  className="min-w-0 bg-transparent text-right text-sm font-medium outline-none"
                >
                  <option value="">None</option>
                  {SUPPORTED_LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-paper px-4 py-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-foreground">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Length
                </span>
                <select
                  name="length"
                  defaultValue="medium"
                  className="min-w-0 bg-transparent text-right text-sm font-medium capitalize outline-none"
                >
                  {TEXT_LENGTHS.map((length) => (
                    <option key={length} value={length}>
                      {length.charAt(0).toUpperCase() + length.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </form>

        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          Choose your reading settings, then describe the text you want to read.
        </p>
      </section>
    </main>
  );
}
