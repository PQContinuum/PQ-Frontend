import { Metadata } from "next";
import { SiteHeader, SiteFooter, BgMesh } from "@/components/site";

export const metadata: Metadata = {
  title: "Corporate - ContinuumAI",
};

export default function CorporatePageEN() {
  return (
    <>
      <BgMesh orbs={1} />
      <SiteHeader lang="en" />

      <main>
        {/* ── Hero ── */}
        <section className="section-padding text-center">
          <div className="container reveal">
            <h1 className="section-title">
              ContinuumAI{" "}
              <span className="text-accent">Corporate</span>
            </h1>
            <p className="hero-subtitle">
              Advanced solutions for institutions, industries and strategic
              projects.
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
                    Why do we develop vertical solutions?
                  </h3>
                  <p style={{ opacity: 0.75, lineHeight: 1.7 }}>
                    Generic AI platforms are not sufficient for institutional
                    environments. The security of sensitive data, data
                    sovereignty, and the precision demanded by industrial
                    processes require vertical implementations: dedicated models,
                    isolated infrastructure and total governance. That is why
                    ContinuumAI develops specialized solutions that adapt to the
                    structure, regulations and objectives of each organization.
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
                    Institutional platform designed for schools and universities.
                  </p>
                  <p className="card-note">
                    Predictive security, teacher dashboards, and full governance
                    with human supervision.
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
                    AI applied to logistics operations.
                  </p>
                  <p className="card-note">
                    Route optimization, processes, and predictive analysis
                    integrated with enterprise systems.
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
                    Advanced geostrategic intelligence.
                  </p>
                  <p className="card-note">
                    Cultural and economic analysis by region.
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
                    Predictive models of sociopolitical trends.
                  </p>
                  <p className="card-note">
                    Deep analysis of demographic and market variables for
                    high-impact decision making.
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
                    Deploy your own Exclusive Cognitive AI.
                  </p>
                  <p className="card-note">
                    Private and isolated infrastructure for companies requiring
                    total control over their models, data and cognitive agents.
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
                Interested in any of these services or looking to create an
                exclusive Cognitive AI for your company?
              </p>
              <a
                href="https://continuumai.llc"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-massive-glow"
              >
                Learn more at ContinuumAI.llc
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter lang="en" />
    </>
  );
}
