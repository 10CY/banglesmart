import bcrypt from "bcryptjs";
import { pool, query } from "../src/db.js";

function arg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((value) => value.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : "";
}

const name = arg("name") || "BanglesMart Admin";
const email = arg("email").toLowerCase();
const phone = arg("phone") || null;
const password = arg("password");

if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
  console.error("Provide a valid --email=admin@example.com");
  process.exitCode = 1;
} else if (password.length < 10) {
  console.error("Provide --password=... with at least 10 characters.");
  process.exitCode = 1;
} else {
  try {
    const hash = await bcrypt.hash(password, 12);
    const existing = (
      await query("SELECT id FROM users WHERE email=? LIMIT 1", [email])
    )[0];

    if (existing) {
      await query(
        `UPDATE users
         SET name=?,phone=?,password=?,role='admin',status='active',updated_at=NOW()
         WHERE id=?`,
        [name, phone, hash, existing.id],
      );
      console.log(`Admin account updated: ${email}`);
    } else {
      await query(
        `INSERT INTO users
          (name,email,phone,password,role,status,created_at,updated_at)
         VALUES (?,?,?,?,'admin','active',NOW(),NOW())`,
        [name, email, phone, hash],
      );
      console.log(`Admin account created: ${email}`);
    }
  } catch (error) {
    console.error("Unable to create admin:", error?.message || error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
