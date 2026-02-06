"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useOsceSession } from "@/hooks/useOsceSession";
import { TopicSelector } from "./TopicSelector";
import { DoorNote } from "./DoorNote";
import { ChatRoom } from "./ChatRoom";
import { ResultsSummary } from "./ResultsSummary";
import { FeedbackReport } from "../feedback/FeedbackReport";

export function SimulationRoom() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reviewSessionId = searchParams.get("session");
  const resumeId = searchParams.get("resume");
  const session = useOsceSession();
  const resumedRef = useRef(false);

  // Recover session from localStorage on mount (only if no URL params)
  useEffect(() => {
    if (!resumeId && !reviewSessionId && session.phase === "select") {
      session.recoverSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resumeId && !resumedRef.current) {
      resumedRef.current = true;
      session.resumeSession(resumeId);
    }
  }, [resumeId, session]);

  if (reviewSessionId) {
    return (
      <div>
        <FeedbackReport
          sessionId={reviewSessionId}
          onBack={() => router.push("/")}
        />
      </div>
    );
  }

  return (
    <div>
      {session.error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          {session.error}
        </div>
      )}

      {session.phase === "select" && (
        <TopicSelector
          onSelect={(topic) => session.startSession(topic)}
          isLoading={session.isLoading}
        />
      )}

      {session.phase === "door-note" && (
        <DoorNote
          doorNote={session.doorNote}
          onEnter={() => session.setPhase("chat")}
        />
      )}

      {session.phase === "chat" && (
        <ChatRoom
          messages={session.messages}
          isSending={session.isSending}
          onSend={session.sendMessage}
          onEnd={session.endSession}
          isEnding={session.isLoading}
          elapsedSeconds={session.elapsedSeconds}
        />
      )}

      {session.phase === "results" && session.scorecard && (
        <ResultsSummary
          scorecard={session.scorecard}
          sessionId={session.sessionId}
          onNewSession={session.reset}
        />
      )}
    </div>
  );
}
