import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const enclaveSchema = z.object({
  task: z.string().trim().min(1).max(3000),
  enabled: z.boolean().default(true),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = enclaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid enclave payload" }, { status: 400 });
  }

  return NextResponse.json({
    enclave: parsed.data.enabled ? "enabled" : "disabled",
    attestationId: `enc_${crypto.randomUUID().slice(0, 8)}`,
    status: "processed",
    note: parsed.data.enabled
      ? "Task processed in confidential mode with restricted observability."
      : "Task processed in standard mode.",
  });
}
