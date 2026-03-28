import { redirect } from "next/navigation";

import { ComparisonPage } from "@/components/dashboard/comparison-page";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardComparisonPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");
  return <ComparisonPage />;
}
