"use client";

import { useState, useCallback, useEffect } from "react";
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const STORAGE_KEY_PREFIX = 'hazardgpt-osce-';

  // Persist state on every change
  useEffect(() => {
    if (!sessionId) return;
    const state = { phase, sessionId, doorNote, messages, scorecard };
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${sessionId}`, JSON.stringify(state));
    } catch { /* quota exceeded -- ignore */ }
  }, [phase, sessionId, doorNote, messages, scorecard]);

  // Consultation timer
  useEffect(() => {
    if (phase !== 'chat') return;
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

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

  const recoverSession = useCallback(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(STORAGE_KEY_PREFIX)) continue;
      try {
        const saved = JSON.parse(localStorage.getItem(key) || '');
        if (saved.phase === 'chat' || saved.phase === 'door-note') {
          setPhase(saved.phase);
          setSessionId(saved.sessionId);
          setDoorNote(saved.doorNote);
          setMessages(saved.messages || []);
          return true;
        }
      } catch { /* corrupt entry -- skip */ }
    }
    return false;
  }, []);

  const reset = useCallback(() => {
    if (sessionId) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${sessionId}`);
    }
    setPhase("select");
    setSessionId(null);
    setDoorNote("");
    setMessages([]);
    setScorecard(null);
    setIsLoading(false);
    setIsSending(false);
    setError(null);
    setElapsedSeconds(0);
  }, [sessionId]);

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
    elapsedSeconds,
    startSession,
    resumeSession,
    sendMessage,
    endSession,
    reset,
    recoverSession,
  };
}
