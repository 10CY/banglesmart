import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { env } from "../config/env.js";

const allowed = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Check whether Cloudinary is configured
const useCloudinary =
  Boolean(env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(env.CLOUDINARY_API_KEY) &&
  Boolean(env.CLOUDINARY_API_SECRET);

// Configure Cloudinary
if (useCloudinary) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export function imageUpload(folder) {
  let storage;

  if (useCloudinary) {
    // ☁️ CLOUDINARY STORAGE
    storage = new CloudinaryStorage({
      cloudinary,

      params: {
        folder: `banglesmart/${folder}`,

        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],

        public_id: (_, file) => {
          const name = path
            .parse(file.originalname)
            .name
            .replace(/[^a-zA-Z0-9_-]/g, "-");

          return `${Date.now()}-${name}`;
        },
      },
    });
  } else {
    // 💻 LOCAL STORAGE FALLBACK
    const dir = path.resolve(env.STORAGE_DIR, folder);

    fs.mkdirSync(dir, {
      recursive: true,
    });

    storage = multer.diskStorage({
      destination: (_, __, cb) => cb(null, dir),

      filename: (_, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        cb(
          null,
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}${ext}`,
        );
      },
    });
  }

  return multer({
    storage,

    limits: {
      fileSize: 5 * 1024 * 1024,
    },

    fileFilter: (_, file, cb) => {
      cb(null, allowed.has(file.mimetype));
    },
  });
}