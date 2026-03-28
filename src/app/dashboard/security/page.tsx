import { redirect } from "next/navigation";

import { SecurityPage } from "@/components/dashboard/security-page";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardSecurityPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");
  return <SecurityPage />;
}

