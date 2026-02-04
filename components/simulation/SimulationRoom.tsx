"use client";

import { useOsceSession } from "@/hooks/useOsceSession";
import { TopicSelector } from "./TopicSelector";
import { DoorNote } from "./DoorNote";
import { ChatRoom } from "./ChatRoom";
import { ResultsSummary } from "./ResultsSummary";

export function SimulationRoom() {
  const session = useOsceSession();

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
