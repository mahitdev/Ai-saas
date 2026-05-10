"use client";

import { useEffect, useRef } from "react";
import { Check, CheckCheck, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  receipt?: {
    sentAt: string;
    deliveredAt: string | null;
    readAt: string | null;
  } | null;
  attachments?: Array<{ name: string; mimeType: string; url?: string }>;
  reactions?: Array<{ messageId: string; userId: string; emoji: string; createdAt: string }>;
  threadReplies?: Array<{ id: string; messageId: string; userId: string; content: string; createdAt: string }>;
  status?: "sending" | "streaming" | "sent" | "queued" | "failed";
  retryPayload?: {
    message: string;
    imageDataUrl?: string;
    attachments?: Array<{ name: string; mimeType: string; size: number; url?: string }>;
  };
}

interface ChatMessagesListProps {
  messages: Message[];
  currentUserId: string;
  isLoading?: boolean;
  typingUsers?: Array<{ userId: string; conversationId: string | null }>;
  onMessageReaction?: (messageId: string, emoji: string) => void;
  onThreadReply?: (messageId: string) => void;
  onExplainMessage?: (message: Message) => void;
  onRetryMessage?: (message: Message) => void;
  className?: string;
}

export function ChatMessagesList({
  messages,
  currentUserId: _currentUserId,
  isLoading,
  typingUsers = [],
  onMessageReaction,
  onThreadReply,
  onExplainMessage,
  onRetryMessage,
  className,
}: ChatMessagesListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  void _currentUserId;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const formatMessageTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getReceiptIcon = (receipt: Message["receipt"]) => {
    if (!receipt) return null;

    if (receipt.readAt) {
      return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
    }
    if (receipt.deliveredAt) {
      return <CheckCheck className="h-3.5 w-3.5 text-gray-400" />;
    }
    return <Check className="h-3.5 w-3.5 text-gray-400" />;
  };

  return (
    <ScrollArea
      ref={scrollAreaRef}
      className={cn("flex-1", className)}
    >
      <div className="space-y-4 p-4">
        {messages.length === 0 && !isLoading ? (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            <div className="space-y-2">
              <p className="text-lg font-medium">Start a conversation</p>
              <p className="text-sm">Send your first message to begin chatting</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "group flex gap-3 max-w-[85%]",
                message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              {/* Avatar */}
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src="" alt="" />
                <AvatarFallback className="text-xs">
                  {message.role === "user" ? "U" : "AI"}
                </AvatarFallback>
              </Avatar>

              {/* Message Content */}
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 shadow-sm transition-all duration-200",
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-900 hover:shadow-md"
                )}
              >
                {/* Message Text */}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.attachments.map((attachment, index) => (
                      <div
                        key={`${message.id}-attachment-${index}`}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-xs",
                          message.role === "user"
                            ? "border-white/20 bg-white/10 text-white"
                            : "border-gray-200 bg-gray-50 text-gray-700"
                        )}
                      >
                        Attachment: {attachment.name} ({attachment.mimeType})
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Footer */}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-xs",
                      message.role === "user" ? "text-blue-100" : "text-gray-500"
                    )}
                  >
                    {formatMessageTime(message.createdAt)}
                  </span>

                  {/* Message Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {message.role === "assistant" && onExplainMessage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs hover:bg-gray-100"
                        onClick={() => onExplainMessage(message)}
                      >
                        Why?
                      </Button>
                    )}

                    {onThreadReply && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs hover:bg-gray-100"
                        onClick={() => onThreadReply(message.id)}
                      >
                        Reply
                      </Button>
                    )}

                    {onMessageReaction && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-gray-100"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem onClick={() => onMessageReaction(message.id, "like")}>
                            Like
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onMessageReaction(message.id, "insightful")}>
                            Insightful
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Read Receipt */}
                  {message.role === "user" && (
                    <div className="flex items-center gap-2">
                      {message.status && message.status !== "sent" ? (
                        <span className={cn("text-xs", message.role === "user" ? "text-blue-100" : "text-gray-500")}>
                          {message.status === "failed"
                            ? "Failed"
                            : message.status === "queued"
                              ? "Queued"
                              : message.status === "streaming"
                                ? "Streaming"
                                : "Sending"}
                        </span>
                      ) : null}
                      {message.status === "failed" && onRetryMessage ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-white hover:bg-white/10 hover:text-white"
                          onClick={() => onRetryMessage(message)}
                        >
                          Retry
                        </Button>
                      ) : (
                        getReceiptIcon(message.receipt)
                      )}
                    </div>
                  )}
                </div>

                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.reactions.map((reaction, index) => (
                      <span
                        key={`${message.id}-reaction-${index}`}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                          message.role === "user"
                            ? "border-white/20 bg-white/10 text-white"
                            : "border-gray-200 bg-gray-50 text-gray-700"
                        )}
                      >
                        {reaction.emoji}
                      </span>
                    ))}
                  </div>
                )}

                {/* Thread Replies */}
                {message.threadReplies && message.threadReplies.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs font-medium text-gray-500">
                      {message.threadReplies.length} thread {message.threadReplies.length === 1 ? "reply" : "replies"}
                    </div>
                    {message.threadReplies.slice(0, 2).map((reply) => (
                      <div
                        key={reply.id}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-xs",
                          message.role === "user"
                            ? "border-white/20 bg-white/10 text-white"
                            : "border-gray-200 bg-gray-50 text-gray-700"
                        )}
                      >
                        {reply.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-3">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">AI</AvatarFallback>
            </Avatar>
            <div className="rounded-2xl bg-gray-100 px-4 py-2">
              <div className="flex space-x-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0.1s" }}></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <MessageSkeleton key={i} />
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
