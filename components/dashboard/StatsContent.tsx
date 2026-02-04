"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import { StatsCards } from "./StatsCards";
import { PerformanceChart } from "./PerformanceChart";

export function StatsContent() {
  const { osceHistory, mcqStats, radarData, isLoading, error } =
    useDashboardData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Statistics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Track your performance across OSCE and MCQ assessments
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <StatsCards
        osceCount={osceHistory.filter((s) => s.overall_outcome).length}
        mcqAttempted={mcqStats?.total ?? 0}
        mcqAccuracy={Math.round(mcqStats?.accuracy ?? 0)}
        isLoading={isLoading}
      />

      <PerformanceChart data={radarData} />
    </div>
  );
}
