export const ok=(res,data={},status=200)=>res.status(status).json(data); export const fail=(res,message,status=400,extra={})=>res.status(status).json({success:false,message,...extra});
export const asyncHandler=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
export function parseJson(v, fallback=null){if(v==null)return fallback;if(typeof v==='object')return v;try{return JSON.parse(v)}catch{return fallback}}
