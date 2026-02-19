import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { env } from "~/env";
import { createGateToken, getGateCookieOptions } from "~/lib/gate";

export async function POST(request: Request) {
  const sitePassword = env.ADMIN_SITE_PASSWORD;
  if (!sitePassword) {
    return NextResponse.json({ error: "Gate not configured" }, { status: 500 });
  }

  const body = (await request.json()) as { password?: string };
  if (!body.password || body.password !== sitePassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await createGateToken(sitePassword);
  const isSecure = request.url.startsWith("https");
  const cookieOptions = getGateCookieOptions(isSecure);

  const jar = await cookies();
  jar.set({ ...cookieOptions, value: token });

  return NextResponse.json({ ok: true });
}
