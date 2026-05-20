import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useNotifications } from "@/hooks/use-notifications";

vi.mock("sonner", () => ({
  toast: vi.fn(),
}));

describe("useNotifications", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ notifications: [] }),
      }),
    );
  });

  it("adds notifications and tracks unread count", async () => {
    const { result } = renderHook(() => useNotifications({ userId: "user_1", autoShowToasts: false }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/chat/notifications"));

    act(() => {
      result.current.addNotification({
        id: "notification_1",
        kind: "message",
        title: "New message",
        body: "Hello",
        createdAt: new Date().toISOString(),
        readAt: null,
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.hasUnread).toBe(true);
  });
});
