"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { analysisFitsText } from "@arcuate/language";
import { textAnalysisSchema } from "@arcuate/language/schema";
import { FormattableReader } from "@/components/formattable-reader";
import { readText, saveText, saveTextAnnotations, type SavedText } from "@/lib/saved-texts";
import type { TextAnnotation } from "@/lib/text-formatting";
import { SUPPORTED_LANGUAGES } from "@/lib/supported-languages";

type ReaderState = { status: "loading" } | { status: "ready"; text: SavedText } | { status: "error"; message: string };

export function SavedReader({ id, enrichmentAvailable }: { id: string; enrichmentAvailable: boolean }) {
  const [state, setState] = useState<ReaderState>({ status: "loading" });
  const enrichmentStarted = useRef(false);
  useEffect(() => {
    async function enrich(text: SavedText) {
      if (!enrichmentAvailable || enrichmentStarted.current || text.analysis.analyzer === "stanza") return;
      enrichmentStarted.current = true;
      try {
        const response = await fetch("/api/language/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: text.settings.language, paragraphs: text.paragraphs }),
          signal: AbortSignal.timeout(40_000),
        });
        if (!response.ok) return;
        const parsed = textAnalysisSchema.safeParse(await response.json());
        if (!parsed.success || parsed.data.analyzer !== "stanza" ||
          !analysisFitsText(parsed.data, text.paragraphs, text.settings.language)) return;
        const latest = readText(text.id) ?? text;
        const enriched = { ...latest, analysis: parsed.data };
        try { saveText(enriched); } catch { /* Enrichment may remain session-only when storage is unavailable. */ }
        setState({ status: "ready", text: enriched });
      } catch { /* Exact token matching remains active when enrichment is unavailable. */ }
    }

    function load() {
      try {
        const text = readText(id);
        setState(text ? { status: "ready", text } : { status: "error", message: "This text is not saved in this browser. Open it on the device where you created it, or create a new text." });
        if (text) void enrich(text);
      } catch {
        setState({ status: "error", message: "This text could not be read. Browser storage may be blocked or the saved record may be damaged." });
      }
    }
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, [enrichmentAvailable, id]);

  if (state.status === "loading") return <p role="status">Loading your text…</p>;
  if (state.status === "error") return <div><p role="alert" className="mb-4 leading-7">{state.message}</p><Link href="/" className="underline">Create a new text</Link></div>;
  const { text } = state;
  const language = SUPPORTED_LANGUAGES.find((item) => item.code === text.settings.language)?.name;
  function persistAnnotations(annotations: TextAnnotation[]) {
    saveTextAnnotations(text.id, annotations);
  }
  return (
    <article className="relative rounded-xl border border-border bg-paper px-6 pt-16 pb-10 sm:px-12 sm:py-14 lg:px-16">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {language} · {text.settings.level} · {text.characterCount.toLocaleString()} characters
      </p>
      <div lang={text.settings.language} dir={text.settings.language === "ar" || text.settings.language === "he" ? "rtl" : "ltr"}>
        <FormattableReader key={text.id} textId={text.id} language={text.settings.language} title={text.title} paragraphs={text.paragraphs} analysis={text.analysis} annotations={text.annotations} onAnnotationsChange={persistAnnotations} />
      </div>
    </article>
  );
}
