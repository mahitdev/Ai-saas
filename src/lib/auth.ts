import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth, multiSession, twoFactor } from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

const sessionMaximum = Number.parseInt(env.AUTH_SESSION_MAXIMUM ?? "", 10);

const asPlugin = <T>(plugin: T) => plugin as unknown as import("better-auth").BetterAuthPlugin;

const authPlugins = [
  asPlugin(
    multiSession(Number.isFinite(sessionMaximum) ? { maximumSessions: sessionMaximum } : { maximumSessions: 8 }),
  ),
  asPlugin(twoFactor({
    issuer: env.AUTH_TWO_FACTOR_ISSUER || "AI Agent",
    backupCodeOptions: { amount: 8, length: 10 },
    totpOptions: {
      period: 30,
    },
    otpOptions: {
      sendOTP: async ({ user, otp }) => {
        console.info(`[auth] OTP for ${user.email}: ${otp}`);
      },
    },
  })),
  asPlugin(passkey({
    rpName: "AI Agent",
    rpID: new URL(env.BETTER_AUTH_URL).hostname,
    origin: env.BETTER_AUTH_URL,
  })),
];

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  authPlugins.push(
    asPlugin(genericOAuth({
      config: [
        {
          providerId: "google",
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          discoveryUrl: "https://accounts.google.com/.well-known/openid-configuration",
          pkce: true,
        },
      ],
    })),
  );
}

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  authPlugins.push(
    asPlugin(genericOAuth({
      config: [
        {
          providerId: "github",
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
          authorizationUrl: "https://github.com/login/oauth/authorize",
          tokenUrl: "https://github.com/login/oauth/access_token",
          userInfoUrl: "https://api.github.com/user",
          scopes: ["read:user", "user:email"],
        },
      ],
    })),
  );
}

if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
  authPlugins.push(
    asPlugin(genericOAuth({
      config: [
        {
          providerId: "microsoft",
          clientId: env.MICROSOFT_CLIENT_ID,
          clientSecret: env.MICROSOFT_CLIENT_SECRET,
          discoveryUrl:
            env.MICROSOFT_TENANT_ID
              ? `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID}/v2.0/.well-known/openid-configuration`
              : "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
          scopes: ["openid", "profile", "email", "User.Read"],
        },
      ],
    })),
  );
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  plugins: authPlugins,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
    },
  }),
});
