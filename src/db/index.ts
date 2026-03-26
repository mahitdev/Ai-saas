import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

export const db = drizzle(env.DATABASE_URL, { schema });
