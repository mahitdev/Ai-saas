# ADR 0001: API Quality Foundation

## Status

Accepted

## Context

API routes were returning inconsistent error payloads and each route owned its own parsing, validation, and security checks. The app also lacked test runners, API documentation, and a first observability hook.

## Decision

- Use Vitest and React Testing Library for unit/component/hook tests.
- Use Playwright for browser and route-level E2E tests.
- Standardize API errors with `{ error: { code, message, details? } }`.
- Validate request bodies with Zod at route boundaries.
- Apply security headers and same-origin checks in middleware.
- Expose an OpenAPI document at `/api/docs/openapi`.
- Register OpenTelemetry through `@vercel/otel` for Node runtime deployments.

## Consequences

New and migrated API routes should use `withApiHandler`, `validateJson`, and typed `ApiError` responses. Existing routes can be migrated incrementally without blocking feature work.
