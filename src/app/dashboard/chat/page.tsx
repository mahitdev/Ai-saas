import { redirect } from "next/navigation";

import { AiChatDashboard } from "@/components/chat/ai-chat-dashboard";
import { getServerSession } from "@/lib/server/session";

export default async function DashboardChatPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return (
    <AiChatDashboard
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    />
  );
}
