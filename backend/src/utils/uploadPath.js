/** Return the value persisted in image columns for local or Cloudinary multer files. */
export function uploadedImageValue(file, localFolder) {
  if (!file) return null;
  if (file.path && /^https?:\/\//i.test(String(file.path))) return String(file.path);
  if (!file.filename) return null;
  return `${localFolder}/${file.filename}`;
}
