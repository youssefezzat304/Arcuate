import { extendText, GenerationError } from '@arcuate/ai';
import { analyzeText } from '@arcuate/language';
import { extensionRequestSchema, textExtensionSchema } from '@/lib/text-extension';
import { SUPPORTED_LANGUAGES } from '@/lib/supported-languages';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: 'This request must come from Arcuate.' }, { status: 403 });
  }
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = extensionRequestSchema.safeParse(input);
  if (!parsed.success)
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Check the extension prompt and length.' },
      { status: 400 },
    );
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    return Response.json({ error: 'Text generation is currently unavailable.' }, { status: 503 });
  const { original, prompt, length } = parsed.data;
  try {
    const generated = await extendText(
      {
        originalText: { title: original.title, paragraphs: original.paragraphs },
        userPrompt: prompt,
        language: SUPPORTED_LANGUAGES.find(({ code }) => code === original.language)!.name,
        level: original.level,
        translationLanguage: original.translationLanguage,
        characterTarget: length,
      },
      { apiKey, model: process.env.GEMINI_MODEL || 'gemini-3.6-flash' },
    );
    if (original.paragraphs.length + generated.paragraphs.length > 300) {
      return Response.json(
        { error: 'The extension exceeds the reading paragraph limit. Try a shorter extension.' },
        { status: 422 },
      );
    }
    const analysis = await analyzeText(generated.paragraphs, original.language, {
      stanzaEndpoint: process.env.LANGUAGE_ANALYZER_URL,
    });
    const extension = textExtensionSchema.parse({ ...generated, analysis });
    return Response.json(extension, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof GenerationError
            ? error.message
            : 'Unable to generate a valid extension. Please try again.',
      },
      { status: error instanceof GenerationError ? error.status : 502 },
    );
  }
}
