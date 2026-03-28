import { redirect } from "next/navigation";

import { DeveloperPage } from "@/components/dashboard/developer-page";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardDeveloperPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");
  return <DeveloperPage />;
}

