"use client";

import Link from "next/link";
import { useSession } from "./useSession";

export function HeroCta({ lang = "es" }: { lang?: "es" | "en" }) {
  const { email, initial, ready } = useSession();
  const isEn = lang === "en";

  return (
    <div className="hero-cta reveal" style={{ opacity: ready ? 1 : 0, transition: "opacity 0.4s ease" }}>
      {email ? (
        <>
          <Link href="/chat" className="site-user-pill large">
            <span className="site-user-avatar">{initial}</span>
            <span>{isEn ? "Continue creating" : "Continuar creando"}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
          <Link href={isEn ? "/en/plataforma" : "/plataforma"} className="btn-secondary large">
            {isEn ? "See tools" : "Ver herramientas"}
          </Link>
        </>
      ) : (
        <>
          <Link href="/chat" className="btn-primary large">
            {isEn ? "Try for free" : "Probar gratis"} &rarr;
          </Link>
          <Link href={isEn ? "/en/plataforma" : "/plataforma"} className="btn-secondary large">
            {isEn ? "See tools" : "Ver herramientas"}
          </Link>
        </>
      )}
    </div>
  );
}
