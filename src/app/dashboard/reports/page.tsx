import { redirect } from "next/navigation";

import { WeeklyDigestPage } from "@/components/dashboard/weekly-digest-page";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardReportsPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");
  return <WeeklyDigestPage />;
}
