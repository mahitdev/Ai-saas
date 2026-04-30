import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AiAgentLanding } from "@/components/landing/ai-agent-landing";
import { getServerSession } from "@/lib/server/session";

export const metadata: Metadata = {
  title: "FocusForge",
  description: "Discipline your time. Own your future.",
};

export default async function Home() {
  const session = await getServerSession();

  if (session?.user) {
    redirect("/dashboard/chat");
  }

  return <AiAgentLanding />;
}
