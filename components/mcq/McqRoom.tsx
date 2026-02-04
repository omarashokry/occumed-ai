"use client";

import { useMcqSession } from "@/hooks/useMcqSession";
import { McqTopicSelector } from "./McqTopicSelector";
import { QuestionCard } from "./QuestionCard";
import { QuestionFeedback } from "./QuestionFeedback";
import { McqSummary } from "./McqSummary";
import { Card, CardContent } from "@/components/ui/Card";

export function McqRoom() {
  const session = useMcqSession();

  return (
    <div>
      {session.error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          {session.error}
        </div>
      )}

      {session.phase === "select" && (
        <McqTopicSelector
          onStart={session.startSession}
          isLoading={session.isLoading}
        />
      )}

      {session.phase === "quiz" && session.questions[session.currentIndex] && (
        <div className="max-w-2xl mx-auto space-y-4">
          <Card>
            <CardContent className="pt-6">
              <QuestionCard
                question={session.questions[session.currentIndex]}
                questionNumber={session.currentIndex + 1}
                totalQuestions={session.questions.length}
                selectedOption={session.selectedOption}
                feedback={session.feedback}
                isSubmitting={session.isSubmitting}
                onSelect={session.selectOption}
                onSubmit={session.submitAnswer}
              />
            </CardContent>
          </Card>

          {session.feedback && (
            <QuestionFeedback
              isCorrect={session.feedback.is_correct}
              correctAnswer={session.feedback.correct_answer}
              explanation={session.feedback.explanation}
              citation={session.feedback.citation}
              isLast={session.currentIndex + 1 >= session.questions.length}
              onNext={session.nextQuestion}
            />
          )}
        </div>
      )}

      {session.phase === "summary" && (
        <McqSummary
          score={session.score}
          questions={session.questions}
          onReset={session.reset}
        />
      )}
    </div>
  );
}
