import type { NextRequest } from "next/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@wifo/api";

import { auth } from "~/auth/server";
import { env } from "~/env";

const ALLOWED_ORIGINS = new Set(
  env.NODE_ENV === "production"
    ? ["https://bookings.padelhub.pe"]
    : ["https://bookings.padelhub.pe", "http://localhost:3002"],
);

function setCorsHeaders(req: NextRequest, res: Response) {
  const origin = req.headers.get("origin") ?? "";
  if (ALLOWED_ORIGINS.has(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  }
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  res.headers.set("Access-Control-Allow-Credentials", "true");
}

export const OPTIONS = (req: NextRequest) => {
  const response = new Response(null, {
    status: 204,
  });
  setCorsHeaders(req, response);
  return response;
};

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
      console.error(`[tRPC] Error on '${path}': ${error.message}`);
    },
  });

  setCorsHeaders(req, response);
  return response;
};

export { handler as GET, handler as POST };
