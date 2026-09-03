"use server";

import { redirect } from "next/navigation";

import { createTextRequestSchema } from "@/lib/reading-settings";

export async function createMockText(formData: FormData) {
  const request = createTextRequestSchema.safeParse(Object.fromEntries(formData));

  if (!request.success) {
    return;
  }

  redirect(`/texts/${crypto.randomUUID()}`);
}
