import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { InviteRegisterForm } from "./_components/invite-register-form";
import { NoInviteMessage } from "./_components/no-invite-message";

interface RegisterPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return <NoInviteMessage />;
  }

  prefetch(trpc.invite.validate.queryOptions({ token }));

  return (
    <HydrateClient>
      <Suspense fallback={<RegisterSkeleton />}>
        <InviteRegisterForm token={token} />
      </Suspense>
    </HydrateClient>
  );
}

function RegisterSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md animate-pulse space-y-4 rounded-lg border bg-white p-8">
        <div className="mx-auto h-8 w-48 rounded bg-gray-200" />
        <div className="h-4 w-64 rounded bg-gray-200" />
        <div className="space-y-3">
          <div className="h-10 rounded bg-gray-200" />
          <div className="h-10 rounded bg-gray-200" />
          <div className="h-10 rounded bg-gray-200" />
          <div className="h-10 rounded bg-gray-200" />
        </div>
        <div className="h-10 rounded bg-gray-200" />
      </div>
    </div>
  );
}
