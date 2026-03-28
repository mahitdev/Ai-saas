import { redirect } from "next/navigation";

import { VoiceActionsPage } from "@/components/dashboard/voice-actions-page";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardVoicePage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");
  return <VoiceActionsPage />;
}
