import bcrypt from "bcryptjs";
import { query } from "@/lib/db/client";
import { schemaSql } from "@/lib/db/schema";

export async function initializeDatabase() {
  await query(schemaSql);

  const passwordHash = await bcrypt.hash("password123", 12);
  await query(
    `
    INSERT INTO users (email, password_hash, name)
    VALUES ($1, $2, $3)
    ON CONFLICT (email) DO NOTHING
    `,
    ["demo@company.com", passwordHash, "Demo User"]
  );
}
