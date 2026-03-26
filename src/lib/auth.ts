import { betterAuth } from "better-auth";

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; 
import * as schema from "@/db/schema";
import { env } from "@/lib/env";



export const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
        enabled: true,
    },
   
   database: drizzleAdapter(db, {
        provider: "pg", 
        schema:{
            ...schema,
        }
    }),
});
