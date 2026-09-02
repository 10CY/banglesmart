"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { customerApiFetch } from "@/lib/customerApi";

export default function ResetPasswordPage(){
  const [email,setEmail]=useState("");
  const [token,setToken]=useState("");
  const [password,setPassword]=useState("");
  const [confirmation,setConfirmation]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    setEmail(params.get("email")||"");
    setToken(params.get("token")||"");
  },[]);

  async function submit(e:FormEvent){
    e.preventDefault();
    if(loading)return;
    try{
      setLoading(true);
      setMessage("");
      const r=await customerApiFetch("/customer/reset-password",{method:"POST",body:JSON.stringify({email,token,password,password_confirmation:confirmation})});
      const j=await r.json();
      if(!r.ok)throw new Error(j?.message||"Unable to reset password.");
      setMessage(j?.message||"Password reset successfully.");
      setPassword("");
      setConfirmation("");
    }catch(e){setMessage(e instanceof Error?e.message:"Unable to reset password.");}
    finally{setLoading(false);}
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#faf6ee] px-4 py-12"><div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm sm:p-10"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#c9a227]">Account Security</p><h1 className="mt-3 text-3xl font-semibold text-gray-900">Create a new password</h1><p className="mt-2 text-sm text-gray-500">Choose a strong password with at least 8 characters.</p><form onSubmit={submit} className="mt-7 space-y-4"><input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#c9a227]"/><input type="password" required minLength={8} value={confirmation} onChange={e=>setConfirmation(e.target.value)} placeholder="Confirm password" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#c9a227]"/><button disabled={loading||!token||!email} className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading?"Saving...":"Reset password"}</button></form>{message&&<p className="mt-4 rounded-xl bg-[#f8f1e5] p-4 text-sm text-gray-600">{message}</p>}{(!email||!token)&&<p className="mt-4 text-xs text-red-600">This reset link is missing or incomplete.</p>}<Link href="/login" className="mt-6 block text-center text-sm font-semibold text-[#8f0828]">Back to login</Link></div></main>
}
