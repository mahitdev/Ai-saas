import { NextResponse } from "next/server";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { getUsageForecast } from "@/lib/server/usage-infra";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  return NextResponse.json({
    forecast: getUsageForecast(user.id),
  });
}
