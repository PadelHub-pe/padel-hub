import type { NextRequest } from "next/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@wifo/api";

import { auth } from "~/auth/server";

const handler = async (req: NextRequest) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () =>
      createTRPCContext({
        auth: auth,
        headers: req.headers,
      }),
    onError({ error, path }) {
      console.error(
        `>>> tRPC Error on '${path}': [${error.code}] ${error.message}`,
      );
    },
  });

  return response;
};

export { handler as GET, handler as POST };
