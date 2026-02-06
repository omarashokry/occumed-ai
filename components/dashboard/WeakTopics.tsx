'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function WeakTopics({ topics, onPractice, onStudyNotes }: {
  topics: { topic: string; accuracy: number; total_attempts: number }[];
  onPractice: (topic: string) => void;
  onStudyNotes: (topic: string) => void;
}) {
  if (topics.length === 0) return null;

  return (
    <Card>
      <CardHeader><CardTitle>Areas for Improvement</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topics.map((t) => (
            <div key={t.topic} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
              <div>
                <p className="font-medium text-sm">{t.topic}</p>
                <p className="text-xs text-gray-500">{t.accuracy}% accuracy ({t.total_attempts} attempts)</p>
              </div>
              <div className="flex gap-2">
                <Button className="text-xs px-3 py-1" onClick={() => onPractice(t.topic)}>Practice</Button>
                <Button className="text-xs px-3 py-1" variant="secondary" onClick={() => onStudyNotes(t.topic)}>Study Notes</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
