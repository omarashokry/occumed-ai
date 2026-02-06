"use client";

import { useEffect } from "react";
import { useMcqSession } from "@/hooks/useMcqSession";
import { McqTopicSelector } from "./McqTopicSelector";
import { QuestionCard } from "./QuestionCard";
import { QuestionFeedback } from "./QuestionFeedback";
import { McqSummary } from "./McqSummary";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function McqRoom() {
  const session = useMcqSession();

  // Recover session from localStorage on mount
  useEffect(() => {
    if (session.phase === "select") {
      session.recoverSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                onToggleFlag={session.toggleFlag}
                isFlagged={session.questions[session.currentIndex].id ? session.flaggedQuestions.has(session.questions[session.currentIndex].id!) : false}
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
          onReview={session.startReview}
        />
      )}

      {session.phase === "review" && (() => {
        const reviewQuestion = session.questions[session.reviewIndex];
        if (!reviewQuestion) return null;
        const answer = session.score.answers.find(
          (a) => a.questionId === reviewQuestion.id
        );
        return (
          <div className="max-w-2xl mx-auto space-y-4">
            <Card>
              <CardContent className="pt-6">
                <QuestionCard
                  question={reviewQuestion}
                  questionNumber={session.reviewIndex + 1}
                  totalQuestions={session.questions.length}
                  selectedOption={answer?.selected || null}
                  feedback={answer ? { is_correct: answer.isCorrect, correct_answer: reviewQuestion.correct_answer } : null}
                  isSubmitting={false}
                  onSelect={() => {}}
                  onSubmit={() => {}}
                  onToggleFlag={session.toggleFlag}
                  isFlagged={reviewQuestion.id ? session.flaggedQuestions.has(reviewQuestion.id) : false}
                />
              </CardContent>
            </Card>
            <div className="flex items-center justify-between">
              <Button
                onClick={() => session.setReviewIndex((i) => Math.max(0, i - 1))}
                disabled={session.reviewIndex === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {session.reviewIndex + 1} / {session.questions.length}
              </span>
              {session.reviewIndex + 1 < session.questions.length ? (
                <Button
                  onClick={() => session.setReviewIndex((i) => i + 1)}
                >
                  Next
                </Button>
              ) : (
                <Button onClick={session.reset}>
                  Done
                </Button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
