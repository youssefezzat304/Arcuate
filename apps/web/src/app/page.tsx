import { GenerationForm } from "@/components/generation-form";
import { PromptTextarea } from "@/components/prompt-textarea";
import { TextLengthSlider } from "@/components/text-length-slider";
import { CEFR_LEVELS } from "@/lib/reading-settings";
import { SUPPORTED_LANGUAGES } from "@/lib/supported-languages";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-16 sm:px-8 sm:py-24">
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Your next read
          </p>
          <h1 className="max-w-2xl font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">
            What would you like to read about?
          </h1>
        </div>

        <GenerationForm>
          <label htmlFor="topic" className="sr-only">
            Reading topic
          </label>
          <PromptTextarea
            id="topic"
            name="topic"
            rows={4}
            required
            maxLength={500}
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 rounded-lg border border-border bg-paper px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-foreground">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Language
                </span>
                <select
                  name="language"
                  defaultValue="de"
                  className="min-w-0 bg-transparent text-left text-sm font-medium sm:text-right outline-none"
                >
                  {SUPPORTED_LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 rounded-lg border border-border bg-paper px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-foreground">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  CEFR level
                </span>
                <select
                  name="level"
                  defaultValue="A2"
                  className="min-w-0 bg-transparent text-left text-sm font-medium sm:text-right outline-none"
                >
                  {CEFR_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>

              <TextLengthSlider />
            </div>
          </div>
        </GenerationForm>

        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          Choose your reading settings, then describe the text you want to read.
        </p>
      </section>
    </main>
  );
}
