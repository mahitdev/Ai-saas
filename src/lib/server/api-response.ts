import { NextResponse } from "next/server";
import { z } from "zod";

import { logger } from "@/lib/server/logger";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "VALIDATION_ERROR"
  | "CSRF_ERROR"
  | "INTERNAL_SERVER_ERROR";

type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiJson<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function apiError(error: ApiError | Error | unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  logger.error("Unhandled API error", { error });
  return NextResponse.json<ApiErrorBody>(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected server error",
      },
    },
    { status: 500 },
  );
}

export function unauthorized(message = "Unauthorized") {
  return apiError(new ApiError(401, "UNAUTHORIZED", message));
}

export function notFound(message = "Resource not found"): never {
  throw new ApiError(404, "NOT_FOUND", message);
}

export async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "BAD_REQUEST", "Request body must be valid JSON");
  }
}

export async function validateJson<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  const body = await parseJson(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid request payload", parsed.error.flatten());
  }
  return parsed.data;
}

export function assertSameOrigin(request: Request) {
  const method = request.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return;

  const origin = request.headers.get("origin");
  if (!origin) return;

  const requestUrl = new URL(request.url);
  const requestOrigin = `${requestUrl.protocol}//${requestUrl.host}`;
  if (origin !== requestOrigin) {
    throw new ApiError(403, "CSRF_ERROR", "Cross-site request blocked");
  }
}

export function withApiHandler<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response> | Response,
) {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      return apiError(error);
    }
  };
}
