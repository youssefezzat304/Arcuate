import { explainWord } from '@arcuate/ai';
import { type WordExplanation } from '@arcuate/ai/schema';
import { wordExplanationRequestSchema } from '@/lib/word-explanation';

export const runtime = 'nodejs';
export const maxDuration = 40;
// Bounded process-local protection for the MVP; not a distributed rate limiter.
let inFlight = 0;
let windowStart = 0;
let requests = 0;
const cache = new Map<string, { answer: WordExplanation; expiresAt: number }>();

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: 'This request must come from Arcuate.' }, { status: 403 });
  let raw: unknown;
  try {
    const body = await request.text();
    if (body.length > 30000)
      return Response.json({ error: 'The selected context is too long.' }, { status: 413 });
    raw = JSON.parse(body);
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const parsed = wordExplanationRequestSchema.safeParse(raw);
  if (!parsed.success)
    return Response.json(
      { error: 'Check the selected word, context, and languages.' },
      { status: 400 },
    );
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    return Response.json(
      { error: 'Word explanations need GEMINI_API_KEY on the server.' },
      { status: 503 },
    );
  const model = process.env.GEMINI_LOOKUP_MODEL || 'gemini-3.5-flash-lite';
  const key = JSON.stringify([2, model, parsed.data]);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now())
    return Response.json(cached.answer, { headers: { 'Cache-Control': 'no-store' } });
  if (Date.now() - windowStart > 60000) {
    windowStart = Date.now();
    requests = 0;
  }
  if (inFlight >= 4 || requests >= 60)
    return Response.json(
      { error: 'Word lookups are busy. Please try again shortly.' },
      { status: 429 },
    );
  requests++;
  inFlight++;
  try {
    const answer = await explainWord(parsed.data, { apiKey, model });
    cache.delete(key);
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(key, { answer, expiresAt: Date.now() + 30 * 60 * 1000 });
    return Response.json(answer, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status =
      typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined;
    return Response.json(
      {
        error:
          status === 429
            ? "Gemini's lookup quota is exhausted. Try again later."
            : 'The word explanation could not be completed. Please try again.',
      },
      { status: status === 429 ? 429 : 502 },
    );
  } finally {
    inFlight--;
  }
}
