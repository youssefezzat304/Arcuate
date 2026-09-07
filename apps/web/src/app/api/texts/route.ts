import { generateText, GenerationError } from "@arcuate/ai";
import { analyzeText } from "@arcuate/language";
import { createTextRequestSchema, CHARACTER_TARGETS } from "@/lib/reading-settings";
import { SUPPORTED_LANGUAGES } from "@/lib/supported-languages";
import { savedTextSchema } from "@/lib/saved-texts";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "This request must come from Arcuate." }, { status: 403 });
  }
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = createTextRequestSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: "Check the topic, language, level, and length." }, { status: 400 });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "Set GEMINI_API_KEY in apps/web/.env.local to generate texts." }, { status: 503 });
  const settings = parsed.data;
  try {
    const generated = await generateText({
      topic: settings.topic,
      language: SUPPORTED_LANGUAGES.find((language) => language.code === settings.language)!.name,
      level: settings.level,
      characterTarget: CHARACTER_TARGETS[settings.length],
    }, { apiKey, model: process.env.GEMINI_MODEL || "gemini-3.6-flash" });
    const analysis = await analyzeText(generated.paragraphs, settings.language, {
      stanzaEndpoint: process.env.LANGUAGE_ANALYZER_URL,
    });
    return Response.json(savedTextSchema.parse({
      ...generated, analysis, id: crypto.randomUUID(), createdAt: new Date().toISOString(), settings,
    }), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof GenerationError ? error.message : "Unable to generate a valid text. Please try again." },
      { status: error instanceof GenerationError ? error.status : 502 });
  }
}
