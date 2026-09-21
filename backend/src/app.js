import express from "express";
import cors from "cors";
import helmet from 'helmet';

import path from "path";

import { env } from "./config/env.js";
import { ok } from "./utils/http.js";
import admin from "./routes/admin.routes.js";
import customer from "./routes/customer.routes.js";
import store from "./routes/store.routes.js";
const app = express();
const isProduction = env.NODE_ENV === 'production';
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

app.use(
  helmet({
    xFrameOptions: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use("/api", apiRateLimit);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server or requests without Origin header (e.g., Postman, mobile apps)
    if (!origin) return callback(null, true);

    if (env.CORS_ORIGINS.includes(origin)) {
      return callback(null, true);
    } else {
      // Return false rather than throwing new Error()
      return callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: isProduction ? 86400 : 0,
};

app.use(cors(corsOptions));

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
