import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { addUpload } from "@/lib/server/chat-realtime";

const uploadSchema = z.object({
  name: z.string().trim().min(1).max(300),
  mimeType: z.string().trim().min(1).max(120),
  size: z.number().int().min(1).max(50_000_000),
  previewUrl: z.string().trim().max(5000),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = uploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid upload payload" }, { status: 400 });
  }

  const upload = addUpload(user.id, {
    ...parsed.data,
    shareUrl: `/api/chat/uploads/${crypto.randomUUID()}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  return NextResponse.json({
    upload,
    shareableLink: upload.shareUrl,
    note: "Upload staged for chat sharing. Wire this to Vercel Blob or S3 for durable storage.",
  });
}
