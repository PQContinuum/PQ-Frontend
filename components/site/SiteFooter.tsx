import Link from "next/link";

export function SiteFooter({ lang = "es" }: { lang?: "es" | "en" }) {
  const isEn = lang === "en";
  const base = isEn ? "/en" : "";

  const legalLinks = [
    { href: `${base}/legal/terminos`, label: isEn ? "Terms of Service" : "Terminos de servicio" },
    { href: `${base}/legal/terminos-enterprise`, label: isEn ? "Enterprise Terms" : "Terminos Enterprise" },
    { href: `${base}/legal/privacidad`, label: isEn ? "Privacy Policy" : "Politica de Privacidad" },
  ];

  return (
    <footer className="text-center section-padding" style={{ borderTop: "1px solid var(--border-color)", padding: "40px 0" }}>
      <div className="container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-continuum-cobre.svg" alt="ContinuumAI Logo" style={{ height: 24, marginBottom: 16, opacity: 0.8 }} />
        <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 16 }}>
          {isEn
            ? "\u00A9 2026 ContinuumAI LLC. All rights reserved."
            : "\u00A9 2026 ContinuumAI LLC. Todos los derechos reservados."}
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", alignItems: "center", marginBottom: 24 }}>
          <a href="https://www.facebook.com/continuumai" target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)", transition: "color 0.3s" }} aria-label="Facebook">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a href="https://www.instagram.com/continuumai" target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)", transition: "color 0.3s" }} aria-label="Instagram">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
          <Link href="/chat" className="btn-primary" style={{ padding: "8px 24px", fontSize: 14, borderRadius: 20 }}>
            {isEn ? "Try for free" : "Probar gratis"}
          </Link>
        </div>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", fontSize: 12, color: "var(--text-secondary)" }}>
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
