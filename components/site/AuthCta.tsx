"use client";

import Link from "next/link";
import { useSession } from "./useSession";

/**
 * Session-aware CTA button. Shows personalized "Mi Espacio" when logged in,
 * falls back to the given label when not.
 */
export function AuthCta({
  lang = "es",
  size = "default",
  fallbackLabel,
  className = "btn-primary",
  style,
}: {
  lang?: "es" | "en";
  size?: "default" | "large";
  fallbackLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { email, initial } = useSession();
  const isEn = lang === "en";

  if (email) {
    return (
      <Link
        href="/chat"
        className={`site-user-pill${size === "large" ? " large" : ""}`}
        style={style}
      >
        <span className="site-user-avatar">{initial}</span>
        <span>{isEn ? "My Space" : "Mi Espacio"}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </Link>
    );
  }

  return (
    <Link href="/chat" className={className} style={style}>
      {fallbackLabel ?? (isEn ? "Try for free" : "Probar gratis")}
    </Link>
  );
}
