import { redirect } from "next/navigation";

import { UbiquityPage } from "@/components/dashboard/ubiquity-page";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardUbiquityPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");
  return <UbiquityPage />;
}

