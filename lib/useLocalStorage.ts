"use client";

import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(initialValue) && initialValue.length > 0) {
          // Empty stored array — use initial seed value instead
        } else {
          setValue(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load localStorage key", key, e);
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Failed to save localStorage key", key, e);
    }
  }, [key, value, loaded]);

  return [value, setValue, loaded] as const;
}
