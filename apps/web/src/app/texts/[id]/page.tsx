import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { FormattableReader } from "@/components/formattable-reader";
import { theMockText } from "@/lib/mock-text";

const textIdSchema = z.uuid();

export const metadata: Metadata = {
  title: `${theMockText.title} · Arcuate`,
  description: "A graded reading text from Arcuate.",
};

export default async function TextPage({ params }: PageProps<"/texts/[id]">) {
  const { id } = await params;

  if (!textIdSchema.safeParse(id).success) {
    notFound();
  }

  const paragraphs = theMockText.text.split("\n\n");

  return (
    <main className="min-h-dvh bg-background px-5 py-5 text-foreground sm:px-8 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between gap-6">
          <Link
            href="/"
            className="font-serif text-xl font-semibold tracking-[-0.03em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
          >
            Arcuate
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-border bg-paper px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition hover:bg-warm-highlight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            New text
          </Link>
        </header>

        <article className="rounded-xl border border-border bg-paper px-6 py-10 sm:px-12 sm:py-14 lg:px-16">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Mock reading
          </p>
          <FormattableReader key={id} title={theMockText.title} paragraphs={paragraphs} />
        </article>
      </div>
    </main>
  );
}
