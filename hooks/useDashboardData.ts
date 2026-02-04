"use client";

import { useState, useEffect } from "react";
import { OSCESession, RadarChartData } from "@/lib/types";

interface MCQStats {
  total: number;
  correct: number;
  accuracy: number;
  byTopic: { topic: string; total: number; correct: number; accuracy: number }[];
}

export function useDashboardData() {
  const [osceHistory, setOsceHistory] = useState<OSCESession[]>([]);
  const [mcqStats, setMcqStats] = useState<MCQStats | null>(null);
  const [radarData, setRadarData] = useState<RadarChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [historyRes, statsRes] = await Promise.all([
          fetch("/api/osce/history"),
          fetch("/api/mcq/stats"),
        ]);

        if (!historyRes.ok) throw new Error("Failed to fetch OSCE history");
        if (!statsRes.ok) throw new Error("Failed to fetch MCQ stats");

        const historyData = await historyRes.json();
        const statsData = await statsRes.json();

        if (cancelled) return;

        const sessions: OSCESession[] = historyData.sessions || [];
        setOsceHistory(sessions);
        setMcqStats(statsData);

        // Compute radar chart from last completed session with a scorecard
        const lastGraded = sessions.find(
          (s) => s.scorecard_json && s.overall_outcome
        );
        if (lastGraded?.scorecard_json) {
          const sc = lastGraded.scorecard_json;
          setRadarData([
            {
              category: "History Taking",
              score: Math.round((sc.history_taking.score / sc.history_taking.max) * 100),
              fullMark: 100,
            },
            {
              category: "Clinical Knowledge",
              score: Math.round((sc.clinical_knowledge.score / sc.clinical_knowledge.max) * 100),
              fullMark: 100,
            },
            {
              category: "Legal & Regulatory",
              score: Math.round((sc.legal_regulatory.score / sc.legal_regulatory.max) * 100),
              fullMark: 100,
            },
            {
              category: "Communication",
              score: Math.round((sc.communication.score / sc.communication.max) * 100),
              fullMark: 100,
            },
          ]);
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { osceHistory, mcqStats, radarData, isLoading, error };
}
