import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ApiError, apiError, assertSameOrigin, validateJson } from "@/lib/server/api-response";

describe("api-response helpers", () => {
  it("returns a standardized error envelope", async () => {
    const response = apiError(new ApiError(404, "NOT_FOUND", "Missing thing"));
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Missing thing",
      },
    });
    expect(response.status).toBe(404);
  });

  it("validates json bodies with zod", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ name: "Ada" }),
    });

    await expect(validateJson(request, z.object({ name: z.string() }))).resolves.toEqual({ name: "Ada" });
  });

  it("blocks cross-origin unsafe requests", () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });

    expect(() => assertSameOrigin(request)).toThrow(ApiError);
  });
});
