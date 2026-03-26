import { count, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { project, projectTask } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const projects = await db
    .select({
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    })
    .from(project)
    .where(eq(project.ownerId, user.id))
    .orderBy(desc(project.updatedAt));

  const taskCounts = await db
    .select({
      projectId: projectTask.projectId,
      totalTasks: count(projectTask.id),
    })
    .from(projectTask)
    .where(eq(projectTask.ownerId, user.id))
    .groupBy(projectTask.projectId);

  const countMap = new Map(taskCounts.map((row) => [row.projectId, row.totalTasks]));

  return NextResponse.json({
    projects: projects.map((item) => ({
      ...item,
      totalTasks: countMap.get(item.id) ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const parsedBody = createProjectSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid project payload", details: parsedBody.error.flatten() },
      { status: 400 },
    );
  }

  const [createdProject] = await db
    .insert(project)
    .values({
      id: crypto.randomUUID(),
      ownerId: user.id,
      name: parsedBody.data.name,
      description: parsedBody.data.description || null,
    })
    .returning({
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });

  return NextResponse.json({ project: createdProject }, { status: 201 });
}
