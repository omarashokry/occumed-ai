"use client";

import { useFeedbackReport } from "@/hooks/useFeedbackReport";
import { Scorecard } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ChecklistTable } from "./ChecklistTable";
import { AnnotatedTranscript } from "./AnnotatedTranscript";

const categories: {
  key: keyof Pick<
    Scorecard,
    "history_taking" | "clinical_knowledge" | "legal_regulatory" | "communication"
  >;
  label: string;
}[] = [
  { key: "history_taking", label: "History Taking" },
  { key: "clinical_knowledge", label: "Clinical Knowledge" },
  { key: "legal_regulatory", label: "Legal & Regulatory" },
  { key: "communication", label: "Communication" },
];

export function FeedbackReport({
  sessionId,
  onBack,
}: {
  sessionId: string;
  onBack?: () => void;
}) {
  const { session, isLoading, error } = useFeedbackReport(sessionId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-block rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
          Failed to load feedback: {error}
        </div>
      </div>
    );
  }

  if (!session || !session.scorecard_json) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No feedback available for this session.
      </div>
    );
  }

  const sc = session.scorecard_json;
  const date = session.ended_at
    ? new Date(session.ended_at).toLocaleDateString()
    : new Date(session.started_at).toLocaleDateString();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {session.topic.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} &middot;{" "}
            {session.difficulty} &middot; {date}
          </p>
          <Badge variant={sc.overall_outcome === "PASS" ? "success" : "danger"}>
            {sc.overall_outcome}
          </Badge>
          <CardTitle className="mt-3">
            Overall Score: {sc.overall_percentage}%
          </CardTitle>
          {sc.safety_critical_fail && (
            <div className="mt-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2 text-sm text-red-700 dark:text-red-400">
              Safety-critical fail triggered — automatic FAIL
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Category Checklists */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map(({ key, label }) => {
            const cat = sc[key];
            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {cat.score}/{cat.max}
                  </span>
                </div>
                <ChecklistTable items={cat.items} title="" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Feedback Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {sc.feedback_summary}
          </p>
          {sc.citation && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              Reference: {sc.citation}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Annotated Transcript */}
      {sc.annotated_transcript && sc.annotated_transcript.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Annotated Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <AnnotatedTranscript messages={sc.annotated_transcript} />
          </CardContent>
        </Card>
      )}

      {/* Back Button */}
      {onBack && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={onBack} className="px-8">
            Back to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
