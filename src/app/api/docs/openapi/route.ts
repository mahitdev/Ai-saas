import { apiJson } from "@/lib/server/api-response";

const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "MyAI API",
    version: "0.1.0",
    description: "Documented contracts for public and authenticated MyAI API routes.",
  },
  servers: [{ url: "/api" }],
  paths: {
    "/account/profile": {
      get: {
        summary: "Get the authenticated user's profile",
        tags: ["Account"],
        responses: {
          "200": {
            description: "Profile loaded",
          },
          "401": {
            description: "Authentication required",
          },
          "404": {
            description: "Profile not found",
          },
        },
      },
      post: {
        summary: "Update the authenticated user's profile",
        tags: ["Account"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProfileUpdate" },
            },
          },
        },
        responses: {
          "200": { description: "Profile updated" },
          "400": { description: "Invalid profile payload" },
          "401": { description: "Authentication required" },
          "403": { description: "Cross-site request blocked" },
        },
      },
    },
    "/health": {
      get: {
        summary: "Health check",
        tags: ["System"],
        responses: {
          "200": { description: "System is healthy" },
        },
      },
    },
  },
  components: {
    schemas: {
      ApiError: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: {},
            },
          },
        },
      },
      ProfileUpdate: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120 },
          image: { type: "string", format: "uri" },
          bio: { type: "string", maxLength: 240 },
          phoneNumber: { type: "string", maxLength: 40 },
          themeAccent: { type: "string", maxLength: 20 },
          highContrast: { type: "boolean" },
          onboardingCompleted: { type: "boolean" },
          privacySettings: {
            type: "object",
            properties: {
              profileVisibility: { enum: ["public", "team", "private"] },
              emailVisible: { type: "boolean" },
              notificationsEnabled: { type: "boolean" },
              securityQuestion: { type: "string", maxLength: 240 },
              securityAnswerHint: { type: "string", maxLength: 240 },
            },
          },
        },
      },
    },
  },
};

export function GET() {
  return apiJson(openApiDocument, {
    headers: {
      "cache-control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
