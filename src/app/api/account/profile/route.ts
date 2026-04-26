import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { user } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  image: z.string().trim().url().optional().or(z.literal("")).transform((value) => (value === "" ? undefined : value)),
  bio: z.string().trim().max(240).optional(),
  phoneNumber: z.string().trim().max(40).optional(),
  privacySettings: z
    .object({
      profileVisibility: z.enum(["public", "team", "private"]).optional(),
      emailVisible: z.boolean().optional(),
      notificationsEnabled: z.boolean().optional(),
      securityQuestion: z.string().trim().max(240).optional(),
      securityAnswerHint: z.string().trim().max(240).optional(),
    })
    .partial()
    .optional(),
  themeAccent: z.string().trim().max(20).optional(),
  highContrast: z.boolean().optional(),
  onboardingCompleted: z.boolean().optional(),
});

export async function GET() {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) return unauthorized();

  const [record] = await db.select().from(user).where(eq(user.id, currentUser.id)).limit(1);
  if (!record) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      id: record.id,
      name: record.name,
      email: record.email,
      image: record.image,
      bio: record.bio,
      phoneNumber: record.phoneNumber,
      phoneVerified: record.phoneVerified,
      privacySettings: JSON.parse(record.privacySettings || "{}") as Record<string, unknown>,
      themeAccent: record.themeAccent,
      highContrast: record.highContrast,
      emailVerified: record.emailVerified,
      failedLoginAttempts: record.failedLoginAttempts,
      lockedUntil: record.lockedUntil,
      onboardingCompleted: record.onboardingCompleted,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    },
  });
}

export async function POST(request: Request) {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile payload" }, { status: 400 });
  }

  const privacySettings = parsed.data.privacySettings ? JSON.stringify(parsed.data.privacySettings) : undefined;
  const [updated] = await db
    .update(user)
    .set({
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.image !== undefined ? { image: parsed.data.image || null } : {}),
      ...(parsed.data.bio !== undefined ? { bio: parsed.data.bio } : {}),
      ...(parsed.data.phoneNumber !== undefined ? { phoneNumber: parsed.data.phoneNumber || null } : {}),
      ...(privacySettings ? { privacySettings } : {}),
      ...(parsed.data.themeAccent ? { themeAccent: parsed.data.themeAccent } : {}),
      ...(parsed.data.highContrast !== undefined ? { highContrast: parsed.data.highContrast } : {}),
      ...(parsed.data.onboardingCompleted !== undefined ? { onboardingCompleted: parsed.data.onboardingCompleted } : {}),
      updatedAt: new Date(),
    })
    .where(eq(user.id, currentUser.id))
    .returning();

  return NextResponse.json({
    profile: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      image: updated.image,
      bio: updated.bio,
      phoneNumber: updated.phoneNumber,
      phoneVerified: updated.phoneVerified,
      privacySettings: JSON.parse(updated.privacySettings || "{}") as Record<string, unknown>,
      themeAccent: updated.themeAccent,
      highContrast: updated.highContrast,
      emailVerified: updated.emailVerified,
      failedLoginAttempts: updated.failedLoginAttempts,
      lockedUntil: updated.lockedUntil,
      onboardingCompleted: updated.onboardingCompleted,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    },
  });
}
