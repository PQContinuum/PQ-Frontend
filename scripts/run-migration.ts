import { db } from "../db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function runMigration() {
  try {
    console.log("Reading migration file...");
    const migrationPath = path.join(
      __dirname,
      "../db/migrations/0002_strange_namor.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("Executing migration...");
    // Split by statement breakpoint
    const statements = migrationSQL
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      console.log("Executing:", statement.substring(0, 50) + "...");
      await db.execute(sql.raw(statement));
    }

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
