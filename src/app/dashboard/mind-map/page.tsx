import { redirect } from "next/navigation";

import { MindMapPage } from "@/components/dashboard/mind-map-page";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardMindMapPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");
  return <MindMapPage />;
}
