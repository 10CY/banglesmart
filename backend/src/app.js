import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env.js";
import { ok } from "./utils/http.js";
import admin from "./routes/admin.routes.js";
import customer from "./routes/customer.routes.js";
import store from "./routes/store.routes.js";
const app = express();
const rateBuckets = new Map();
function apiRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.started > 60_000) {
    rateBuckets.set(key, { started: now, count: 1 });
    return next();
  }
  bucket.count += 1;
  if (bucket.count > 180) {
    return res.status(429).json({ success: false, message: "Too many requests. Please try again shortly." });
  }
  return next();
}

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

app.use(securityHeaders);
app.use("/api", apiRateLimit);
app.use(
  cors({
    origin: (o, cb) => {
      if (!o || env.CORS_ORIGINS.includes(o)) cb(null, true);
      else cb(new Error("CORS blocked"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/storage", express.static(path.resolve(env.STORAGE_DIR)));
app.get("/api/test", (req, res) =>
  ok(res, { success: true, message: "BanglesMart API  working" }),
);
app.use("/api/admin", admin);
app.use("/api/customer", customer);
app.use("/api/store", store);
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found." }),
);
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Server error." });
});
export default app;
