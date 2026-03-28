import { redirect } from "next/navigation";

import { ModelLabPage } from "@/components/dashboard/model-lab-page";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardModelLabPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");
  return <ModelLabPage />;
}

