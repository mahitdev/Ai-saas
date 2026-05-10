"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Plus, Trash2, MessageSquare, Clock, CheckCircle, AlertTriangle } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationSkeleton } from "@/components/ui/skeleton";
import { designTokens } from "@/lib/design-tokens";
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
  const [isCollapsed, setIsCollapsed] = useState(false);

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
        return `${numValue}`;
      case "sentiment":
        return `${numValue}`;
      case "churnRisk":
        return `${numValue}`;
      case "memory":
        return String(value);
      case "sync":
        return String(value);
      case "role":
        return String(value);
      default:
        return String(value);
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
    <div className={cn("flex h-full flex-col border-r border-gray-200 bg-white", className)}>
      {/* User Profile Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback>
              {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">{user.name}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="border-b border-gray-200 p-4">
        <Button
          onClick={onCreateConversation}
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-semibold text-gray-900">Conversations</h3>
        </div>
        <ScrollArea className="h-full">
          <div className="space-y-1 p-4 pt-0">
            {isLoading ? (
              <ConversationSkeleton />
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group relative rounded-lg border p-3 transition-all hover:shadow-sm",
                    activeConversationId === conversation.id
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <button
                    onClick={() => onSelectConversation(conversation.id)}
                    className="w-full text-left"
                  >
                    <p className="truncate text-sm font-medium text-gray-900">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                    </p>
                  </button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
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
      </div>

      {/* Workspace Stats */}
      <div className="border-t border-gray-200 p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Workspace at a glance</h3>
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
                className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs"
              >
                <span className="text-gray-600">{label}</span>
                <span className={cn("font-medium", getStatsColor(key as keyof WorkspaceStats, value))}>
                  {formatStatsValue(key as keyof WorkspaceStats, value)}
                </span>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {workspaceStats.typingUsers && workspaceStats.typingUsers.length > 0 && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "0.1s" }}></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "0.2s" }}></div>
                </div>
                <span className="text-xs text-blue-700">
                  {workspaceStats.typingUsers.length} typing...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}