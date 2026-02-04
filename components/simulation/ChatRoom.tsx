"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export function ChatRoom({
  messages,
  isSending,
  onSend,
  onEnd,
  isEnding,
}: {
  messages: ChatMsg[];
  isSending: boolean;
  onSend: (message: string) => void;
  onEnd: () => void;
  isEnding: boolean;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    setInput("");
    onSend(trimmed);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold">Consultation Room</h2>
        <Button
          variant="danger"
          onClick={onEnd}
          isLoading={isEnding}
          disabled={isSending || messages.length === 0}
        >
          End Consultation
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-4 space-y-4"
      >
        {messages.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-600 py-8 text-sm">
            The patient is waiting. Begin the consultation.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Spinner size="sm" />
              Patient is responding...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            aria-label="Type your consultation message"
            disabled={isSending || isEnding}
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:opacity-50"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isSending}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
