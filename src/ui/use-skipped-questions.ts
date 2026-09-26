import { useCallback, useMemo, useState } from 'react';

const STORAGE_KEY = 'everyday-runtime:skipped-questions';
const SKIP_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type SkipMap = Record<string, number>;

// Storage is provided by the Twenty host and may be unavailable (e.g. in
// tests); a failure must never break the page.
const read = (): SkipMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    return raw ? (JSON.parse(raw) as SkipMap) : {};
  } catch {
    return {};
  }
};

const write = (value: SkipMap) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
};

// "Not now" on a question hides it on this device for a few days.
export const useSkippedQuestions = (now: Date) => {
  const [skips, setSkips] = useState<SkipMap>(read);

  const active = useMemo(
    () =>
      new Set(
        Object.entries(skips)
          .filter(([, at]) => now.getTime() - at < SKIP_DAYS * MS_PER_DAY)
          .map(([id]) => id),
      ),
    [skips, now],
  );

  const skip = useCallback((productId: string) => {
    setSkips((current) => {
      const next = { ...current, [productId]: Date.now() };

      write(next);

      return next;
    });
  }, []);

  return [active, skip] as const;
};
