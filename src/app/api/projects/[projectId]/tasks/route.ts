import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { project, projectTask } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  starred: z.boolean().optional(),
  dueDate: z.string().datetime().optional().or(z.literal("")),
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

  const [existingProject] = await db
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.ownerId, user.id)))
    .limit(1);

  if (!existingProject) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const tasks = await db
    .select()
    .from(projectTask)
    .where(and(eq(projectTask.projectId, projectId), eq(projectTask.ownerId, user.id)))
    .orderBy(desc(projectTask.updatedAt));

  return NextResponse.json({ tasks });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const { projectId } = await context.params;

  const [existingProject] = await db
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.ownerId, user.id)))
    .limit(1);

  if (!existingProject) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = createTaskSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid task payload", details: parsedBody.error.flatten() },
      { status: 400 },
    );
  }

  const [createdTask] = await db
    .insert(projectTask)
    .values({
      id: crypto.randomUUID(),
      projectId,
      ownerId: user.id,
      title: parsedBody.data.title,
      description: parsedBody.data.description || null,
      status: parsedBody.data.status ?? "todo",
      priority: parsedBody.data.priority ?? "medium",
      starred: parsedBody.data.starred ?? false,
      dueDate: parsedBody.data.dueDate ? new Date(parsedBody.data.dueDate) : null,
    })
    .returning();

  return NextResponse.json({ task: createdTask }, { status: 201 });
}
