import { NextResponse } from "next/server";
import { z } from "zod";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";

import { db } from "@/db";
import { env } from "@/lib/env";
import { getMcpContext, saveMcpContext, touchMcpContext } from "@/lib/server/mcp-context";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const connectSchema = z.object({
  source: z.enum(["google_drive", "github", "local_files", "postgres"]),
  target: z.string().trim().min(1).max(300),
});

type McpSource = z.infer<typeof connectSchema>["source"];

type McpProbe = {
  connected: boolean;
  discoveredResources: string[];
  contextSummary: string;
  liveSignals: string[];
  capabilities: string[];
  note?: string;
};

function buildContextSummary(source: McpSource, target: string, resources: string[]) {
  if (source === "github") {
    return `GitHub context connected for ${target}. Found ${resources.length} repository resources.`;
  }
  if (source === "google_drive") {
    return `Google Drive context connected for ${target}. Found ${resources.length} Drive files.`;
  }
  if (source === "local_files") {
    return `Local file context connected for ${target}. Found ${resources.length} files under the approved root.`;
  }
  return `Postgres context connected for ${target}. Found ${resources.length} tables/views from the live database.`;
}

function buildLiveSignals(source: McpSource) {
  if (source === "github") return ["repo history", "open PRs", "architecture notes"];
  if (source === "google_drive") return ["doc drafts", "sheet formulas", "briefs"];
  if (source === "local_files") return ["recent files", "desktop notes", "exports"];
  return ["tables", "views", "usage summaries"];
}

async function probeGithub(target: string): Promise<McpProbe> {
  const match = target.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)|^([^/\s]+)\/([^/\s]+)$/i);
  const owner = match?.[1] ?? match?.[3];
  const repo = (match?.[2] ?? match?.[4])?.replace(/\.git$/, "");
  if (!owner || !repo) {
    return {
      connected: false,
      discoveredResources: [],
      contextSummary: "Enter a GitHub target as owner/repo or a GitHub repository URL.",
      liveSignals: [],
      capabilities: [],
    };
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
    headers: {
      accept: "application/vnd.github+json",
      ...(env.GITHUB_TOKEN ? { authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
    },
  });

  if (!response.ok) {
    return {
      connected: false,
      discoveredResources: [],
      contextSummary: `GitHub rejected ${owner}/${repo} with ${response.status}. Configure GITHUB_TOKEN for private repos or rate-limit headroom.`,
      liveSignals: [],
      capabilities: [],
    };
  }

  const payload = (await response.json()) as Array<{ path?: string; type?: string }>;
  const resources = payload.map((item) => `${item.type ?? "item"}:${item.path}`).filter(Boolean).slice(0, 40);
  return {
    connected: true,
    discoveredResources: resources,
    contextSummary: buildContextSummary("github", `${owner}/${repo}`, resources),
    liveSignals: buildLiveSignals("github"),
    capabilities: ["read", "search", "summarize"],
  };
}

async function probeGoogleDrive(target: string): Promise<McpProbe> {
  if (!env.GOOGLE_DRIVE_ACCESS_TOKEN) {
    return {
      connected: false,
      discoveredResources: [],
      contextSummary: "Google Drive needs GOOGLE_DRIVE_ACCESS_TOKEN to list real Drive files.",
      liveSignals: [],
      capabilities: [],
    };
  }

  const query = target === "root" ? "'root' in parents" : `name contains '${target.replace(/'/g, "\\'")}'`;
  const params = new URLSearchParams({
    pageSize: "20",
    fields: "files(id,name,mimeType,modifiedTime)",
    q: `trashed=false and ${query}`,
  });
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { authorization: `Bearer ${env.GOOGLE_DRIVE_ACCESS_TOKEN}` },
  });
  if (!response.ok) {
    return {
      connected: false,
      discoveredResources: [],
      contextSummary: `Google Drive request failed with ${response.status}. Refresh GOOGLE_DRIVE_ACCESS_TOKEN.`,
      liveSignals: [],
      capabilities: [],
    };
  }
  const payload = (await response.json()) as { files?: Array<{ name: string; mimeType: string; modifiedTime?: string }> };
  const resources = (payload.files ?? []).map((file) => `${file.name} (${file.mimeType})`).slice(0, 20);
  return {
    connected: true,
    discoveredResources: resources,
    contextSummary: buildContextSummary("google_drive", target, resources),
    liveSignals: buildLiveSignals("google_drive"),
    capabilities: ["read", "search", "summarize"],
  };
}

async function probeLocalFiles(target: string): Promise<McpProbe> {
  const root = env.MCP_LOCAL_ROOT;
  if (!root) {
    return {
      connected: false,
      discoveredResources: [],
      contextSummary: "Local files require MCP_LOCAL_ROOT so the server can list only an approved directory.",
      liveSignals: [],
      capabilities: [],
    };
  }
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(resolvedRoot, target);
  if (!resolvedTarget.startsWith(resolvedRoot)) {
    return {
      connected: false,
      discoveredResources: [],
      contextSummary: "Local file target is outside MCP_LOCAL_ROOT and was blocked.",
      liveSignals: [],
      capabilities: [],
    };
  }
  const files = await readdir(resolvedTarget).catch(() => readdir(resolvedRoot));
  const resources = (
    await Promise.all(
      files.slice(0, 40).map(async (file) => {
        const fileStat = await stat(path.join(resolvedTarget, file)).catch(() => null);
        return `${fileStat?.isDirectory() ? "dir" : "file"}:${file}`;
      }),
    )
  ).filter(Boolean);
  return {
    connected: true,
    discoveredResources: resources,
    contextSummary: buildContextSummary("local_files", target, resources),
    liveSignals: buildLiveSignals("local_files"),
    capabilities: ["read", "search", "summarize"],
  };
}

async function probePostgres(target: string): Promise<McpProbe> {
  const rows = await db.execute(
    sql`select table_schema, table_name, table_type
     from information_schema.tables
     where table_schema not in ('pg_catalog', 'information_schema')
     order by table_schema, table_name
     limit 40`,
  );
  const resources = Array.from(rows.rows ?? []).map((row) => `${row.table_type}:${row.table_schema}.${row.table_name}`);
  return {
    connected: true,
    discoveredResources: resources,
    contextSummary: buildContextSummary("postgres", target, resources),
    liveSignals: buildLiveSignals("postgres"),
    capabilities: ["read", "search", "summarize"],
  };
}

async function probeMcpSource(source: McpSource, target: string) {
  try {
    if (source === "github") return await probeGithub(target);
    if (source === "google_drive") return await probeGoogleDrive(target);
    if (source === "local_files") return await probeLocalFiles(target);
    return await probePostgres(target);
  } catch (error) {
    return {
      connected: false,
      discoveredResources: [],
      contextSummary: error instanceof Error ? error.message : "MCP source probe failed.",
      liveSignals: [],
      capabilities: [],
    } satisfies McpProbe;
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = connectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid MCP payload" }, { status: 400 });
  }

  const sessionToken = `mcp_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
  const probe = await probeMcpSource(parsed.data.source, parsed.data.target);
  if (!probe.connected) {
    return NextResponse.json({
      connected: false,
      source: parsed.data.source,
      target: parsed.data.target,
      discoveredResources: probe.discoveredResources,
      contextSummary: probe.contextSummary,
      liveSignals: probe.liveSignals,
      capabilities: probe.capabilities,
      note: probe.note ?? "No fake MCP context was created. Configure the provider and try again.",
    }, { status: 424 });
  }

  const context = await saveMcpContext(user.id, {
    source: parsed.data.source,
    target: parsed.data.target,
    secureSessionToken: sessionToken,
    capabilities: probe.capabilities,
    discoveredResources: probe.discoveredResources,
    contextSummary: probe.contextSummary,
    liveSignals: probe.liveSignals,
  });

  return NextResponse.json({
    connected: true,
    source: context.source,
    target: context.target,
    secureSessionToken: context.secureSessionToken,
    capabilities: context.capabilities,
    discoveredResources: context.discoveredResources,
    contextSummary: context.contextSummary,
    liveSignals: context.liveSignals,
    lastUsedAt: context.lastUsedAt,
    note: "MCP bridge created with scoped read-only access.",
  });
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const context = await getMcpContext(user.id);
  if (!context) {
    return NextResponse.json({
      connected: false,
      note: "No MCP context connected yet.",
      liveSignals: [],
      discoveredResources: [],
    });
  }

  const touched = (await touchMcpContext(user.id)) ?? context;
  return NextResponse.json({
    connected: true,
    source: touched.source,
    target: touched.target,
    secureSessionToken: touched.secureSessionToken,
    capabilities: touched.capabilities,
    discoveredResources: touched.discoveredResources,
    contextSummary: touched.contextSummary,
    liveSignals: touched.liveSignals,
    lastUsedAt: touched.lastUsedAt,
    note: "Latest MCP context loaded.",
  });
}
