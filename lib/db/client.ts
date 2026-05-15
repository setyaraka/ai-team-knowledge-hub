import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { env } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

export const pool =
  globalThis.pgPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.pgPool = pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  const startedAt = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    console.info("db.query", { durationMs: Date.now() - startedAt, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error("db.query.error", { text, error });
    throw error;
  }
}

export function vectorLiteral(values: number[]): string {
  return `[${values.map((value) => Number(value).toFixed(8)).join(",")}]`;
}
