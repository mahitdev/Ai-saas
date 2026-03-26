const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

const statements = [
  `CREATE TABLE IF NOT EXISTS "user" (
    id text PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    email_verified boolean NOT NULL DEFAULT false,
    image text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  );`,
  `CREATE TABLE IF NOT EXISTS session (
    id text PRIMARY KEY,
    expires_at timestamp NOT NULL,
    token text NOT NULL UNIQUE,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    ip_address text,
    user_agent text,
    user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS session_userId_idx ON session(user_id);`,
  `CREATE TABLE IF NOT EXISTS account (
    id text PRIMARY KEY,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp,
    refresh_token_expires_at timestamp,
    scope text,
    password text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS account_userId_idx ON account(user_id);`,
  `CREATE TABLE IF NOT EXISTS verification (
    id text PRIMARY KEY,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);`,
  `CREATE TABLE IF NOT EXISTS project (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    owner_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS project_ownerId_idx ON project(owner_id);`,
  `DO $$ BEGIN CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `CREATE TABLE IF NOT EXISTS project_task (
    id text PRIMARY KEY,
    project_id text NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    owner_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    status task_status NOT NULL DEFAULT 'todo',
    due_date timestamp,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS project_task_projectId_idx ON project_task(project_id);`,
  `CREATE INDEX IF NOT EXISTS project_task_ownerId_idx ON project_task(owner_id);`
];

(async () => {
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log('Schema applied');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
