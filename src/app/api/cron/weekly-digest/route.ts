import { NextResponse } from "next/server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { env } from "@/lib/env";
import { buildWeeklyDigest } from "@/lib/server/weekly-digest";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  return Boolean(env.CRON_SECRET && token === env.CRON_SECRET);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
  }

  const now = new Date();
  const isSunday = now.getUTCDay() === 0;
  if (!isSunday) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Digest is scheduled for Sunday only (UTC).",
      todayUtc: now.toISOString(),
    });
  }

  const users = await db.select({ id: user.id, email: user.email }).from(user);
  let generated = 0;

  for (const currentUser of users) {
    await buildWeeklyDigest({
      userId: currentUser.id,
      deliveryMode: "email",
      deliveredTo: currentUser.email,
    });
    generated += 1;
  }

  return NextResponse.json({
    ok: true,
    generated,
    executedAt: now.toISOString(),
  });
}
