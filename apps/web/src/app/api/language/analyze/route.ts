import { createStanzaAnalyzer } from '@arcuate/language';
import { z } from 'zod';
import { SUPPORTED_LANGUAGES } from '@/lib/supported-languages';

export const runtime = 'nodejs';
export const maxDuration = 45;

const requestSchema = z
  .object({
    language: z.enum(SUPPORTED_LANGUAGES.map(({ code }) => code)),
    paragraphs: z.array(z.string().max(10_000)).min(1).max(100),
  })
  .refine(
    ({ paragraphs }) =>
      paragraphs.reduce((total, paragraph) => total + paragraph.length, 0) <= 20_000,
    'Text is too long to analyze.',
  );

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: 'This request must come from Arcuate.' }, { status: 403 });
  }
  const endpoint = process.env.LANGUAGE_ANALYZER_URL;
  if (!endpoint)
    return Response.json({ error: 'Language enrichment is unavailable.' }, { status: 503 });

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success)
    return Response.json({ error: 'Check the language and text length.' }, { status: 400 });

  try {
    const analysis = await createStanzaAnalyzer(endpoint).analyze(
      parsed.data.paragraphs,
      parsed.data.language,
    );
    return Response.json(analysis, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json(
      { error: 'Language enrichment is temporarily unavailable.' },
      { status: 502 },
    );
  }
}
