import { redirect } from "next/navigation";

import { AccountPage } from "@/components/dashboard/account-page";
import { getServerSession } from "@/lib/server/session";

export default async function AccountDashboardPage() {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return <AccountPage />;
}
