import { Metadata } from "next";
import { SiteHeader, SiteFooter, BgMesh, AuthCta } from "@/components/site";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing - ContinuumAI",
};

/* ── plan data ── */
const plans = [
  {
    name: "BASIC",
    price: "$10 USD/mo",
    priceSub: "(~$200 MXN)",
    label: "Individual User",
    target: "Students, freelancers, emerging creators",
    cta: { text: "Get Started", href: "/chat", variant: "outline" as const },
    features: [
      "AI Chat with limited memory",
      "Image generation (monthly limit)",
      "Basic short video",
      "1 character",
      "1 storage space",
      "Standard security",
    ],
    limits: ["Limited monthly tokens", "No API"],
    featured: false,
  },
  {
    name: "PRO",
    price: "$20 USD/mo",
    priceSub: "(~$400 MXN)",
    label: "Professional / Creator",
    target: "Content creators, consultants, small businesses",
    cta: { text: "Free Trial", href: "/chat", variant: "default" as const },
    features: [
      "Advanced AI Chat (extended memory)",
      "Advanced video",
      "5 characters",
      "Expanded storage",
      "Simple automations",
      "Basic analytics dashboard",
      "Partial API access",
    ],
    note: "Best cost-performance ratio vs OpenAI + external tools. Everything centralized.",
    featured: true,
  },
  {
    name: "PREMIUM",
    price: "$149 USD/mo",
    priceSub: "(~$2,980 MXN)",
    label: "Business / Agency",
    target: "Agencies, marketing teams, startups",
    cta: {
      text: "Contact Sales",
      href: "mailto:ventas@continuumai.app",
      variant: "outline" as const,
    },
    features: [
      "Multi-user (10)",
      "Extended video",
      "AI trainable with your data",
      "Complex automations",
      "Full API",
      "CRM integration",
      "Advanced dashboard",
      "Basic predictive security",
    ],
    differentiator: "Partial white-label, Role-based admin control",
    featured: false,
  },
  {
    name: "ENTERPRISE",
    price: "Custom",
    priceSub: "",
    label: "Corporate",
    target: "Institutions, corporations, large universities",
    cta: {
      text: "See Enterprise",
      href: "/en/corporativo",
      variant: "outline" as const,
    },
    features: [
      "Multi-tenant",
      "Dedicated/hybrid server",
      "Advanced predictive security",
      "Behavior monitoring",
      "Department-specific AI",
      "ERP/LMS integration",
      "SLA and priority support",
    ],
    note: "This is where the real margin and institutional scalability of the platform lies.",
    featured: false,
  },
];

export default function PricingPageEN() {
  return (
    <>
      <BgMesh orbs={1} />
      <SiteHeader lang="en" />

      <main>
        {/* ── Hero ── */}
        <section className="section-padding text-center">
          <div className="container reveal">
            <h1 className="section-title">
              Choose your plan.{" "}
              <span className="text-accent">Scale when you need it.</span>
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
                    Basic Access
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
                    Free for 7 days
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
                  Enjoy full, unrestricted access to the platform. After your
                  trial, you must choose a plan to continue with advanced benefits
                  or your account will switch to restricted mode.
                </p>

                <AuthCta lang="en" size="large" fallbackLabel="Activate Free Trial" className="btn-primary large" />
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

      <SiteFooter lang="en" />
    </>
  );
}
