import { createAuthClient } from "better-auth/react";
import {
  genericOAuthClient,
  multiSessionClient,
  passkeyClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [multiSessionClient(), passkeyClient(), genericOAuthClient()],
});
