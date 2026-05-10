"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface NotificationData {
  id: string;
  kind: "message" | "task" | "mention" | "deadline" | "security";
  title: string;
  body: string;
  conversationId?: string | null;
  messageId?: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface UseNotificationsOptions {
  userId: string;
  autoShowToasts?: boolean;
  onNotification?: (notification: NotificationData) => void;
}

export function useNotifications(options: UseNotificationsOptions) {
  const { userId, autoShowToasts = true, onNotification } = options;
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification: NotificationData) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    if (autoShowToasts) {
      toast(notification.title, {
        description: notification.body,
        duration: 5000,
      });
    }

    onNotification?.(notification);
  }, [autoShowToasts, onNotification]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/chat/notifications/${notificationId}/read`, {
        method: "POST",
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, readAt: new Date().toISOString() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.readAt);
      if (unreadNotifications.length === 0) return;

      // Mark all as read in bulk
      await Promise.all(
        unreadNotifications.map(notification => markAsRead(notification.id))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [notifications, markAsRead]);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    // Recalculate unread count
    setUnreadCount(prev => {
      const removed = notifications.find(n => n.id === notificationId);
      return removed && !removed.readAt ? prev - 1 : prev;
    });
  }, [notifications]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Load initial notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/chat/notifications");
        if (response.ok) {
          const data = await response.json();
          const notificationList = data.notifications || [];
          setNotifications(notificationList);
          setUnreadCount(notificationList.filter((n: NotificationData) => !n.readAt).length);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    loadNotifications();
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    hasUnread: unreadCount > 0,
  };
}