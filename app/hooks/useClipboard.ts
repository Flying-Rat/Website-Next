"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseClipboardOptions<T> = {
  initialValue?: T | null;
  timeoutMs?: number;
};

export function useClipboard<T extends string>(options: UseClipboardOptions<T> = {}) {
  const { initialValue = null, timeoutMs = 2000 } = options;
  const [copied, setCopied] = useState<T | null>(initialValue);
  const timeoutRef = useRef<number | null>(null);

  const copy = useCallback(
    async (value: T, text?: string) => {
      const textToCopy = text ?? value;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(value);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setCopied(null);
      }, timeoutMs);
    },
    [timeoutMs],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { copied, copy };
}
