"use client";

import { useState, useCallback } from "react";
import { MCQQuestion } from "@/lib/types";

export type McqPhase = "select" | "quiz" | "summary";

interface AnswerRecord {
  questionId: string;
  selected: string;
  isCorrect: boolean;
}

interface QuestionFeedback {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  citation: string;
}

interface McqScore {
  correct: number;
  total: number;
  answers: AnswerRecord[];
}

export function useMcqSession() {
  const [phase, setPhase] = useState<McqPhase>("select");
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<QuestionFeedback | null>(null);
  const [score, setScore] = useState<McqScore>({
    correct: 0,
    total: 0,
    answers: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async (topic: string, count: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mcq/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate questions");
      }
      const data = await res.json();
      setQuestions(data.questions);
      setCurrentIndex(0);
      setSelectedOption(null);
      setFeedback(null);
      setScore({ correct: 0, total: 0, answers: [] });
      setPhase("quiz");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectOption = useCallback((option: string) => {
    setSelectedOption(option);
  }, []);

  const submitAnswer = useCallback(async () => {
    if (!selectedOption || isSubmitting) return;
    const question = questions[currentIndex];
    if (!question?.id) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/mcq/${question.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedOption }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit answer");
      }
      const data = await res.json();
      const fb: QuestionFeedback = {
        is_correct: data.is_correct,
        correct_answer: data.correct_answer,
        explanation: data.explanation,
        citation: data.citation,
      };
      setFeedback(fb);
      setScore((prev) => ({
        correct: prev.correct + (fb.is_correct ? 1 : 0),
        total: prev.total + 1,
        answers: [
          ...prev.answers,
          {
            questionId: question.id!,
            selected: selectedOption,
            isCorrect: fb.is_correct,
          },
        ],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedOption, isSubmitting, questions, currentIndex]);

  const nextQuestion = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setPhase("summary");
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setFeedback(null);
    }
  }, [currentIndex, questions.length]);

  const reset = useCallback(() => {
    setPhase("select");
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setFeedback(null);
    setScore({ correct: 0, total: 0, answers: [] });
    setIsLoading(false);
    setIsSubmitting(false);
    setError(null);
  }, []);

  return {
    phase,
    questions,
    currentIndex,
    selectedOption,
    feedback,
    score,
    isLoading,
    isSubmitting,
    error,
    startSession,
    selectOption,
    submitAnswer,
    nextQuestion,
    reset,
  };
}
