import { and, count, desc, eq, gte, ne } from "drizzle-orm";

import { db } from "@/db";
import { aiConversation, aiMessage, project, projectTask } from "@/db/schema";

const injectionPatterns = /(ignore previous|system prompt|jailbreak|bypass|developer mode|act as|override rules)/i;

export type LiveAnalysisSnapshot = {
  generatedAt: string;
  systemStatus: "healthy" | "busy" | "needs_attention";
  confidence: number;
  metrics: {
    conversations: number;
    messages24h: number;
    assistantMessages24h: number;
    tasksTotal: number;
    tasksOpen: number;
    tasksDone: number;
    overdueTasks: number;
    promptInjectionAlerts: number;
  };
  recommendation: string;
  highlights: string[];
  source: "database" | "fallback_memory";
};

export type SystemAgentRun = {
  analysis: LiveAnalysisSnapshot;
  activeProject: { id: string; name: string } | null;
  actionPlan: string[];
  executedTask?: {
    id: string;
    title: string;
    description: string | null;
    projectId: string;
  } | null;
};

function createFallbackAnalysis(): LiveAnalysisSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    systemStatus: "healthy",
    confidence: 72,
    metrics: {
      conversations: 0,
      messages24h: 0,
      assistantMessages24h: 0,
      tasksTotal: 0,
      tasksOpen: 0,
      tasksDone: 0,
      overdueTasks: 0,
      promptInjectionAlerts: 0,
    },
    recommendation: "Connect a conversation or MCP source to start live analysis.",
    highlights: ["No workspace data loaded yet."],
    source: "fallback_memory",
  };
}

export async function getLiveAnalysis(userId: string): Promise<LiveAnalysisSnapshot> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const [conversationCountRows, taskRows, messageRows] = await Promise.all([
      db.select({ value: count() }).from(aiConversation).where(eq(aiConversation.userId, userId)),
      db
        .select({
          id: projectTask.id,
          title: projectTask.title,
          status: projectTask.status,
          priority: projectTask.priority,
          dueDate: projectTask.dueDate,
          updatedAt: projectTask.updatedAt,
        })
        .from(projectTask)
        .where(eq(projectTask.ownerId, userId))
        .orderBy(desc(projectTask.updatedAt)),
      db
        .select({ role: aiMessage.role, content: aiMessage.content, createdAt: aiMessage.createdAt })
        .from(aiMessage)
        .where(and(eq(aiMessage.userId, userId), gte(aiMessage.createdAt, since)))
        .orderBy(desc(aiMessage.createdAt))
        .limit(80),
    ]);

    const now = new Date();
    const conversations = Number(conversationCountRows[0]?.value ?? 0);
    const tasksTotal = taskRows.length;
    const tasksDone = taskRows.filter((task) => task.status === "done").length;
    const tasksOpen = taskRows.filter((task) => task.status !== "done").length;
    const overdueTasks = taskRows.filter(
      (task) => task.status !== "done" && task.dueDate && new Date(task.dueDate) < now,
    ).length;
    const messages24h = messageRows.length;
    const assistantMessages24h = messageRows.filter((message) => message.role === "assistant").length;
    const promptInjectionAlerts = messageRows.filter(
      (message) => message.role === "user" && injectionPatterns.test(message.content),
    ).length;

    const highlights = [
      tasksOpen > 0 ? `${tasksOpen} open tasks` : "No open tasks",
      overdueTasks > 0 ? `${overdueTasks} overdue tasks` : "No overdue tasks",
      promptInjectionAlerts > 0 ? `${promptInjectionAlerts} prompt injection alerts` : "No prompt injection alerts",
      assistantMessages24h > 0 ? `${assistantMessages24h} assistant replies in the last 24h` : "No assistant replies in the last 24h",
    ].slice(0, 4);

    let recommendation = "Your workspace is quiet. Start a chat or connect MCP to generate fresh signal.";
    let systemStatus: LiveAnalysisSnapshot["systemStatus"] = "healthy";

    if (promptInjectionAlerts > 0) {
      recommendation = "Open Safety & Security and review the flagged prompts before the next action.";
      systemStatus = "needs_attention";
    } else if (overdueTasks > 0) {
      recommendation = "Use the system agent to triage overdue work and create a follow-up task.";
      systemStatus = "busy";
    } else if (messages24h > 0) {
      recommendation = "Run the system agent on recent conversations to turn them into actionable follow-ups.";
      systemStatus = "busy";
    }

    const confidence = Math.max(42, Math.min(98, 92 - promptInjectionAlerts * 8 - overdueTasks * 5));

    return {
      generatedAt: new Date().toISOString(),
      systemStatus,
      confidence,
      metrics: {
        conversations,
        messages24h,
        assistantMessages24h,
        tasksTotal,
        tasksOpen,
        tasksDone,
        overdueTasks,
        promptInjectionAlerts,
      },
      recommendation,
      highlights,
      source: "database",
    };
  } catch {
    return createFallbackAnalysis();
  }
}

function clampText(text: string, maxLength: number) {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export async function runSystemAgent(userId: string, goal: string, execute: boolean) {
  const analysis = await getLiveAnalysis(userId);

  const [latestProject] = await db
    .select({ id: project.id, name: project.name })
    .from(project)
    .where(eq(project.ownerId, userId))
    .orderBy(desc(project.updatedAt))
    .limit(1);

  const actionPlan = [
    analysis.metrics.promptInjectionAlerts > 0
      ? "Audit flagged prompts and tighten the trust gateway."
      : "Keep the trust gateway active and verify recent outputs.",
    analysis.metrics.overdueTasks > 0
      ? "Create or reassign follow-up tasks for overdue work."
      : "Capture the next best task while the workspace is fresh.",
    latestProject
      ? `Attach the next action to project "${latestProject.name}".`
      : "Create a project to capture the next action.",
  ];

  let executedTask: SystemAgentRun["executedTask"] = null;
  if (execute && latestProject) {
    const title = clampText(`System agent: ${goal}`, 200);
    const description = clampText(
      `${analysis.recommendation} | Live status: ${analysis.systemStatus} | Confidence: ${analysis.confidence}%`,
      2000,
    );
    const [createdTask] = await db
      .insert(projectTask)
      .values({
        id: crypto.randomUUID(),
        projectId: latestProject.id,
        ownerId: userId,
        title,
        description,
        status: "todo",
        priority: analysis.metrics.overdueTasks > 0 ? "high" : "medium",
      })
      .returning({
        id: projectTask.id,
        title: projectTask.title,
        description: projectTask.description,
        projectId: projectTask.projectId,
      });

    executedTask = createdTask ?? null;
  }

  return {
    analysis,
    activeProject: latestProject ?? null,
    actionPlan,
    executedTask,
  } satisfies SystemAgentRun;
}
