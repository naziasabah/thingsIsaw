"use client";

import { useState, type FormEvent } from "react";

export default function AccessForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setSent(true);
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex flex-col items-center gap-3 px-6 py-8 sm:py-10">
      <span className="pointer-events-auto font-mono text-[9px] uppercase tracking-[0.25em] text-black/45 sm:text-[10px]">
        Request Access
      </span>
      <form onSubmit={handleSubmit} className="pointer-events-auto flex items-center gap-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSent(false);
          }}
          placeholder="your@email.com"
          className="w-40 border-0 border-b border-black/25 bg-transparent px-0 pb-1 text-center font-mono text-[11px] uppercase tracking-[0.08em] text-black placeholder:text-black/30 focus:border-black/70 focus:outline-none sm:w-56"
        />
        <button
          type="submit"
          className="font-mono text-[10px] uppercase tracking-[0.25em] text-black/70 transition-colors hover:text-black"
        >
          {sent ? "Sent" : "Join"}
        </button>
      </form>
    </div>
  );
}
