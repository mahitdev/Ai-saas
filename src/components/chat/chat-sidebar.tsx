"use client";

import { formatDistanceToNow } from "date-fns";
import { MessageSquarePlus, Plus, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceStats {
  messages: number;
  memory: string;
  intent: string;
  presence: string;
  sync: string;
  role: string;
  latency: number;
  sentiment: number;
  churnRisk: number;
  typingUsers?: string[];
}

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  workspaceStats: WorkspaceStats;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  isLoading?: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  className?: string;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  workspaceStats,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  isLoading = false,
  user,
  className,
}: ChatSidebarProps) {
  const formatStatsValue = (key: keyof WorkspaceStats, value: unknown): string => {
    const numValue = typeof value === 'number' ? value : 0;
    switch (key) {
      case "latency":
        return `${numValue}ms`;
      case "sentiment":
        return `${numValue}`;
      case "churnRisk":
        return `${numValue}`;
      case "memory":
        return String(value);
      default:
        return String(value);
    }
  };

  const getStatsColor = (key: keyof WorkspaceStats, value: unknown) => {
    const numValue = typeof value === 'number' ? value : 0;
    switch (key) {
      case "latency":
        return numValue > 500 ? "text-destructive" : "text-foreground";
      case "sentiment":
        return numValue < 0 ? "text-destructive" : "text-foreground";
      case "churnRisk":
        return numValue > 50 ? "text-destructive" : "text-foreground";
      case "memory":
        return "text-foreground";
      case "sync":
        return value === "online" ? "text-emerald-300" : "text-amber-300";
      case "role":
        return "text-foreground";
      default:
        return "text-foreground";
    }
  };

  const statsLabels: Record<keyof WorkspaceStats, string> = {
    messages: "Messages",
    memory: "Memory",
    intent: "Intent",
    presence: "Presence",
    sync: "Sync",
    role: "Role",
    latency: "Latency",
    sentiment: "Sentiment",
    churnRisk: "Churn Risk",
    typingUsers: "Typing",
  };

  return (
    <aside className={cn("panel-surface flex h-full flex-col overflow-hidden", className)}>
      {/* User Profile Header */}
      <div className="border-b border-border/60 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback>
              {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="border-b border-border/60 p-4">
        <Button
          onClick={onCreateConversation}
          className="w-full"
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-semibold text-foreground">Conversations</h3>
        </div>
        <div className="relative h-[calc(100%-2.5rem)]">
        <div className="scroll-fade-top opacity-100" />
        <ScrollArea className="h-full">
          <div className="space-y-1 p-4 pt-0">
            {isLoading ? (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Loading conversations</p>
                <ConversationSkeleton />
              </div>
            ) : conversations.length === 0 ? (
              <div className="surface-muted rounded-lg p-4 text-center">
                <MessageSquarePlus className="mx-auto mb-3 h-7 w-7 text-foreground" />
                <p className="text-sm font-semibold text-foreground">No conversations yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Start a fresh thread when you are ready.</p>
                <Button type="button" size="sm" className="mt-4" onClick={onCreateConversation}>
                  <Plus className="h-4 w-4" />
                  New Chat
                </Button>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "interactive-row group relative rounded-lg p-3",
                    activeConversationId === conversation.id
                      ? "border-primary/50 bg-primary/10"
                      : ""
                  )}
                >
                  <button
                    onClick={() => onSelectConversation(conversation.id)}
                    className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <p className="truncate text-sm font-medium text-foreground">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                    </p>
                  </button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-6 w-6 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-focus-within:opacity-100 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conversation.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="scroll-fade-bottom opacity-100" />
        </div>
      </div>

      {/* Workspace Stats */}
      <div className="border-t border-border/60 p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-foreground">Workspace at a glance</h3>
        </div>

        <div className="grid gap-2">
          {Object.entries(statsLabels).map(([key, label]) => {
            const value = workspaceStats[key as keyof WorkspaceStats];
            if (key === "typingUsers" && (!value || (Array.isArray(value) && value.length === 0))) {
              return null;
            }

            return (
              <div
                key={key}
                className="surface-muted flex items-center justify-between rounded-md px-3 py-2 text-xs"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className={cn("font-medium", getStatsColor(key as keyof WorkspaceStats, value))}>
                  {formatStatsValue(key as keyof WorkspaceStats, value)}
                </span>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {workspaceStats.typingUsers && workspaceStats.typingUsers.length > 0 && (
            <div className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0.1s" }}></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0.2s" }}></div>
                </div>
                <span className="text-xs text-foreground">
                  {workspaceStats.typingUsers.length} typing...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
