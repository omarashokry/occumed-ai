'use client';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface ReasoningStep {
  step: number;
  candidate_action: string;
  clinical_reasoning: string;
  omst_lo: string;
  quality: 'good' | 'partial' | 'missed';
  comment: string;
}

const qualityConfig = {
  good: { color: 'bg-green-500', badge: 'success' as const, label: 'Good' },
  partial: { color: 'bg-yellow-500', badge: 'neutral' as const, label: 'Partial' },
  missed: { color: 'bg-red-500', badge: 'danger' as const, label: 'Missed' },
};

export function ReasoningChain({ steps }: { steps: ReasoningStep[] }) {
  if (!steps || steps.length === 0) return null;

  const goodCount = steps.filter((s) => s.quality === 'good').length;
  const totalSteps = steps.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinical Reasoning Chain</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          {steps.map((step, i) => {
            const config = qualityConfig[step.quality];
            return (
              <div key={step.step} className="flex gap-3 pb-4 last:pb-0">
                {/* Timeline dot + line */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${config.color} shrink-0 mt-1.5`} />
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Step {step.step}
                    </span>
                    <Badge variant={config.badge}>{config.label}</Badge>
                    <Badge variant="info">{step.omst_lo}</Badge>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">
                    {step.candidate_action}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                    {step.clinical_reasoning}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                    {step.comment}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="rounded-md bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 text-sm text-center">
          You covered <strong>{goodCount}</strong> of <strong>{totalSteps}</strong> expected reasoning steps fully.
        </div>
      </CardContent>
    </Card>
  );
}
