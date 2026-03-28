import { redirect } from "next/navigation";

import { OrchestratorPage } from "@/components/dashboard/orchestrator-page";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardOrchestratorPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");
  return <OrchestratorPage />;
}

