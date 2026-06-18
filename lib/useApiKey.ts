"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "gemini_api_key";

/**
 * Stores the user's own Gemini API key in localStorage. Nothing is ever sent to
 * any server we control — the key goes straight from the browser to Google.
 */
export function useApiKey() {
  const [apiKey, setKey] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Load once on mount (avoids touching localStorage during static prerender).
  useEffect(() => {
    try {
      setKey(localStorage.getItem(STORAGE_KEY) || "");
    } catch {
      /* localStorage unavailable */
    }
    setLoaded(true);
  }, []);

  const setApiKey = useCallback((value: string) => {
    const v = value.trim();
    setKey(v);
    try {
      if (v) localStorage.setItem(STORAGE_KEY, v);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const clearKey = useCallback(() => setApiKey(""), [setApiKey]);

  return { apiKey, setApiKey, clearKey, loaded };
}
