import "server-only";

import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { api } from "~/trpc/server";

/**
 * Server-side admin guard for page-level protection.
 * Call this in server components to verify the user is a platform admin.
 * Redirects to /login if unauthenticated or not an admin.
 */
export async function requireAdmin() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Use the tRPC caller to verify admin status via adminProcedure.
  // If the user is not a platform admin, this will throw FORBIDDEN.
  try {
    const caller = await api();
    await caller.admin.getStats();
  } catch {
    redirect("/login");
  }

  return { session };
}
