"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Bell, BellOff, Check, CheckCircle, Clock, MessageSquare, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  kind: "message" | "task" | "mention" | "deadline" | "security";
  title: string;
  body: string;
  conversationId?: string | null;
  messageId?: string | null;
  createdAt: string;
  readAt: string | null;
}

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (notificationId: string) => void;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

export function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onNotificationClick,
  className,
}: NotificationCenterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getNotificationIcon = (kind: Notification["kind"]) => {
    switch (kind) {
      case "message":
        return <MessageSquare className="h-4 w-4 text-cyan-300" />;
      case "task":
        return <CheckCircle className="h-4 w-4 text-emerald-300" />;
      case "mention":
        return <MessageSquare className="h-4 w-4 text-violet-300" />;
      case "deadline":
        return <Clock className="h-4 w-4 text-amber-300" />;
      case "security":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Notification Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative"
      >
        {unreadCount > 0 ? (
          <Bell className="h-4 w-4" />
        ) : (
          <BellOff className="h-4 w-4" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <span className="sr-only">
          {unreadCount > 0 ? `${unreadCount} unread notifications` : "No unread notifications"}
        </span>
      </Button>

      {/* Notification Panel */}
      {isExpanded && (
        <div className="panel-surface absolute right-0 top-12 z-50 w-80 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notification List */}
          <div className="relative">
          <div className="scroll-fade-top opacity-100" />
          <ScrollArea className="max-h-96">
            {notifications.length === 0 ? (
              <div className="p-4">
                <div className="surface-muted rounded-lg p-5 text-center">
                  <BellOff className="mx-auto mb-3 h-7 w-7 text-foreground" />
                  <p className="text-sm font-semibold text-foreground">No notifications</p>
                  <p className="mt-1 text-xs text-muted-foreground">You are all caught up.</p>
                  <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setIsExpanded(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "interactive-row rounded-lg p-3",
                      !notification.readAt && "border-primary/30 bg-primary/10"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.kind)}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => {
                            if (!notification.readAt) {
                              onMarkAsRead(notification.id);
                            }
                            onNotificationClick?.(notification);
                          }}
                          className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        >
                          <p className="truncate text-sm font-medium text-foreground">
                            {notification.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {notification.body}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {!notification.readAt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onMarkAsRead(notification.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-emerald-300"
                          >
                            <Check className="h-3 w-3" />
                            <span className="sr-only">Mark as read</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDismiss(notification.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Dismiss</span>
                        </Button>
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.readAt && (
                      <div className="mt-2 h-1 w-full rounded-full bg-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="scroll-fade-bottom opacity-100" />
          </div>
        </div>
      )}
    </div>
  );
}
