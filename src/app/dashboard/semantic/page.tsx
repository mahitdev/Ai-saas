import { redirect } from "next/navigation";

import { SemanticLayerPage } from "@/components/dashboard/semantic-layer-page";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardSemanticPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");
  return <SemanticLayerPage />;
}
