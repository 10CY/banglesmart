import {env} from '../config/env.js'; export function imageUrl(v){if(!v)return null;if(/^https?:\/\//i.test(v))return v;return `${env.BACKEND_URL}/storage/${String(v).replace(/^\/+/, '')}`}
