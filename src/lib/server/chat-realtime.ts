type PresenceStatus = "online" | "away" | "offline";

type ChatPresence = {
  userId: string;
  status: PresenceStatus;
  lastSeenAt: string;
  typingConversationId: string | null;
  typing: boolean;
  updatedAt: string;
};

type ChatReceipt = {
  messageId: string;
  sentAt: string;
  deliveredAt: string | null;
  readAt: string | null;
};

type ChatNotification = {
  id: string;
  userId: string;
  kind: "message" | "task" | "mention" | "deadline" | "security";
  title: string;
  body: string;
  conversationId?: string | null;
  messageId?: string | null;
  createdAt: string;
  readAt: string | null;
};

type ChatUpload = {
  id: string;
  userId: string;
  name: string;
  mimeType: string;
  size: number;
  previewUrl: string;
  shareUrl: string;
  expiresAt: string;
  createdAt: string;
};

type ChatAuditLog = {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  createdAt: string;
};

type RealtimeEvent =
  | { type: "presence"; presence: ChatPresence }
  | { type: "typing"; userId: string; conversationId: string | null; typing: boolean; updatedAt: string }
  | { type: "receipt"; receipt: ChatReceipt }
  | { type: "notification"; notification: ChatNotification }
  | { type: "upload"; upload: ChatUpload }
  | { type: "audit"; audit: ChatAuditLog };

const presenceByUser = new Map<string, ChatPresence>();
const receiptsByMessageId = new Map<string, ChatReceipt>();
const notificationsByUser = new Map<string, ChatNotification[]>();
const uploadsByUser = new Map<string, ChatUpload[]>();
const auditLogsByUser = new Map<string, ChatAuditLog[]>();
const eventListenersByUser = new Map<string, Set<(event: RealtimeEvent) => void>>();

function nowIso() {
  return new Date().toISOString();
}

function pushToListeners(userId: string, event: RealtimeEvent) {
  const listeners = eventListenersByUser.get(userId);
  if (!listeners) return;
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // keep other listeners alive
    }
  }
}

export function registerRealtimeListener(userId: string, listener: (event: RealtimeEvent) => void) {
  const listeners = eventListenersByUser.get(userId) ?? new Set<(event: RealtimeEvent) => void>();
  listeners.add(listener);
  eventListenersByUser.set(userId, listeners);
  return () => {
    const current = eventListenersByUser.get(userId);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) {
      eventListenersByUser.delete(userId);
    }
  };
}

export function setPresence(userId: string, status: PresenceStatus, typingConversationId: string | null = null, typing = false) {
  const presence: ChatPresence = {
    userId,
    status,
    lastSeenAt: nowIso(),
    typingConversationId,
    typing,
    updatedAt: nowIso(),
  };
  presenceByUser.set(userId, presence);
  pushToListeners(userId, { type: "presence", presence });
  return presence;
}

export function getPresence(userId: string) {
  return presenceByUser.get(userId) ?? null;
}

export function setTyping(userId: string, conversationId: string | null, typing: boolean) {
  const current = presenceByUser.get(userId) ?? setPresence(userId, "online");
  const updated = { ...current, typingConversationId: conversationId, typing, status: typing ? "online" : current.status, updatedAt: nowIso() };
  presenceByUser.set(userId, updated);
  const event = { type: "typing" as const, userId, conversationId, typing, updatedAt: updated.updatedAt };
  pushToListeners(userId, event);
  return updated;
}

export function markMessageSent(messageId: string, userId: string) {
  const receipt: ChatReceipt = {
    messageId,
    sentAt: nowIso(),
    deliveredAt: nowIso(),
    readAt: null,
  };
  receiptsByMessageId.set(messageId, receipt);
  pushToListeners(userId, { type: "receipt", receipt });
  return receipt;
}

export function markMessageRead(messageId: string, userId: string) {
  const existing = receiptsByMessageId.get(messageId);
  const receipt: ChatReceipt = {
    messageId,
    sentAt: existing?.sentAt ?? nowIso(),
    deliveredAt: existing?.deliveredAt ?? nowIso(),
    readAt: nowIso(),
  };
  receiptsByMessageId.set(messageId, receipt);
  pushToListeners(userId, { type: "receipt", receipt });
  return receipt;
}

export function getReceipt(messageId: string) {
  return receiptsByMessageId.get(messageId) ?? null;
}

export function addNotification(
  userId: string,
  notification: Omit<ChatNotification, "id" | "userId" | "createdAt" | "readAt"> & { readAt?: string | null },
) {
  const next: ChatNotification = {
    ...notification,
    id: crypto.randomUUID(),
    userId,
    createdAt: nowIso(),
    readAt: notification.readAt ?? null,
  };
  const list = notificationsByUser.get(userId) ?? [];
  list.unshift(next);
  notificationsByUser.set(userId, list.slice(0, 50));
  pushToListeners(userId, { type: "notification", notification: next });
  return next;
}

export function listNotifications(userId: string) {
  return notificationsByUser.get(userId) ?? [];
}

export function markNotificationRead(userId: string, notificationId: string) {
  const list = notificationsByUser.get(userId) ?? [];
  const next = list.map((item) => (item.id === notificationId ? { ...item, readAt: nowIso() } : item));
  notificationsByUser.set(userId, next);
  return next.find((item) => item.id === notificationId) ?? null;
}

export function addUpload(
  userId: string,
  upload: Omit<ChatUpload, "id" | "userId" | "createdAt"> & { expiresAt?: string },
) {
  const next: ChatUpload = {
    ...upload,
    id: crypto.randomUUID(),
    userId,
    createdAt: nowIso(),
    expiresAt: upload.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  const list = uploadsByUser.get(userId) ?? [];
  list.unshift(next);
  uploadsByUser.set(userId, list.slice(0, 30));
  pushToListeners(userId, { type: "upload", upload: next });
  return next;
}

export function listUploads(userId: string) {
  return uploadsByUser.get(userId) ?? [];
}

export function addAuditLog(userId: string, audit: Omit<ChatAuditLog, "id" | "userId" | "createdAt">) {
  const next: ChatAuditLog = {
    ...audit,
    id: crypto.randomUUID(),
    userId,
    createdAt: nowIso(),
  };
  const list = auditLogsByUser.get(userId) ?? [];
  list.unshift(next);
  auditLogsByUser.set(userId, list.slice(0, 100));
  pushToListeners(userId, { type: "audit", audit: next });
  return next;
}

export function listAuditLogs(userId: string) {
  return auditLogsByUser.get(userId) ?? [];
}

export function getChatRealtimeSnapshot(userId: string) {
  return {
    presence: getPresence(userId),
    notifications: listNotifications(userId),
    uploads: listUploads(userId),
    auditLogs: listAuditLogs(userId),
  };
}

export type { ChatPresence, ChatReceipt, ChatNotification, ChatUpload, ChatAuditLog, RealtimeEvent, PresenceStatus };
