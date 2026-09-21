import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "./config/env.js";

/* -------------------------------------------------------------------------- */
/* CURRENT DIRECTORY                                                          */
/* -------------------------------------------------------------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------------------------------------------------------------- */
/* SSL CONFIGURATION                                                          */
/* -------------------------------------------------------------------------- */

let ssl;

if (env.DB_ENABLE_SSL) {
  const backendRoot = path.resolve(__dirname, "..");
  const caPath = env.DB_CA_PATH
    ? (path.isAbsolute(env.DB_CA_PATH)
        ? env.DB_CA_PATH
        : path.resolve(backendRoot, env.DB_CA_PATH))
    : path.join(__dirname, "ca.pem");

  console.log("Database SSL enabled");
  console.log("CA certificate path:", caPath);

  if (!fs.existsSync(caPath)) {
    throw new Error(
      `Database CA certificate not found at: ${caPath}`
    );
  }

  ssl = {
    rejectUnauthorized: true,
    ca: fs.readFileSync(caPath, "utf8"),
  };
}

/* -------------------------------------------------------------------------- */
/* MYSQL CONNECTION POOL                                                      */
/* -------------------------------------------------------------------------- */

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,

  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,

  ...(env.DB_ENABLE_SSL ? { ssl } : {}),
});

/* -------------------------------------------------------------------------- */
/* QUERY                                                                      */
/* -------------------------------------------------------------------------- */

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);

  return rows;
}

/* -------------------------------------------------------------------------- */
/* TRANSACTION                                                                */
/* -------------------------------------------------------------------------- */

export async function transaction(fn) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result = await fn(connection);

    await connection.commit();

    return result;
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
}