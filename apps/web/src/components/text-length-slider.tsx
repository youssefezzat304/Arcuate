"use client";

import { useState } from "react";
import { TEXT_LENGTH } from "@/lib/reading-settings";

export function TextLengthSlider() {
  const [length, setLength] = useState<number>(TEXT_LENGTH.default);

  return (
    <div className="rounded-lg border border-border bg-paper px-4 py-3 sm:col-span-2">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="text-length" className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Text length
        </label>
        <output htmlFor="text-length" className="text-sm font-medium tabular-nums">
          {length.toLocaleString("en-US")} characters
        </output>
      </div>
      <input
        id="text-length"
        name="length"
        type="range"
        min={TEXT_LENGTH.min}
        max={TEXT_LENGTH.max}
        step={TEXT_LENGTH.step}
        value={length}
        onChange={(event) => setLength(Number(event.target.value))}
        aria-valuetext={`${length.toLocaleString("en-US")} characters`}
        className="block h-8 w-full cursor-pointer accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-wait"
      />
      <div aria-hidden="true" className="flex justify-between text-xs tabular-nums text-muted-foreground">
        <span>2,000</span>
        <span>20,000</span>
      </div>
    </div>
  );
}
