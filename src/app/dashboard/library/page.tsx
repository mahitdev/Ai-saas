import { redirect } from "next/navigation";

import { LibraryPage } from "@/components/dashboard/library-page";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardLibraryPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");
  return <LibraryPage />;
}

