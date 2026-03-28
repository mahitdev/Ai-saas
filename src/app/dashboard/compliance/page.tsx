import { redirect } from "next/navigation";

import { CompliancePage } from "@/components/dashboard/compliance-page";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardCompliancePage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");
  return <CompliancePage />;
}

