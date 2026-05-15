import { initializeDatabase } from "@/lib/db/init";
import { pool } from "@/lib/db/client";

initializeDatabase()
  .then(async () => {
    console.log("Database initialized. Seed user: demo@company.com / password123");
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
