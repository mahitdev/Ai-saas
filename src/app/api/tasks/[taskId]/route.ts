import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { projectTask } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  starred: z.boolean().optional(),
  dueDate: z.string().datetime().optional().or(z.literal("")),
});

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const { taskId } = await context.params;

  const [task] = await db
    .select()
    .from(projectTask)
    .where(and(eq(projectTask.id, taskId), eq(projectTask.ownerId, user.id)))
    .limit(1);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const { taskId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsedBody = updateTaskSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid task payload", details: parsedBody.error.flatten() },
      { status: 400 },
    );
  }

  if (Object.keys(parsedBody.data).length === 0) {
    return NextResponse.json({ error: "No fields provided for update" }, { status: 400 });
  }

  const [updatedTask] = await db
    .update(projectTask)
    .set({
      ...(parsedBody.data.title !== undefined ? { title: parsedBody.data.title } : {}),
      ...(parsedBody.data.description !== undefined
        ? { description: parsedBody.data.description || null }
        : {}),
      ...(parsedBody.data.status !== undefined ? { status: parsedBody.data.status } : {}),
      ...(parsedBody.data.priority !== undefined ? { priority: parsedBody.data.priority } : {}),
      ...(parsedBody.data.starred !== undefined ? { starred: parsedBody.data.starred } : {}),
      ...(parsedBody.data.dueDate !== undefined
        ? { dueDate: parsedBody.data.dueDate ? new Date(parsedBody.data.dueDate) : null }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(projectTask.id, taskId), eq(projectTask.ownerId, user.id)))
    .returning();

  if (!updatedTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task: updatedTask });
}

export async function DELETE(_: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const { taskId } = await context.params;

  const [deletedTask] = await db
    .delete(projectTask)
    .where(and(eq(projectTask.id, taskId), eq(projectTask.ownerId, user.id)))
    .returning({ id: projectTask.id });

  if (!deletedTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
