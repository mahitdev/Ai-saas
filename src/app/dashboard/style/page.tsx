import { redirect } from "next/navigation";

import { StylePage } from "@/components/dashboard/style-page";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardStylePage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");
  return <StylePage />;
}

