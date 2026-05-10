import { createAuthClient } from "better-auth/react";
import type { BetterAuthClientPlugin } from "better-auth";
import {
  genericOAuthClient,
  multiSessionClient,
  passkeyClient,
} from "better-auth/client/plugins";

const asClientPlugin = <T>(plugin: T) => plugin as unknown as BetterAuthClientPlugin;

export const authClient = createAuthClient({
  plugins: [
    asClientPlugin(multiSessionClient()),
    asClientPlugin(passkeyClient()),
    asClientPlugin(genericOAuthClient()),
  ],
});
