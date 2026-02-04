"use client";

import { MCQQuestion } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  feedback,
  isSubmitting,
  onSelect,
  onSubmit,
}: {
  question: MCQQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: string | null;
  feedback: { is_correct: boolean; correct_answer: string } | null;
  isSubmitting: boolean;
  onSelect: (option: string) => void;
  onSubmit: () => void;
}) {
  const progress = ((questionNumber) / totalQuestions) * 100;

  function optionStyle(label: string) {
    // Post-submit styling
    if (feedback) {
      if (label === feedback.correct_answer) {
        return "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300";
      }
      if (label === selectedOption && !feedback.is_correct) {
        return "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300";
      }
      return "border-gray-200 dark:border-gray-700 opacity-50 cursor-default";
    }
    // Pre-submit styling
    if (label === selectedOption) {
      return "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50 dark:bg-blue-900/20";
    }
    return "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer";
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
          <span>
            Question {questionNumber} of {totalQuestions}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stem */}
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {question.stem}
      </p>

      {/* Options */}
      <fieldset className="space-y-2">
        <legend className="sr-only">Select your answer</legend>
        <div role="radiogroup" className="space-y-2">
          {question.options.map((opt) => (
            <button
              key={opt.label}
              role="radio"
              aria-checked={selectedOption === opt.label}
              onClick={() => !feedback && onSelect(opt.label)}
              disabled={!!feedback}
              className={`w-full text-left rounded-lg border p-3 text-sm transition-all flex gap-3 ${optionStyle(
                opt.label
              )}`}
            >
              <span className="font-semibold shrink-0">{opt.label}.</span>
              <span>{opt.text}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Submit button (hidden after feedback) */}
      {!feedback && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={onSubmit}
            isLoading={isSubmitting}
            disabled={!selectedOption}
            className="px-8"
          >
            Submit Answer
          </Button>
        </div>
      )}
    </div>
  );
}
