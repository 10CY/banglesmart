"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Subscriber = { id:number; email:string; status:string; source:string; subscribed_at:string|null; };

export default function NewsletterAdminPage(){
  const [rows,setRows]=useState<Subscriber[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  async function load(){
    try{setLoading(true); const r=await apiFetch('/admin/newsletter'); const j=await r.json(); if(!r.ok) throw new Error(j?.message||'Unable to load subscribers.'); setRows(Array.isArray(j?.data)?j.data:[]);}catch(e){setError(e instanceof Error?e.message:'Unable to load subscribers.');}finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  async function remove(id:number){if(!window.confirm('Remove this subscriber?')) return; const r=await apiFetch(`/admin/newsletter/${id}`,{method:'DELETE'}); const j=await r.json(); if(!r.ok){setError(j?.message||'Unable to remove subscriber.');return;} void load();}
  return <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#c9a227]">Marketing</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold text-gray-900">Newsletter Subscribers</h1><p className="mt-1 text-sm text-gray-500">Manage customers who opted in to collection updates.</p></div><div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold shadow-sm">{rows.length} subscribers</div></div>{error&&<div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}<div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">{loading?<div className="p-8 text-sm text-gray-500">Loading subscribers...</div>:rows.length===0?<div className="p-12 text-center text-sm text-gray-500">No subscribers yet.</div>:<div className="divide-y divide-gray-100">{rows.map(row=><div key={row.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div><p className="font-medium text-gray-900">{row.email}</p><p className="mt-1 text-xs text-gray-500">{row.status} · {row.source}</p></div><button onClick={()=>void remove(row.id)} className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"><Trash2 size={14}/> Remove</button></div>)}</div>}</div></div>;
}
