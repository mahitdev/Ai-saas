import { beforeEach, describe, expect, it, vi } from "vitest";

const profileRecord = {
  id: "user_1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  image: null,
  bio: "Mathematician",
  phoneNumber: null,
  phoneVerified: false,
  privacySettings: "{}",
  themeAccent: "#0ea5e9",
  highContrast: false,
  emailVerified: true,
  failedLoginAttempts: 0,
  lockedUntil: null,
  onboardingCompleted: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

const getAuthenticatedUser = vi.fn();
const returning = vi.fn();

vi.mock("@/lib/server/session", () => ({
  getAuthenticatedUser,
  unauthorized: () => Response.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 }),
}));

vi.mock("@/lib/server/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 29, resetSeconds: 60 }),
}));

vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([profileRecord]),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning,
        }),
      }),
    }),
  },
}));

describe("/api/account/profile", () => {
  beforeEach(() => {
    getAuthenticatedUser.mockResolvedValue({ id: "user_1" });
    returning.mockResolvedValue([profileRecord]);
  });

  it("returns the current profile", async () => {
    const { GET } = await import("./route");

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.profile.email).toBe("ada@example.com");
  });

  it("returns standardized validation errors", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/account/profile", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: JSON.stringify({ name: "" }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
  });
});
