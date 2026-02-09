import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const connectionString = process.env.POSTGRES_URL!;

const client = postgres(connectionString);

export const db = drizzle(client, {
  schema,
  casing: "snake_case",
});
