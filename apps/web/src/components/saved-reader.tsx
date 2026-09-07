"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FormattableReader } from "@/components/formattable-reader";
import { readText, type SavedText } from "@/lib/saved-texts";
import { SUPPORTED_LANGUAGES } from "@/lib/supported-languages";

type ReaderState = { status: "loading" } | { status: "ready"; text: SavedText } | { status: "error"; message: string };

export function SavedReader({ id }: { id: string }) {
  const [state, setState] = useState<ReaderState>({ status: "loading" });
  useEffect(() => {
    function load() {
      try {
        const text = readText(id);
        setState(text ? { status: "ready", text } : { status: "error", message: "This text is not saved in this browser. Open it on the device where you created it, or create a new text." });
      } catch {
        setState({ status: "error", message: "This text could not be read. Browser storage may be blocked or the saved record may be damaged." });
      }
    }
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, [id]);

  if (state.status === "loading") return <p role="status">Loading your text…</p>;
  if (state.status === "error") return <div><p role="alert" className="mb-4 leading-7">{state.message}</p><Link href="/" className="underline">Create a new text</Link></div>;
  const { text } = state;
  const language = SUPPORTED_LANGUAGES.find((item) => item.code === text.settings.language)?.name;
  return (
    <article className="rounded-xl border border-border bg-paper px-6 py-10 sm:px-12 sm:py-14 lg:px-16">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {language} · {text.settings.level} · {text.characterCount.toLocaleString()} characters
      </p>
      <div lang={text.settings.language} dir={text.settings.language === "ar" || text.settings.language === "he" ? "rtl" : "ltr"}>
        <FormattableReader key={text.id} textId={text.id} language={text.settings.language} title={text.title} paragraphs={text.paragraphs} />
      </div>
    </article>
  );
}
