"use client";

import { useState, useCallback } from "react";
import { Scorecard } from "@/lib/types";

export type SessionPhase = "select" | "door-note" | "chat" | "results";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export function useOsceSession() {
  const [phase, setPhase] = useState<SessionPhase>("select");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [doorNote, setDoorNote] = useState<string>("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(
    async (topic: string, difficulty?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/osce/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, difficulty }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to start session");
        }
        const data = await res.json();
        setSessionId(data.sessionId);
        setDoorNote(data.doorNote);
        setPhase("door-note");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const resumeSession = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/osce/${id}/resume`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load session");
      }
      const data = await res.json();
      setSessionId(data.sessionId);
      setDoorNote(data.doorNote);
      setMessages(
        data.messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
      setPhase(data.messages.length > 0 ? "chat" : "door-note");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!sessionId || isSending) return;

      // Optimistic: show user message immediately
      setMessages((prev) => [...prev, { role: "user", content: message }]);
      setIsSending(true);
      setError(null);

      try {
        const res = await fetch(`/api/osce/${sessionId}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to send message");
        }
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsSending(false);
      }
    },
    [sessionId, isSending]
  );

  const endSession = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/osce/${sessionId}/end`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to end session");
      }
      const data = await res.json();
      setScorecard(data.scorecard);
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const reset = useCallback(() => {
    setPhase("select");
    setSessionId(null);
    setDoorNote("");
    setMessages([]);
    setScorecard(null);
    setIsLoading(false);
    setIsSending(false);
    setError(null);
  }, []);

  return {
    phase,
    setPhase,
    sessionId,
    doorNote,
    messages,
    scorecard,
    isLoading,
    isSending,
    error,
    startSession,
    resumeSession,
    sendMessage,
    endSession,
    reset,
  };
}
