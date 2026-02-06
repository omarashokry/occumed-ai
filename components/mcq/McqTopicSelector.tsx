"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface McqTopic {
  id: string;
  name: string;
  description: string;
  regulations: string[];
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
    </div>
  );
}

export function McqTopicSelector({
  onStart,
  isLoading: isStarting,
}: {
  onStart: (topic: string, count: number) => void;
  isLoading?: boolean;
}) {
  const [topics, setTopics] = useState<McqTopic[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [count, setCount] = useState<number>(5);

  useEffect(() => {
    let cancelled = false;
    async function fetchTopics() {
      try {
        const res = await fetch("/api/mcq/topics");
        if (!res.ok) throw new Error("Failed to fetch topics");
        const data = await res.json();
        if (!cancelled) setTopics(data.topics);
      } catch (err) {
        if (!cancelled)
          setFetchError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }
    fetchTopics();
    return () => {
      cancelled = true;
    };
  }, []);

  if (fetchError) {
    return (
      <div className="text-center py-12">
        <div className="inline-block rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
          Failed to load topics: {fetchError}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">MCQ Practice</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Choose a topic and number of questions to start practicing
        </p>
      </div>

      {/* Special topic cards (full-width, above grid) */}
      {!isFetching && (() => {
        const specialIds = new Set(["mixed-practice", "hse-mix", "textbook-only"]);
        const specialTopics = topics.filter((t) => specialIds.has(t.id));
        if (specialTopics.length === 0) return null;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {specialTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelected(topic.id)}
                disabled={isStarting}
                aria-label={`Select ${topic.name}`}
                className={`text-left rounded-lg border-2 border-dashed p-5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                  selected === topic.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-400 dark:hover:border-blue-600"
                } disabled:opacity-50`}
              >
                <h3 className="font-semibold text-sm mb-1">{topic.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {topic.description}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {topic.regulations.join(", ")}
                </p>
              </button>
            ))}
          </div>
        );
      })()}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isFetching
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : topics.filter((t) => !["mixed-practice", "hse-mix", "textbook-only"].includes(t.id)).map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelected(topic.id)}
                disabled={isStarting}
                aria-label={`Select ${topic.name}`}
                className={`text-left rounded-lg border p-5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                  selected === topic.id
                    ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
                } disabled:opacity-50`}
              >
                <h3 className="font-semibold text-sm mb-1">{topic.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {topic.description}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {topic.regulations.join(", ")}
                </p>
              </button>
            ))}
      </div>

      {selected && (
        <div className="flex flex-col items-center gap-4">
          {/* Count selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Questions:
            </span>
            <div className="flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
              {[5, 10, 20, 30, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  disabled={isStarting}
                  aria-label={`${n} questions`}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    count === n
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  } disabled:opacity-50`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => onStart(selected, count)}
            isLoading={isStarting}
            className="px-8"
          >
            Start Practice
          </Button>
        </div>
      )}
    </div>
  );
}
