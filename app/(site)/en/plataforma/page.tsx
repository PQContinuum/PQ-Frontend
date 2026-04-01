import { Metadata } from "next";
import { SiteHeader, SiteFooter, BgMesh } from "@/components/site";

export const metadata: Metadata = {
  title: "Tools - ContinuumAI",
};

export default function PlatformPageEN() {
  return (
    <>
      <BgMesh orbs={3} />
      <SiteHeader lang="en" />

      <main>
        {/* ── Title Section ── */}
        <section className="section-padding text-center">
          <div className="container reveal">
            <h1 className="section-title">
              An AI platform to{" "}
              <span className="text-accent">create, produce and decide.</span>
            </h1>
            <p className="hero-subtitle">
              Everything you need, integrated in one intelligent flow.
            </p>
          </div>
        </section>

        {/* ── Bento Grid ── */}
        <section className="section-padding tools-grid-section">
          <div className="container">
            <div className="bento-grid">
              {/* 1 ── Chat ── */}
              <div className="bento-card b-large reveal">
                <div className="card-content">
                  <h3 className="card-title">
                    Intelligent chat with continuous reasoning
                  </h3>
                  <p className="card-desc">
                    Speak as you think. ContinuumAI organizes your intent and
                    responds with clear direction: strategy, writing, decisions,
                    support or planning.
                  </p>
                  <p className="card-note">
                    Ideal for long sessions without losing coherence.
                  </p>
                </div>
              </div>

              {/* 2 ── Docs ── */}
              <div className="bento-card b-medium reveal">
                <div className="card-content">
                  <h3 className="card-title">
                    Turn documents into decisions
                  </h3>
                  <p className="card-desc">
                    Upload PDFs and files. Extract key points, summarize,
                    compare and detect information without mental fatigue.
                  </p>
                  <p className="card-note">
                    Less unnecessary reading. More executive clarity.
                  </p>
                </div>
              </div>

              {/* 3 ── Images ── */}
              <div className="bento-card b-medium reveal">
                <div className="card-content">
                  <h3 className="card-title">
                    Premium images ready to publish
                  </h3>
                  <p className="card-desc">
                    Create visuals for branding, campaigns or products. No extra
                    tools needed.
                  </p>
                  <p className="card-note">
                    Generative image generator.
                  </p>
                </div>
              </div>

              {/* 4 ── Video ── */}
              <div className="bento-card b-large reveal">
                <div className="card-content">
                  <h3 className="card-title">
                    Create videos with structured AI
                  </h3>
                  <p className="card-desc">
                    From concept to final clip. Real creative control without
                    leaving the platform.
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
                    <span className="badge">4s clips</span>
                    <span className="badge" style={{ background: "var(--accent)" }}>
                      12s production
                    </span>
                    <span className="badge">Built-in audio</span>
                  </div>
                </div>
              </div>

              {/* 5 ── Analyzer ── */}
              <div className="bento-card b-medium reveal">
                <div className="card-content">
                  <h3 className="card-title" style={{ color: "var(--accent-secondary)" }}>
                    Network &amp; Web Analyzer
                  </h3>
                  <p className="card-desc">
                    Integrate links, social profiles or entire domains. The AI
                    extracts context, tone and structure automatically.
                  </p>
                  <p className="card-note">
                    Competitive audit in seconds.
                  </p>
                </div>
              </div>

              {/* 6 ── Audio ── */}
              <div className="bento-card b-large reveal">
                <div className="card-content">
                  <h3 className="card-title">
                    Audio, narration and voice by intent
                  </h3>
                  <p className="card-desc">
                    Generate voiceovers, narrations and versions by tone and
                    rhythm. Perfect for courses and ads.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter lang="en" />
    </>
  );
}
