import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import { env } from "../src/config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const migrationsDir = path.join(backendRoot, "migrations");

let ssl;
if (env.DB_ENABLE_SSL) {
  const caPath = env.DB_CA_PATH
    ? path.resolve(backendRoot, env.DB_CA_PATH)
    : path.join(backendRoot, "src", "ca.pem");

  if (!fsSync.existsSync(caPath)) {
    throw new Error(`Database CA certificate not found at: ${caPath}`);
  }

  ssl = {
    rejectUnauthorized: true,
    ca: fsSync.readFileSync(caPath, "utf8"),
  };
}

const connection = await mysql.createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  multipleStatements: true,
  ...(ssl ? { ssl } : {}),
});

try {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY schema_migrations_filename_unique (filename)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const filename of files) {
    const [rows] = await connection.execute(
      "SELECT id FROM schema_migrations WHERE filename=? LIMIT 1",
      [filename],
    );

    if (rows[0]) {
      console.log(`Skipping already applied migration: ${filename}`);
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, filename), "utf8");
    console.log(`Applying migration: ${filename}`);
    await connection.query(sql);
    await connection.execute(
      "INSERT INTO schema_migrations (filename,applied_at) VALUES (?,NOW())",
      [filename],
    );
  }

  console.log("BanglesMart migrations completed.");
} finally {
  await connection.end();
}
