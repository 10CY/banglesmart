import fs from "fs/promises";
import path from "path";
import mysql from "mysql2/promise";
import { env } from "../src/config/env.js";

const file = path.resolve("migrations/20260902_ecommerce_upgrade.sql");
const sql = await fs.readFile(file, "utf8");
const connection = await mysql.createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  multipleStatements: true,
});
try {
  await connection.query(sql);
  console.log("BanglesMart ecommerce migration completed.");
} finally {
  await connection.end();
}
