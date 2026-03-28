import { redirect } from "next/navigation";

import { AnalyticsPage } from "@/components/dashboard/analytics-page";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardAnalyticsPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");
  return <AnalyticsPage />;
}

