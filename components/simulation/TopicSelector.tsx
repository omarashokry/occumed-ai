"use client";

import { useState } from "react";
import { useOsceTopics } from "@/hooks/useOsceTopics";
import { Button } from "@/components/ui/Button";

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
    </div>
  );
}

export function TopicSelector({
  onSelect,
  isLoading: isStarting,
}: {
  onSelect: (topic: string) => void;
  isLoading?: boolean;
}) {
  const { topics, isLoading, error } = useOsceTopics();
  const [selected, setSelected] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState<string>("");

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-block rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
          Failed to load topics: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Select a Topic</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Choose an occupational medicine scenario for your OSCE station
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => { setSelected(topic.id); setCustomTopic(""); }}
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

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-gray-300 dark:border-gray-700" />
        <span className="mx-4 text-sm text-gray-400 dark:text-gray-500 shrink-0">or</span>
        <div className="flex-grow border-t border-gray-300 dark:border-gray-700" />
      </div>

      <div>
        <label
          htmlFor="custom-scenario"
          className="block text-sm font-medium mb-2"
        >
          Describe your own scenario
        </label>
        <textarea
          id="custom-scenario"
          aria-label="Custom scenario description"
          rows={3}
          disabled={isStarting}
          placeholder="e.g. A 52-year-old construction worker with chronic lower back pain after 20 years of manual handling..."
          value={customTopic}
          onChange={(e) => {
            setCustomTopic(e.target.value);
            setSelected(null);
          }}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 resize-y"
        />
      </div>

      {(selected || customTopic.trim()) && (
        <div className="flex justify-center">
          <Button
            onClick={() => onSelect(selected || customTopic.trim())}
            isLoading={isStarting}
            className="px-8"
          >
            Start Station
          </Button>
        </div>
      )}
    </div>
  );
}
