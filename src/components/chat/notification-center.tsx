"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, BellOff, Check, X, AlertTriangle, MessageSquare, CheckCircle, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationSkeleton } from "@/components/ui/skeleton";
import { designTokens } from "@/lib/design-tokens";
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
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "task":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "mention":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case "deadline":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "security":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (kind: Notification["kind"]) => {
    switch (kind) {
      case "message":
        return "border-blue-200 bg-blue-50";
      case "task":
        return "border-green-200 bg-green-50";
      case "mention":
        return "border-purple-200 bg-purple-50";
      case "deadline":
        return "border-orange-200 bg-orange-50";
      case "security":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
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
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <span className="sr-only">
          {unreadCount > 0 ? `${unreadCount} unread notifications` : "No unread notifications"}
        </span>
      </Button>

      {/* Notification Panel */}
      {isExpanded && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">
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
          <ScrollArea className="max-h-96">
            {notifications.length === 0 ? (
              <NotificationSkeleton />
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 transition-colors hover:bg-gray-50",
                      !notification.readAt && "bg-blue-50/50"
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
                          className="w-full text-left"
                        >
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.body}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
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
                            className="h-6 w-6 p-0 text-gray-400 hover:text-green-600"
                          >
                            <Check className="h-3 w-3" />
                            <span className="sr-only">Mark as read</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDismiss(notification.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Dismiss</span>
                        </Button>
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.readAt && (
                      <div className="mt-2 h-1 w-full rounded-full bg-blue-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}