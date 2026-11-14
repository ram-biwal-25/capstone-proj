import { listAccessibleFarms } from "@/lib/repository";
import { requireUser } from "@/lib/session";
import { RiskCalculator } from "./risk-calculator";

export default async function RiskEstimationPage() {
  const user = await requireUser();
  const rawFarms = listAccessibleFarms(user.id);

  // Convert to plain objects with Object.prototype for Client Component serialization
  const farms = rawFarms.map((farm) => ({
    id: farm.id,
    name: farm.name,
    type: farm.type,
    accessRole: farm.accessRole,
    animalCount: farm.animalCount,
  }));

  return <RiskCalculator farms={farms} />;
}
