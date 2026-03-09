"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface NavLink {
  href: string;
  label: string;
  dropdown?: { href: string; label: string }[];
}

export function SiteHeader({ lang = "es" }: { lang?: "es" | "en" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    void getSupabaseBrowserClient().auth.getUser().then((res: { data: { user: { email?: string } | null } }) => {
      setUserEmail(res.data.user?.email ?? null);
    });
  }, []);

  const isEn = lang === "en";
  const base = isEn ? "/en" : "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add("nav-open");
    } else {
      document.body.classList.remove("nav-open");
    }
    return () => document.body.classList.remove("nav-open");
  }, [mobileOpen]);

  const navLinks: NavLink[] = [
    { href: `${base}/`, label: isEn ? "Home" : "Inicio" },
    {
      href: `${base}/quienes-somos`,
      label: isEn ? "About Us" : "Quienes Somos",
      dropdown: [{ href: `${base}/corporativo`, label: isEn ? "Corporate" : "Corporativo" }],
    },
    {
      href: `${base}/plataforma`,
      label: isEn ? "Platform" : "Plataforma",
      dropdown: [{ href: `${base}/comparativa`, label: isEn ? "Comparison" : "Comparativa" }],
    },
    { href: `${base}/precios`, label: isEn ? "Pricing" : "Suscripcion" },
  ];

  const isActive = (href: string) => {
    if (href === `${base}/`) {
      return pathname === `${base}/` || pathname === "/" || pathname === "/en";
    }
    return pathname.startsWith(href);
  };

  const esPath = pathname.replace(/^\/en(\/|$)/, "/");
  const enPath = pathname.startsWith("/en") ? pathname : `/en${pathname}`;

  return (
    <>
      <header className={`navbar${scrolled ? " scrolled" : ""}`}>
        <div className="nav-container">
          <Link href={`${base}/`} className="logo" aria-label="ContinuumAI">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-continuum-cobre.svg" alt="ContinuumAI Logo" className="logo-img" />
          </Link>

          <nav className="nav-links">
            {navLinks.map((link) =>
              link.dropdown ? (
                <div key={link.href} className="nav-item">
                  <Link href={link.href} className={isActive(link.href) ? "active" : ""}>
                    {link.label} <span className="chevron">&#9660;</span>
                  </Link>
                  <div className="dropdown">
                    {link.dropdown.map((item) => (
                      <Link key={item.href} href={item.href} className={isActive(item.href) ? "active" : ""}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link key={link.href} href={link.href} className={isActive(link.href) ? "active" : ""}>
                  {link.label}
                </Link>
              )
            )}
          </nav>

          <div className="nav-actions">
            <div style={{ display: "flex", gap: 8, marginRight: 16, alignItems: "center", fontWeight: 600, fontSize: 14 }}>
              <Link href={esPath} style={{ color: !isEn ? "var(--accent-primary)" : "#fff" }}>
                ES
              </Link>
              <span style={{ color: "var(--text-tertiary)" }}>|</span>
              <Link href={enPath} style={{ color: isEn ? "var(--accent-primary)" : "#fff" }}>
                EN
              </Link>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {userEmail ? (
                <Link
                  href="/chat"
                  className="btn-primary"
                  style={{ padding: "6px 14px", fontSize: 13, borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  {isEn ? "Go to Chat" : "Ir al Chat"} <span className="arrow">&#8594;</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth"
                    className="btn-secondary"
                    style={{ padding: "6px 14px", fontSize: 13, borderRadius: 20 }}
                  >
                    {isEn ? "Sign in" : "Iniciar sesion"}
                  </Link>
                  <Link
                    href="/chat"
                    className="btn-primary"
                    style={{ padding: "6px 14px", fontSize: 13, borderRadius: 20 }}
                  >
                    {isEn ? "Try for free" : "Probar gratis"} <span className="arrow">&#8594;</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          <button
            className="mobile-menu-btn"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div className="mobile-menu-panel" id="mobile-menu" aria-hidden={!mobileOpen}>
        <div className="mobile-menu-inner">
          <div style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 600, fontSize: 14 }}>
            <Link href={esPath} style={{ color: !isEn ? "var(--accent-primary)" : "#fff" }} onClick={() => setMobileOpen(false)}>
              ES
            </Link>
            <span style={{ color: "var(--text-tertiary)" }}>|</span>
            <Link href={enPath} style={{ color: isEn ? "var(--accent-primary)" : "#fff" }} onClick={() => setMobileOpen(false)}>
              EN
            </Link>
          </div>

          <div className="mobile-links">
            {navLinks.map((link) => (
              <div key={link.href} className="mobile-group">
                <Link href={link.href} className="mobile-link" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
                {link.dropdown && (
                  <div className="mobile-sublinks">
                    {link.dropdown.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mobile-actions" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {userEmail ? (
              <Link href="/chat" className="btn-primary large" onClick={() => setMobileOpen(false)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {isEn ? "Go to Chat" : "Ir al Chat"} <span className="arrow">&#8594;</span>
              </Link>
            ) : (
              <>
                <Link href="/auth" className="btn-secondary large" onClick={() => setMobileOpen(false)}>
                  {isEn ? "Sign in" : "Iniciar sesion"}
                </Link>
                <Link href="/chat" className="btn-primary large" onClick={() => setMobileOpen(false)}>
                  {isEn ? "Try for free" : "Probar gratis"} <span className="arrow">&#8594;</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
