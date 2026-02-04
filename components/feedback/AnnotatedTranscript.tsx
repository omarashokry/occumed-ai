"use client";

import { AnnotatedMessage } from "@/lib/types";

export function AnnotatedTranscript({
  messages,
}: {
  messages: AnnotatedMessage[];
}) {
  return (
    <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
      {messages.map((msg, i) => (
        <div key={i}>
          <div
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              }`}
            >
              <p className="text-xs font-medium mb-1 opacity-70">
                {msg.role === "user" ? "Doctor" : "Patient"}
              </p>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
          {msg.annotation && (
            <div
              className={`mt-1 ${
                msg.role === "user" ? "ml-auto mr-0" : "ml-0"
              } max-w-[90%] sm:max-w-[80%]`}
            >
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded px-3 py-2 text-xs italic text-amber-800 dark:text-amber-300">
                <span className="font-semibold not-italic">Examiner: </span>
                {msg.annotation}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
