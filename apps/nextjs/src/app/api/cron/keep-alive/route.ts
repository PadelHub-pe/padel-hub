import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

import { runKeepAlive } from "@wifo/api/lib/keep-alive";
import { db } from "@wifo/db/client";

import { env } from "~/env";
import { isCronAuthorized } from "~/lib/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!isCronAuthorized(authHeader, env.CRON_SECRET)) {
    if (!env.CRON_SECRET) {
      console.error(
        "[keep-alive] CRON_SECRET is not configured — rejecting request",
      );
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redis = getRedis();
  const result = await runKeepAlive({ db, redis });

  return NextResponse.json(result);
}

export const POST = GET;

function getRedis(): Redis | null {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}
