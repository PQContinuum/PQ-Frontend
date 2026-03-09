"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function HeroCta({ lang = "es" }: { lang?: "es" | "en" }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const isEn = lang === "en";

  useEffect(() => {
    void getSupabaseBrowserClient().auth.getUser().then((res: { data: { user: { email?: string } | null } }) => {
      setUserEmail(res.data.user?.email ?? null);
    });
  }, []);

  if (userEmail) {
    return (
      <div className="hero-cta reveal">
        <Link href="/chat" className="btn-primary large" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          {isEn ? "Go to Chat" : "Ir al Chat"} &rarr;
        </Link>
        <Link href={isEn ? "/en/plataforma" : "/plataforma"} className="btn-secondary large">
          {isEn ? "See tools" : "Ver herramientas"}
        </Link>
      </div>
    );
  }

  return (
    <div className="hero-cta reveal">
      <Link href="/chat" className="btn-primary large">
        {isEn ? "Try for free" : "Probar gratis"} &rarr;
      </Link>
      <Link href={isEn ? "/en/plataforma" : "/plataforma"} className="btn-secondary large">
        {isEn ? "See tools" : "Ver herramientas"}
      </Link>
    </div>
  );
}
