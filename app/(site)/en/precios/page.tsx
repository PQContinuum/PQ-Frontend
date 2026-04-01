import { Metadata } from "next";
import { SiteHeader, SiteFooter, BgMesh, AuthCta } from "@/components/site";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing - ContinuumAI",
};

/* ── plan data (synced with /payment and backend plan-limits) ── */
const plans = [
  {
    name: "FREE",
    price: "$0",
    priceSub: "",
    label: "Explore and try the platform",
    cta: { text: "Start free", href: "/chat", variant: "outline" as const },
    features: [
      "Chat with Continuum Lite",
      "3 images/day (10/month)",
      "1 short video/day (3/month)",
      "Basic Text-to-Speech",
      "Standard quality",
    ],
    featured: false,
  },
  {
    name: "BASIC",
    price: "$349 MXN/mo",
    priceSub: "",
    label: "For emerging creators",
    cta: { text: "Get Started", href: "/payment", variant: "outline" as const },
    features: [
      "Chat with Continuum Core",
      "8 images/day (80/month)",
      "3 videos/day (15/month)",
      "Medium quality images",
      "Videos with audio",
      "Image-to-Video",
      "All aspect ratios",
    ],
    featured: false,
  },
  {
    name: "PROFESSIONAL",
    price: "$1,499 MXN/mo",
    priceSub: "",
    label: "For creators and teams",
    cta: { text: "Upgrade", href: "/payment", variant: "default" as const },
    features: [
      "Chat with Continuum Pro",
      "25 images/day (300/month)",
      "8 videos/day (60/month)",
      "Max quality (4K, 60fps)",
      "Long videos (12s)",
      "Premium styles",
      "Advanced TTS",
      "Smart memory",
    ],
    featured: true,
  },
  {
    name: "ENTERPRISE",
    price: "$4,199 MXN/mo",
    priceSub: "",
    label: "For teams and businesses",
    cta: {
      text: "Get Started",
      href: "/payment",
      variant: "outline" as const,
    },
    features: [
      "Chat with Continuum Pro",
      "80 images/day (1,000/month)",
      "25 videos/day (200/month)",
      "All premium features",
      "High volume generation",
      "Extended memory (1,000 items)",
      "Priority support",
    ],
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

      <SiteFooter lang="en" />
    </>
  );
}
