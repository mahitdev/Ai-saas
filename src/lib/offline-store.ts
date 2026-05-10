"use client";

const DB_NAME = "logicra-offline";
const DB_VERSION = 1;
const BOOTSTRAP_STORE = "bootstrap";
const QUEUE_STORE = "messageQueue";

export type OfflineBootstrap = {
  offlineReady: boolean;
  cachedAt: string;
  conversations: Array<{ id: string; title: string; updatedAt: string | Date }>;
  history: Array<{
    conversationId: string;
    messages: Array<{ id?: string; role: "user" | "assistant"; content: string; createdAt: string | Date }>;
  }>;
  draftHint: string;
};

export type QueuedChatMessage = {
  id: string;
  createdAt: string;
  conversationId?: string;
  message: string;
  assistant?: "auto" | "chatgpt" | "gemini";
  imageDataUrl?: string;
  attachments?: Array<{ name: string; mimeType: string; size: number; url?: string }>;
};

function openOfflineDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BOOTSTRAP_STORE)) {
        db.createObjectStore(BOOTSTRAP_STORE);
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
) {
  return openOfflineDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const request = operation(transaction.objectStore(storeName));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      }),
  );
}

export function saveOfflineBootstrap(payload: OfflineBootstrap) {
  return runStore(BOOTSTRAP_STORE, "readwrite", (store) =>
    store.put({ ...payload, cachedAt: new Date().toISOString() }, "latest"),
  );
}

export function readOfflineBootstrap() {
  return runStore<OfflineBootstrap | undefined>(BOOTSTRAP_STORE, "readonly", (store) =>
    store.get("latest"),
  );
}

export function queueChatMessage(message: Omit<QueuedChatMessage, "id" | "createdAt">) {
  const queued: QueuedChatMessage = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...message,
  };
  return runStore(QUEUE_STORE, "readwrite", (store) => store.put(queued)).then(() => queued);
}

export function listQueuedChatMessages() {
  return runStore<QueuedChatMessage[]>(QUEUE_STORE, "readonly", (store) => store.getAll());
}

export function removeQueuedChatMessage(id: string) {
  return runStore(QUEUE_STORE, "readwrite", (store) => store.delete(id));
}

export async function flushQueuedChatMessages() {
  const queued = await listQueuedChatMessages();
  for (const item of queued) {
    const response = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        conversationId: item.conversationId,
        message: item.message,
        assistant: item.assistant,
        imageDataUrl: item.imageDataUrl,
        attachments: item.attachments,
      }),
    });
    if (response.ok) {
      await removeQueuedChatMessage(item.id);
    }
  }
}
