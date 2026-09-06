import { z } from "zod";

export const generatedTextSchema = z.object({
  title: z.string().trim().min(1).max(300),
  paragraphs: z.array(z.string().trim().min(1).max(20000)).min(1).max(300),
});

export type GeneratedText = z.infer<typeof generatedTextSchema>;
