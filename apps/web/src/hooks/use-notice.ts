"use client";

import { useCallback, useEffect, useState } from "react";

export function useNotice() {
  const [notice, setNotice] = useState<{ message: string } | null>(null);
  const showNotice = useCallback((message: string | null) => {
    setNotice(message ? { message } : null);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return [notice?.message ?? null, showNotice] as const;
}
