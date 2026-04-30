# Logicra Backend

This project now includes:

- Better Auth email/password authentication
- Drizzle + Postgres data layer
- Protected REST API for project and task management
- Health and current-user endpoints

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```env
DATABASE_URL=...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
```

3. Run the app:

```bash
npm run dev
```

## API Endpoints

- `GET /api/health` - liveness check
- `GET /api/me` - current authenticated user/session
- `GET /api/projects` - list current user's projects
- `POST /api/projects` - create project
- `GET /api/projects/:projectId` - fetch one project
- `PATCH /api/projects/:projectId` - update project
- `DELETE /api/projects/:projectId` - delete project
- `GET /api/projects/:projectId/tasks` - list project tasks
- `POST /api/projects/:projectId/tasks` - create task
- `GET /api/tasks/:taskId` - fetch one task
- `PATCH /api/tasks/:taskId` - update task
- `DELETE /api/tasks/:taskId` - delete task

All `/api/*` endpoints except `/api/health` and Better Auth routes require login.
