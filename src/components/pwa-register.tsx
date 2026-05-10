"use client";

import { useEffect } from "react";

import { flushQueuedChatMessages, saveOfflineBootstrap } from "@/lib/offline-store";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js").then((registration) => {
      const sync = (registration as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } }).sync;
      return sync?.register("logicra-sync-chat");
    }).catch(() => undefined);

    const refreshOfflineBootstrap = async () => {
      try {
        const response = await fetch("/api/offline/bootstrap", { cache: "no-store" });
        if (response.ok) {
          await saveOfflineBootstrap(await response.json());
        }
      } catch {
        // Offline bootstrap is opportunistic; normal app loading should continue.
      }
    };

    void refreshOfflineBootstrap();
    window.addEventListener("online", flushQueuedChatMessages);
    return () => window.removeEventListener("online", flushQueuedChatMessages);
  }, []);

  return null;
}
