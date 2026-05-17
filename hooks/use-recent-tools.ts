"use client";

import { useCallback, useEffect, useState } from "react";

import { getToolBySlug } from "@/lib/tools-data";

const STORAGE_KEY = "clawdage_recent_tools";
const FAVORITES_KEY = "clawdage_favorite_tools";
const MAX_RECENT = 8;

export type RecentToolEntry = {
  slug: string;
  name: string;
  visitedAt: number;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useRecentTools() {
  const [recent, setRecent] = useState<RecentToolEntry[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readJson<RecentToolEntry[]>(STORAGE_KEY, []));
    setFavorites(readJson<string[]>(FAVORITES_KEY, []));
  }, []);

  const recordVisit = useCallback((slug: string) => {
    const tool = getToolBySlug(slug);
    if (!tool) return;
    setRecent((prev) => {
      const next: RecentToolEntry[] = [
        { slug, name: tool.name, visitedAt: Date.now() },
        ...prev.filter((e) => e.slug !== slug),
      ].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((slug: string) => {
    setFavorites((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { recent, favorites, recordVisit, toggleFavorite };
}
