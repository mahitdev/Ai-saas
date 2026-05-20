# Database Notes

The schema is defined in `src/db/schema.ts` with Drizzle.

Current performance guardrails:

- Keep ownership and lookup indexes near foreign keys, such as `session.userId`, `project.ownerId`, and `aiConversation.userId`.
- Prefer bounded queries with explicit `limit` values for route handlers.
- Add query timing logs around routes that perform multi-step reads or joins.
- Watch for N+1 reads in dashboard pages that render lists with per-item detail fetches.

When adding a table, document:

- Ownership model
- Primary read paths
- Indexes that support those paths
- Retention or deletion behavior
