import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const connectionString = process.env.POSTGRES_URL!;

// Pin the Postgres session TZ to America/Lima so server-side date functions
// (`now()`, `current_date`, casts to/from `timestamp`) align with the wall clock
// the product targets. Without this, sessions inherit the server default (UTC
// on Supabase) and any naive `timestamp without time zone` round-trips drift
// by 5 hours. See docs/specs/bug-tz-lima.md.
const client = postgres(connectionString, {
  connection: {
    timezone: "America/Lima",
  },
});

export const db = drizzle(client, {
  schema,
  casing: "snake_case",
});
