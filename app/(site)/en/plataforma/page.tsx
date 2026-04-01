import { Metadata } from "next";
import { SiteHeader, SiteFooter, BgMesh, AuthCta } from "@/components/site";

export const metadata: Metadata = {
  title: "Platform - ContinuumAI",
  description: "Chat, images, video, audio, documents and web analysis in one intelligent flow.",
};

export default function PlatformPageEN() {
  return (
    <>
      <BgMesh orbs={3} />
      <SiteHeader lang="en" />

      <main>
        {/* ── Hero ── */}
        <section className="hero">
          <div className="container hero-content">
            <h1 className="hero-title reveal">
              Everything you create.{" "}
              <span className="text-gradient">One place.</span>
            </h1>
            <p className="hero-subheadline reveal">
              Chat, images, video, audio, documents and web analysis
              integrated in a flow that doesn&apos;t break.
            </p>
          </div>
        </section>

        {/* ── Tools Grid ── */}
        <section className="section-padding">
          <div className="container">
            <h2 className="section-title reveal">
              Tools that{" "}
              <span className="text-accent">work together</span>
            </h2>

            <div className="bento-grid">
              {/* 1 ── Chat ── */}
              <div className="bento-card b-large reveal">
                <div className="card-content">
                  <span className="card-note">Chat</span>
                  <h3 className="card-title">
                    Continuous reasoning, not loose answers
                  </h3>
                  <p className="card-desc">
                    Speak as you think. ContinuumAI organizes your intent and
                    responds with clear direction: strategy, writing, decisions
                    or planning.
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
                    <span className="badge">Persistent memory</span>
                    <span className="badge" style={{ background: "var(--accent)" }}>
                      Long sessions
                    </span>
                    <span className="badge">Accumulated context</span>
                  </div>
                </div>
              </div>

              {/* 2 ── Docs ── */}
              <div className="bento-card b-medium reveal">
                <div className="card-content">
                  <span className="card-note">Documents</span>
                  <h3 className="card-title">
                    From file to decision in seconds
                  </h3>
                  <p className="card-desc">
                    Upload PDFs and files. Extract key points, summarize,
                    compare and detect information without mental fatigue.
                  </p>
                </div>
              </div>

              {/* 3 ── Images ── */}
              <div className="bento-card b-medium reveal">
                <div className="card-content">
                  <span className="card-note">Images</span>
                  <h3 className="card-title">
                    Visuals ready to publish
                  </h3>
                  <p className="card-desc">
                    Generate images for branding, campaigns or products.
                    Multiple styles and qualities in one click.
                  </p>
                </div>
              </div>

              {/* 4 ── Video ── */}
              <div className="bento-card b-large reveal">
                <div className="card-content">
                  <span className="card-note">Video</span>
                  <h3 className="card-title">
                    From prompt to final clip
                  </h3>
                  <p className="card-desc">
                    Generate videos with synchronized audio. Real creative
                    control without leaving the platform.
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
                  <span className="card-note">Analysis</span>
                  <h3 className="card-title">
                    Web and social audit in seconds
                  </h3>
                  <p className="card-desc">
                    Integrate links, social profiles or full domains.
                    Extract context, tone and structure automatically.
                  </p>
                </div>
              </div>

              {/* 6 ── Audio ── */}
              <div className="bento-card b-large reveal">
                <div className="card-content">
                  <span className="card-note">Audio</span>
                  <h3 className="card-title">
                    Voice, narration and voiceovers by intent
                  </h3>
                  <p className="card-desc">
                    Generate natural voices with tone and rhythm control.
                    Perfect for courses, podcasts and ads.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Differentiator ── */}
        <section className="section-padding">
          <div className="container reveal" style={{ textAlign: "center" }}>
            <h2 className="section-title">
              Not separate tools.{" "}
              <span className="text-accent">One flow.</span>
            </h2>
            <p className="hero-subtitle" style={{ marginBottom: "2.5rem" }}>
              Other platforms give you one tool per tab.
              ContinuumAI connects everything in the same conversation:
              ask for text, generate the image, produce the video and narrate the audio
              without switching windows.
            </p>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="section-padding">
          <div className="container" style={{ textAlign: "center" }}>
            <h2 className="section-title reveal">
              Start creating with{" "}
              <span className="text-gradient">ContinuumAI</span>
            </h2>
            <div className="reveal" style={{ marginTop: 32 }}>
              <AuthCta lang="en" size="large" fallbackLabel="Try for free &rarr;" className="btn-primary large" />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter lang="en" />
    </>
  );
}
