import multer from "multer";
import path from "path";
import fs from "fs";

const allowed = new Set(["image/jpeg","image/png","image/webp","image/gif"]);
export function imageUpload(folder){
  const dir=path.resolve("storage",folder);
  fs.mkdirSync(dir,{recursive:true});
  const storage=multer.diskStorage({destination:(_,__,cb)=>cb(null,dir),filename:(_,file,cb)=>{const ext=path.extname(file.originalname).toLowerCase();cb(null,`${Date.now()}-${Math.random().toString(36).slice(2,10)}${ext}`)}});
  return multer({storage,limits:{fileSize:5*1024*1024},fileFilter:(_,file,cb)=>cb(null,allowed.has(file.mimetype))});
}
