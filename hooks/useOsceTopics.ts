"use client";

import { useState, useEffect } from "react";

export interface OsceTopic {
  id: string;
  name: string;
  description: string;
  regulations: string[];
}

export function useOsceTopics() {
  const [topics, setTopics] = useState<OsceTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTopics() {
      try {
        const res = await fetch("/api/osce/topics");
        if (!res.ok) throw new Error("Failed to fetch topics");
        const data = await res.json();
        if (!cancelled) setTopics(data.topics);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchTopics();
    return () => {
      cancelled = true;
    };
  }, []);

  return { topics, isLoading, error };
}
