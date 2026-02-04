"use client";

import { useState } from "react";
import { Scorecard } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { FeedbackReport } from "@/components/feedback/FeedbackReport";

const categories: { key: keyof Pick<Scorecard, "history_taking" | "clinical_knowledge" | "legal_regulatory" | "communication">; label: string }[] = [
  { key: "history_taking", label: "History Taking" },
  { key: "clinical_knowledge", label: "Clinical Knowledge" },
  { key: "legal_regulatory", label: "Legal & Regulatory" },
  { key: "communication", label: "Communication" },
];

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium w-12 text-right">{pct}%</span>
    </div>
  );
}

export function ResultsSummary({
  scorecard,
  sessionId,
  onNewSession,
}: {
  scorecard: Scorecard;
  sessionId?: string | null;
  onNewSession: () => void;
}) {
  const [showReport, setShowReport] = useState(false);

  if (showReport && sessionId) {
    return <FeedbackReport sessionId={sessionId} onBack={() => setShowReport(false)} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Outcome */}
      <Card>
        <CardHeader className="text-center">
          <Badge variant={scorecard.overall_outcome === "PASS" ? "success" : "danger"}>
            {scorecard.overall_outcome}
          </Badge>
          <CardTitle className="mt-3">
            Overall Score: {scorecard.overall_percentage}%
          </CardTitle>
          {scorecard.safety_critical_fail && (
            <p className="text-sm text-red-500 mt-1">Safety-critical fail triggered</p>
          )}
        </CardHeader>
      </Card>

      {/* Category breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map(({ key, label }) => {
            const cat = scorecard[key];
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{label}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {cat.score}/{cat.max}
                  </span>
                </div>
                <ProgressBar value={cat.score} max={cat.max} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {scorecard.feedback_summary}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button onClick={onNewSession} className="w-full">
            Start New Station
          </Button>
          {sessionId && (
            <Button
              variant="secondary"
              onClick={() => setShowReport(true)}
              className="w-full"
            >
              View Full Report
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
