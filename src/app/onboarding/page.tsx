import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getServerSession } from "@/lib/server/session";

export default async function OnboardingPage() {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return <OnboardingWizard />;
}
