import { NextResponse } from "next/server";

import { getServerSession, unauthorized } from "@/lib/server/session";

export async function GET() {
  const session = await getServerSession();

  if (!session?.user) {
    return unauthorized();
  }

  return NextResponse.json({
    user: session.user,
    session: session.session,
  });
}
