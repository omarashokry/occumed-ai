'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function PerformanceTrends({ data }: { data: { day: string; accuracy: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Performance Trend (Last 30 Days)</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">Complete more practice sessions to see trends.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Performance Trend (Last 30 Days)</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickFormatter={(d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} name="MCQ Accuracy %" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
