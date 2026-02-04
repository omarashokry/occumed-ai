"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function DoorNote({
  doorNote,
  onEnter,
}: {
  doorNote: string;
  onEnter: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Station Door Note</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-6 whitespace-pre-wrap text-sm leading-relaxed">
            {doorNote}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onEnter} className="w-full">
            Enter Consultation Room
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
