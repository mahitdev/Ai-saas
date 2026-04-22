import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const displayName = session.user.name || session.user.email;

  return (
    <DashboardShell displayName={displayName}>{children}</DashboardShell>
  );
}
