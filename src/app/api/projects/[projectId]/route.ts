import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { project } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const { projectId } = await context.params;

  const [result] = await db
    .select()
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.ownerId, user.id)))
    .limit(1);

  if (!result) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project: result });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const { projectId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsedBody = updateProjectSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid project payload", details: parsedBody.error.flatten() },
      { status: 400 },
    );
  }

  if (Object.keys(parsedBody.data).length === 0) {
    return NextResponse.json({ error: "No fields provided for update" }, { status: 400 });
  }

  const [updatedProject] = await db
    .update(project)
    .set({
      ...(parsedBody.data.name !== undefined ? { name: parsedBody.data.name } : {}),
      ...(parsedBody.data.description !== undefined
        ? { description: parsedBody.data.description || null }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(project.id, projectId), eq(project.ownerId, user.id)))
    .returning();

  if (!updatedProject) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project: updatedProject });
}

export async function DELETE(_: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const { projectId } = await context.params;

  const [deletedProject] = await db
    .delete(project)
    .where(and(eq(project.id, projectId), eq(project.ownerId, user.id)))
    .returning({ id: project.id });

  if (!deletedProject) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
