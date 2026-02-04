"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

interface StatsCardsProps {
  osceCount: number;
  mcqAttempted: number;
  mcqAccuracy: number;
  isLoading: boolean;
}

function StatCard({
  title,
  value,
  subtitle,
  isLoading,
}: {
  title: string;
  value: string;
  subtitle: string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Spinner size="sm" />
          </div>
        ) : (
          <>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsCards({
  osceCount,
  mcqAttempted,
  mcqAccuracy,
  isLoading,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        title="OSCE Sessions"
        value={String(osceCount)}
        subtitle="Completed stations"
        isLoading={isLoading}
      />
      <StatCard
        title="MCQ Attempted"
        value={String(mcqAttempted)}
        subtitle="Total questions"
        isLoading={isLoading}
      />
      <StatCard
        title="MCQ Accuracy"
        value={`${mcqAccuracy}%`}
        subtitle="Overall accuracy"
        isLoading={isLoading}
      />
    </div>
  );
}
