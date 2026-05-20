import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { unauthorized as apiUnauthorized } from "@/lib/server/api-response";

export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getAuthenticatedUser() {
  const session = await getServerSession();
  return session?.user ?? null;
}

export function unauthorized() {
  return apiUnauthorized();
}
