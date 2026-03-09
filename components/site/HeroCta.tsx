"use client";

import Link from "next/link";
import { useSession } from "./useSession";

export function HeroCta({ lang = "es" }: { lang?: "es" | "en" }) {
  const { email, initial } = useSession();
  const isEn = lang === "en";

  if (email) {
    return (
      <div className="hero-cta reveal">
        <Link href="/chat" className="site-user-pill large">
          <span className="site-user-avatar">{initial}</span>
          <span>{isEn ? "Continue creating" : "Continuar creando"}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
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
