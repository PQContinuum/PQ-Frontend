import { Metadata } from "next";
import { SiteHeader, SiteFooter, BgMesh, AuthCta } from "@/components/site";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Suscripcion y Corporativo - ContinuumAI",
};

/* ── plan data ── */
const plans = [
  {
    name: "BASIC",
    price: "$10 USD/mes",
    priceSub: "(~$200 MXN)",
    label: "Usuario Individual",
    target: "Estudiantes, freelancers, creadores iniciando",
    cta: { text: "Comenzar", href: "/chat", variant: "outline" as const },
    features: [
      "Chat IA memoria limitada",
      "Generacion imagenes (limite mensual)",
      "Video corto basico",
      "1 personaje",
      "1 espacio almacenamiento",
      "Seguridad estandar",
    ],
    limits: ["Tokens mensuales limitados", "Sin API"],
    featured: false,
  },
  {
    name: "PRO",
    price: "$20 USD/mes",
    priceSub: "(~$400 MXN)",
    label: "Profesional / Creador",
    target: "Creadores de contenido, consultores, pequenas empresas",
    cta: { text: "Prueba Gratis", href: "/chat", variant: "default" as const },
    features: [
      "Chat IA avanzado (memoria extendida)",
      "Video avanzada",
      "5 personajes",
      "Almacenamiento ampliado",
      "Automatizaciones simples",
      "Dashboard analitico basico",
      "Acceso parcial API",
    ],
    note: "Mejor rendimiento costo-beneficio frente a OpenAI + herramientas externas. Todo centralizado.",
    featured: true,
  },
  {
    name: "PREMIUM",
    price: "$149 USD/mes",
    priceSub: "(~$2,980 MXN)",
    label: "Negocio / Agencia",
    target: "Agencias, equipos de marketing, startups",
    cta: {
      text: "Contactar Ventas",
      href: "mailto:ventas@continuumai.app",
      variant: "outline" as const,
    },
    features: [
      "Multiusuario (10)",
      "Video extendido",
      "IA entrenable datos propios",
      "Automatizaciones complejas",
      "API completa",
      "Integracion CRM",
      "Dashboard avanzado",
      "Seguridad predictiva basica",
    ],
    differentiator: "White-label parcial, Control administrativo por roles",
    featured: false,
  },
  {
    name: "ENTERPRISE",
    price: "Personalizado",
    priceSub: "",
    label: "Corporativo",
    target: "Instituciones, corporativos, grandes universidades",
    cta: {
      text: "Ver Enterprise",
      href: "/corporativo",
      variant: "outline" as const,
    },
    features: [
      "Multi-tenant",
      "Servidor dedicado/hibrido",
      "Seguridad predictiva avanzada",
      "Monitoreo comportamiento",
      "IA por departamento",
      "Integracion ERP/LMS",
      "SLA y soporte prioritario",
    ],
    note: "Aqui radica el verdadero margen y la escalabilidad institucional de la plataforma.",
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
                        ? "1px solid rgba(147,79,44,0.6)"
                        : "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.05)",
                      padding: "1.5rem",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      position: "relative",
                      boxShadow: isFeatured
                        ? "0 0 40px rgba(147,79,44,0.15)"
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
                        fontWeight: 600,
                        marginTop: "1rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {plan.label}
                    </p>
                    <p style={{ fontSize: "0.85rem", opacity: 0.6, lineHeight: 1.5 }}>
                      {plan.target}
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

                    {/* Limits (BASIC only) */}
                    {"limits" in plan && plan.limits && (
                      <div style={{ marginTop: "0.75rem", opacity: 0.5, fontSize: "0.8rem" }}>
                        {plan.limits.map((l) => (
                          <p key={l} style={{ margin: "0.15rem 0" }}>
                            {l}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Differentiator (PREMIUM) */}
                    {"differentiator" in plan && plan.differentiator && (
                      <p
                        style={{
                          marginTop: "0.75rem",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          opacity: 0.7,
                        }}
                      >
                        {plan.differentiator}
                      </p>
                    )}

                    {/* Note */}
                    {"note" in plan && plan.note && (
                      <p
                        style={{
                          marginTop: "0.75rem",
                          fontSize: "0.8rem",
                          fontStyle: "italic",
                          opacity: 0.55,
                          lineHeight: 1.5,
                        }}
                      >
                        {plan.note}
                      </p>
                    )}
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
