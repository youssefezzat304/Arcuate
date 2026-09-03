"use client";

import type { ComponentProps, KeyboardEvent } from "react";

type PromptTextareaProps = ComponentProps<"textarea">;

export function PromptTextarea({ onKeyDown, ...props }: PromptTextareaProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event);

    if (
      event.defaultPrevented ||
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return <textarea {...props} onKeyDown={handleKeyDown} />;
}
