"use client";

import { useRouter } from "next/navigation";
import { OSCESession } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

export function RecentSessions({
  sessions,
  isLoading,
}: {
  sessions: OSCESession[];
  isLoading: boolean;
}) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent OSCE Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-600 py-8 text-sm">
            No sessions yet. Start an OSCE station to see your history.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-2 font-medium text-gray-500 dark:text-gray-400">
                    Topic
                  </th>
                  <th className="text-left py-2 font-medium text-gray-500 dark:text-gray-400">
                    Difficulty
                  </th>
                  <th className="text-left py-2 font-medium text-gray-500 dark:text-gray-400">
                    Outcome
                  </th>
                  <th className="text-left py-2 font-medium text-gray-500 dark:text-gray-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() =>
                      router.push(
                        s.overall_outcome
                          ? `/simulation?session=${s.id}`
                          : `/simulation?resume=${s.id}`
                      )
                    }
                    className="border-b border-gray-100 dark:border-gray-800/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3">{s.topic}</td>
                    <td className="py-3">
                      <Badge variant="info">{s.difficulty}</Badge>
                    </td>
                    <td className="py-3">
                      {s.overall_outcome ? (
                        <Badge
                          variant={
                            s.overall_outcome === "PASS" ? "success" : "danger"
                          }
                        >
                          {s.overall_outcome}
                        </Badge>
                      ) : (
                        <Badge variant="neutral">In Progress</Badge>
                      )}
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {new Date(s.started_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
