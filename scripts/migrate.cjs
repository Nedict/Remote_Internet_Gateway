#!/usr/bin/env node
const fs = require("node:fs/promises");
const path = require("node:path");
const { Pool } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const migrationsDir = path.resolve(__dirname, "../db/migrations");
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS rig_schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const files = (await fs.readdir(migrationsDir)).filter((name) => /^\d+_[a-z0-9_-]+\.sql$/i.test(name)).sort();
    for (const name of files) {
      const existing = await pool.query("SELECT 1 FROM rig_schema_migrations WHERE name = $1", [name]);
      if (existing.rowCount) continue;
      const contents = await fs.readFile(path.join(migrationsDir, name), "utf8");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(contents);
        await client.query("INSERT INTO rig_schema_migrations (name) VALUES ($1)", [name]);
        await client.query("COMMIT");
        console.log(`Applied ${name}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }
    console.log("Database migrations are up to date.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
});
