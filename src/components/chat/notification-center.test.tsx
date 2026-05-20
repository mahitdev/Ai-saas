import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NotificationCenter } from "@/components/chat/notification-center";

describe("NotificationCenter", () => {
  it("shows an intentional empty state", async () => {
    render(
      <NotificationCenter
        notifications={[]}
        unreadCount={0}
        onMarkAsRead={vi.fn()}
        onMarkAllAsRead={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /no unread notifications/i }));

    expect(screen.getByText("No notifications")).toBeInTheDocument();
    expect(screen.getByText("You are all caught up.")).toBeInTheDocument();
  });
});
