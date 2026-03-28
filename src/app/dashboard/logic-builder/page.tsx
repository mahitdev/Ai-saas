import { redirect } from "next/navigation";

import { LogicBuilderPage } from "@/components/dashboard/logic-builder-page";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardLogicBuilderPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");
  return <LogicBuilderPage />;
}
