import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode (useful for serverless, standard for Next.js)
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });