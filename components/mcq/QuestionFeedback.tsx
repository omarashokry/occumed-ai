"use client";

import { useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function QuestionFeedback({
  isCorrect,
  correctAnswer,
  explanation,
  citation,
  isLast,
  onNext,
}: {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  citation: string;
  isLast: boolean;
  onNext: () => void;
}) {
  // Enter key to advance to next question
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') onNext();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext]);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant={isCorrect ? "success" : "danger"}>
          {isCorrect ? "Correct" : "Incorrect"}
        </Badge>
        {!isCorrect && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Correct answer: <strong>{correctAnswer}</strong>
          </span>
        )}
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
        {explanation}
      </p>

      {citation && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Reference: {citation}
        </p>
      )}

      <div className="flex justify-center pt-2">
        <Button onClick={onNext} className="px-8">
          {isLast ? "View Results" : "Next Question"}
        </Button>
      </div>
    </div>
  );
}
