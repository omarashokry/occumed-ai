"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import { StatsCards } from "./StatsCards";
import { PerformanceChart } from "./PerformanceChart";
import { RecentSessions } from "./RecentSessions";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function DashboardContent() {
  const { osceHistory, mcqStats, radarData, isLoading, error } =
    useDashboardData();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome to HazardGPT - Your occupational medicine training platform
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/simulation">
            <Button>Start OSCE</Button>
          </Link>
          <Link href="/mcq">
            <Button variant="secondary">MCQ Practice</Button>
          </Link>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart data={radarData} isLoading={isLoading} />
        <RecentSessions sessions={osceHistory} isLoading={isLoading} />
      </div>
    </div>
  );
}
