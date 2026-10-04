import { z } from 'zod';

const configSchema = z.object({
  url: z.url().refine((url) => ['http:', 'https:'].includes(new URL(url).protocol)),
  publishableKey: z.string().startsWith('sb_publishable_'),
});

export function getSupabaseConfig() {
  const result = configSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) throw new Error('Supabase public configuration is missing or invalid.');
  return result.data;
}
