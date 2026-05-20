# API Contracts

The machine-readable OpenAPI document is served from:

```text
/api/docs/openapi
```

New API routes should document request and response shapes in that document, validate inbound JSON with Zod, and return standardized errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": {}
  }
}
```

Preferred route pattern:

```ts
export const POST = withApiHandler(async function POST(request: Request) {
  assertSameOrigin(request);
  const payload = await validateJson(request, schema);
  return apiJson({ data: payload });
});
```
