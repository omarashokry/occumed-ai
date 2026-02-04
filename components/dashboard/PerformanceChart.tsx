"use client";

import { useState, useEffect } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { RadarChartData } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    function handler(e: MediaQueryListEvent) {
      setIsDark(e.matches);
    }
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDark;
}

function ChartSkeleton() {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <div className="w-48 h-48 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 animate-pulse" />
    </div>
  );
}

export function PerformanceChart({
  data,
  isLoading,
}: {
  data: RadarChartData[];
  isLoading?: boolean;
}) {
  const isDark = useDarkMode();

  const gridColor = isDark ? "#4B5563" : "#D1D5DB";
  const tickColor = isDark ? "#9CA3AF" : "#6B7280";

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-600 border border-dashed border-gray-300 dark:border-gray-700 rounded">
            Complete an OSCE station to see your performance radar
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <PolarGrid stroke={gridColor} />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: tickColor, fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: tickColor, fontSize: 10 }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
