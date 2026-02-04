"use client";

import { useState, useEffect } from "react";
import { OSCESession } from "@/lib/types";

export function useFeedbackReport(sessionId: string | null) {
  const [session, setSession] = useState<OSCESession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function fetchFeedback() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/osce/${sessionId}/feedback`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch feedback");
        }
        const data = await res.json();
        if (!cancelled) setSession(data.session);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchFeedback();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return { session, isLoading, error };
}
