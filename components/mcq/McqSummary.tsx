"use client";

import { MCQQuestion } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

interface AnswerRecord {
  questionId: string;
  selected: string;
  isCorrect: boolean;
}

export function McqSummary({
  score,
  questions,
  onReset,
}: {
  score: { correct: number; total: number; answers: AnswerRecord[] };
  questions: MCQQuestion[];
  onReset: () => void;
}) {
  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const scoreColor =
    pct >= 70
      ? "text-green-600 dark:text-green-400"
      : pct >= 50
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";
  const bgColor =
    pct >= 70
      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
      : pct >= 50
      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Score card */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Practice Complete</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`rounded-lg border p-6 text-center ${bgColor}`}>
            <p className={`text-4xl font-bold ${scoreColor}`}>
              {score.correct} / {score.total}
            </p>
            <p className={`text-lg font-medium mt-1 ${scoreColor}`}>{pct}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Per-question results */}
      <Card>
        <CardHeader>
          <CardTitle>Question Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {score.answers.map((answer, i) => {
            const q = questions.find((q) => q.id === answer.questionId);
            return (
              <div
                key={i}
                className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <span className="text-sm font-medium w-8 shrink-0">
                  Q{i + 1}
                </span>
                {answer.isCorrect ? (
                  <span className="text-green-600 dark:text-green-400 font-bold text-sm">
                    &#10003;
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 font-bold text-sm">
                    &#10007;
                  </span>
                )}
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                  {q
                    ? q.stem.length > 80
                      ? q.stem.slice(0, 80) + "..."
                      : q.stem
                    : "Question"}
                </span>
                <Badge variant={answer.isCorrect ? "success" : "danger"}>
                  {answer.selected}
                </Badge>
              </div>
            );
          })}
        </CardContent>
        <CardFooter>
          <Button onClick={onReset} className="w-full">
            Start New Practice
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
