import { Metadata } from "next";
import { SiteHeader, SiteFooter, BgMesh, AuthCta } from "@/components/site";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Suscripcion y Corporativo - ContinuumAI",
};

/* ── plan data (synced with /payment and backend plan-limits) ── */
const plans = [
  {
    name: "BASIC",
    price: "$0 USD/mes",
    priceSub: "Gratis",
    label: "Para creadores que inician",
    target: "",
    cta: { text: "Comenzar", href: "/payment", variant: "outline" as const },
    features: [
      "Chat con Continuum Core",
      "8 imagenes/dia (80/mes)",
      "3 videos/dia (15/mes)",
      "Calidad media de imagenes",
      "Videos con audio",
      "Image-to-Video",
      "Todos los aspect ratios",
    ],
    featured: false,
  },
  {
    name: "PRO",
    price: "$20 USD/mes",
    priceSub: "~$400 MXN/mes",
    label: "Para creadores y equipos",
    target: "",
    cta: { text: "Actualizar", href: "/payment", variant: "default" as const },
    features: [
      "Chat con Continuum Pro",
      "25 imagenes/dia (300/mes)",
      "8 videos/dia (60/mes)",
      "Maxima calidad (4K, 60fps)",
      "Videos largos (12s)",
      "Estilos premium",
      "TTS avanzado",
      "Memoria inteligente",
    ],
    featured: true,
  },
  {
    name: "PREMIUM",
    price: "$149 USD/mes",
    priceSub: "~$2,980 MXN/mes",
    label: "Para profesionales y agencias",
    target: "",
    cta: { text: "Actualizar", href: "/payment", variant: "outline" as const },
    features: [
      "Chat con Continuum Pro",
      "80 imagenes/dia (1,000/mes)",
      "25 videos/dia (200/mes)",
      "Todas las funciones premium",
      "Volumen alto de generacion",
      "Memoria extendida (1,000 items)",
      "Soporte prioritario",
    ],
    featured: false,
  },
  {
    name: "ENTERPRISE",
    price: "Personalizado",
    priceSub: "",
    label: "Para equipos y empresas",
    target: "",
    cta: {
      text: "Contactar ventas",
      href: "/corporativo",
      variant: "outline" as const,
    },
    features: [
      "Todo en Premium",
      "Limites personalizados",
      "Soporte dedicado",
      "SLA garantizado",
      "Facturacion corporativa",
      "Integraciones a medida",
    ],
    featured: false,
  },
];

export default function PreciosPage() {
  return (
    <>
      <BgMesh orbs={1} />
      <SiteHeader lang="es" />

      <main>
        {/* ── Hero ── */}
        <section className="section-padding text-center">
          <div className="container reveal">
            <h1 className="section-title">
              Elige tu plan.{" "}
              <span className="text-accent">Escala cuando lo necesites.</span>
            </h1>
          </div>
        </section>

        {/* ── Free Trial Banner ── */}
        <section className="section-padding" style={{ paddingTop: 0 }}>
          <div className="container">
            <div
              className="glass-card"
              style={{
                maxWidth: 900,
                margin: "0 auto",
                marginBottom: "2.5rem",
                position: "relative",
                overflow: "hidden",
                padding: "2.5rem",
              }}
            >
              {/* decorative orbs */}
              <div
                style={{
                  position: "absolute",
                  top: -40,
                  left: -40,
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  background: "var(--accent-secondary)",
                  opacity: 0.12,
                  filter: "blur(60px)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -30,
                  right: -30,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  opacity: 0.1,
                  filter: "blur(50px)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.75rem",
                    marginBottom: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
                    Acceso Basico
                  </h2>
                  <span
                    style={{
                      background: "var(--accent)",
                      color: "#fff",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    Gratis por 7 dias
                  </span>
                </div>

                <p
                  style={{
                    maxWidth: 640,
                    margin: "0 auto 1.5rem",
                    opacity: 0.8,
                    lineHeight: 1.6,
                  }}
                >
                  Disfruta de acceso total y sin restricciones a la plataforma.
                  Posterior a tu prueba, deberas elegir un plan para continuar con
                  los beneficios avanzados o tu cuenta pasara a modo restringido.
                </p>

                <AuthCta lang="es" size="large" fallbackLabel="Activar Prueba Gratis" className="btn-primary large" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing Grid ── */}
        <section className="section-padding" style={{ paddingTop: 0 }}>
          <div className="container">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "1.5rem",
              }}
              className="pricing-grid"
            >
              {plans.map((plan) => {
                const isFeatured = plan.featured;
                return (
                  <div
                    key={plan.name}
                    className="reveal"
                    style={{
                      borderRadius: "1rem",
                      border: isFeatured
                        ? "1px solid rgba(255,139,61,0.5)"
                        : "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.05)",
                      padding: "1.5rem",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      position: "relative",
                      boxShadow: isFeatured
                        ? "0 0 40px rgba(255,139,61,0.12)"
                        : "none",
                    }}
                  >
                    {/* MOST POPULAR badge */}
                    {isFeatured && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-0.75rem",
                          left: "50%",
                          transform: "translateX(-50%)",
                          background: "var(--accent)",
                          color: "#fff",
                          padding: "0.2rem 1rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Most Popular
                      </span>
                    )}

                    <p
                      style={{
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        opacity: 0.5,
                        marginBottom: "0.25rem",
                      }}
                    >
                      {plan.name}
                    </p>

                    <h3 style={{ fontSize: "1.6rem", fontWeight: 700, margin: "0.25rem 0" }}>
                      {plan.price}
                    </h3>
                    {plan.priceSub && (
                      <p style={{ fontSize: "0.85rem", opacity: 0.5, margin: 0 }}>
                        {plan.priceSub}
                      </p>
                    )}

                    <p
                      style={{
                        fontSize: "0.9rem",
                        opacity: 0.6,
                        marginTop: "0.75rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {plan.label}
                    </p>

                    {/* CTA */}
                    <div style={{ margin: "1.25rem 0" }}>
                      {plan.cta.href.startsWith("mailto:") ? (
                        <a
                          href={plan.cta.href}
                          className={
                            plan.cta.variant === "outline"
                              ? "btn-secondary"
                              : "btn-primary"
                          }
                          style={{ display: "inline-block" }}
                        >
                          {plan.cta.text}
                        </a>
                      ) : (
                        <Link
                          href={plan.cta.href}
                          className={
                            plan.cta.variant === "outline"
                              ? "btn-secondary"
                              : "btn-primary"
                          }
                        >
                          {plan.cta.text}
                        </Link>
                      )}
                    </div>

                    {/* Features */}
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          style={{
                            padding: "0.35rem 0",
                            fontSize: "0.9rem",
                            lineHeight: 1.5,
                          }}
                        >
                          <span className="text-accent" style={{ marginRight: "0.5rem" }}>
                            &rarr;
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>

                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* inline responsive style for the pricing grid */}
        <style>{`
          .pricing-grid {
            grid-template-columns: 1fr !important;
          }
          @media (min-width: 768px) {
            .pricing-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (min-width: 1280px) {
            .pricing-grid {
              grid-template-columns: repeat(4, 1fr) !important;
            }
          }
        `}</style>
      </main>

      <SiteFooter lang="es" />
    </>
  );
}
