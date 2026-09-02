import mysql from "mysql2/promise";
import fs from "fs";

import { env } from "./config/env.js";

let ssl;

if (env.DB_ENABLE_SSL) {
  ssl = {
    minVersion: "TLSv1.2",
    rejectUnauthorized: true,
  };

  if (
    env.DB_CA_PATH &&
    fs.existsSync(env.DB_CA_PATH)
  ) {
    ssl.ca = fs.readFileSync(
      env.DB_CA_PATH
    );
  }
}

export const pool = mysql.createPool({
  host: env.DB_HOST,

  port: env.DB_PORT,

  user: env.DB_USERNAME,

  password: env.DB_PASSWORD,

  database: env.DB_DATABASE,

  waitForConnections: true,

  connectionLimit: 10,

  dateStrings: true,

  ...(env.DB_ENABLE_SSL
    ? { ssl }
    : {}),
});

export async function query(
  sql,
  params = []
) {
  const [rows] =
    await pool.execute(
      sql,
      params
    );

  return rows;
}

export async function transaction(
  fn
) {
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result =
      await fn(connection);

    await connection.commit();

    return result;
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
}