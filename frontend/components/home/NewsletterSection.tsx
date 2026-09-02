"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { storeApiFetch } from "@/lib/storeApi";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || loading) return;
    try {
      setLoading(true);
      setError("");
      const response = await storeApiFetch("/store/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.message || "Unable to subscribe.");
      setDone(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to subscribe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="px-5 py-16 lg:px-10">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#111827] px-6 py-12 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.25em] text-[#d8b75b]">Private Collection Notes</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">A little luxury, delivered to your inbox.</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/60">Be the first to know about new collections, festive edits and exclusive offers.</p>
        </div>
        <form onSubmit={submit} className="mt-7 max-w-lg lg:mt-0">
          <div className="flex rounded-full border border-white/15 bg-white/5 p-1">
            <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
              <Mail size={17} className="text-white/50" />
              <input type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setDone(false); setError(""); }} placeholder="Your email address" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/40" />
            </div>
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-full bg-[#c9a227] px-5 py-3 text-xs font-semibold text-[#111827] disabled:opacity-60">
              {loading ? "Saving..." : done ? "Subscribed" : "Subscribe"}
              {done ? <CheckCircle2 size={14} /> : <ArrowRight size={14} />}
            </button>
          </div>
          {error && <p className="mt-2 px-4 text-xs text-red-300">{error}</p>}
          {done && <p className="mt-2 px-4 text-xs text-white/60">You’ll receive future BanglesMart updates at this address.</p>}
        </form>
      </div>
    </section>
  );
}
