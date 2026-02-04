import { Suspense } from "react";
import { SimulationRoom } from "@/components/simulation/SimulationRoom";
import { Spinner } from "@/components/ui/Spinner";

export default function SimulationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      }
    >
      <SimulationRoom />
    </Suspense>
  );
}
