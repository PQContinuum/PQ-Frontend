import { Metadata } from "next";
import { SiteHeader, SiteFooter, BgMesh } from "@/components/site";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Corporativo - ContinuumAI",
};

export default function CorporativoPage() {
  return (
    <>
      <BgMesh orbs={1} />
      <SiteHeader lang="es" />

      <main>
        {/* ── Hero ── */}
        <section className="section-padding text-center">
          <div className="container reveal">
            <h1 className="section-title">
              ContinuumAI{" "}
              <span className="text-accent">Corporativo</span>
            </h1>
            <p className="hero-subtitle">
              Soluciones avanzadas para instituciones, industrias y proyectos
              estrategicos.
            </p>
          </div>
        </section>

        {/* ── Intro Card ── */}
        <section className="section-padding" style={{ paddingTop: 0 }}>
          <div className="container">
            <div
              className="glass-card reveal"
              style={{
                maxWidth: 900,
                margin: "0 auto",
                borderTop: "2px solid var(--accent)",
                padding: "2.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                }}
              >
                {/* icon */}
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginTop: 2 }}
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <div>
                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      marginBottom: "0.75rem",
                    }}
                  >
                    &iquest;Por que desarrollamos soluciones verticales?
                  </h3>
                  <p style={{ opacity: 0.75, lineHeight: 1.7 }}>
                    Las plataformas de IA generica no son suficientes para entornos
                    institucionales. La seguridad de datos sensibles, la soberania
                    sobre la informacion, y la precision que exigen los procesos
                    industriales requieren implementaciones verticales: modelos
                    dedicados, infraestructura aislada y gobernanza total. Por eso,
                    ContinuumAI desarrolla soluciones especializadas que se adaptan
                    a la estructura, normativas y objetivos de cada organizacion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bento Grid ── */}
        <section className="section-padding bg-darker">
          <div className="container">
            <div className="bento-grid">
              {/* 1 ── Education ── */}
              <div className="bento-card b-medium corporate-card reveal">
                <div className="card-content">
                  <div className="corporate-icon">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
                    </svg>
                  </div>
                  <h3 className="card-title">ContinuumAI for Education</h3>
                  <p className="card-desc">
                    Plataforma institucional disenada para colegios y universidades.
                  </p>
                  <p className="card-note">
                    Seguridad predictiva, paneles docentes, y gobernanza total con
                    supervision humana.
                  </p>
                </div>
              </div>

              {/* 2 ── Logistics ── */}
              <div className="bento-card b-medium corporate-card reveal">
                <div className="card-content">
                  <div className="corporate-icon">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="1" y="3" width="15" height="13" rx="2" />
                      <path d="M16 8h4l3 3v5h-7V8z" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>
                  <h3 className="card-title">ContinuumAI Logistics</h3>
                  <p className="card-desc">
                    IA aplicada a operaciones logisticas.
                  </p>
                  <p className="card-note">
                    Optimizacion de rutas, procesos, y analisis predictivo integrado
                    con sistemas empresariales.
                  </p>
                </div>
              </div>

              {/* 3 ── Geocultura AI ── */}
              <div className="bento-card b-medium corporate-card reveal">
                <div className="card-content">
                  <div className="corporate-icon">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <h3 className="card-title">Geocultura AI</h3>
                  <p className="card-desc">
                    Inteligencia geoestrategica avanzada.
                  </p>
                  <p className="card-note">
                    Analisis cultural y economico por region.
                  </p>
                </div>
              </div>

              {/* 4 ── Geocultura Estrategica ── */}
              <div className="bento-card b-medium corporate-card reveal">
                <div className="card-content">
                  <div className="corporate-icon">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>
                  <h3 className="card-title">Geocultura Estrategica</h3>
                  <p className="card-desc">
                    Modelos predictivos de tendencias sociopoliticas.
                  </p>
                  <p className="card-note">
                    Analisis profundo de variables demograficas y de mercado para
                    toma de decisiones de alto impacto.
                  </p>
                </div>
              </div>

              {/* 5 ── Server SaaS ── */}
              <div className="bento-card b-medium corporate-card reveal">
                <div className="card-content">
                  <div className="corporate-icon">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="2" width="20" height="8" rx="2" />
                      <rect x="2" y="14" width="20" height="8" rx="2" />
                      <line x1="6" y1="6" x2="6.01" y2="6" />
                      <line x1="6" y1="18" x2="6.01" y2="18" />
                    </svg>
                  </div>
                  <h3 className="card-title">ContinuumAI Server (SaaS)</h3>
                  <p className="card-desc">
                    Implementa tu propia IA Cognitiva Exclusiva.
                  </p>
                  <p className="card-note">
                    Infraestructura privada y aislada para empresas que requieren
                    control total sobre sus modelos, datos y agentes cognitivos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="section-padding">
          <div className="container">
            <div className="cta-banner reveal" style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "1.15rem",
                  lineHeight: 1.7,
                  maxWidth: 700,
                  margin: "0 auto 1.5rem",
                }}
              >
                &iquest;Te interesa alguno de estos servicios o buscas crear una IA
                Cognitiva exclusiva para tu empresa?
              </p>
              <a
                href="https://continuumai.llc"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-massive-glow"
              >
                Conocer mas en ContinuumAI.llc
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter lang="es" />
    </>
  );
}
