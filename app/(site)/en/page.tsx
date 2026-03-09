import Link from "next/link";
import { SiteHeader, SiteFooter, BgMesh, HeroCta, AuthCta } from "@/components/site";

export const metadata = {
  title: "ContinuumAI - Not just any AI. Continuous reasoning.",
  description:
    "Artificial intelligence platform to generate images, create videos with AI, produce audio, read documents and chat with context.",
};

export default function HomePageEN() {
  return (
    <>
      <BgMesh orbs={3} />
      <SiteHeader lang="en" />

      {/* ── Hero ── */}
      <section className="hero">
        <div className="container hero-content">
          <h1 className="hero-title reveal">
            ContinuumAI is not just any AI.{" "}
            <span className="text-gradient">Continuous reasoning.</span>
          </h1>

          <h2 className="hero-subheadline reveal">
            Turn messy ideas into ready results: chat with context, images,
            video, audio and document reading in one intelligent flow.
          </h2>

          <p className="hero-paragraph reveal">
            Most AI tools predict words. ContinuumAI organizes intent, maintains
            coherence and responds with real speed. Less friction. More clarity.
            More production.
          </p>

          <HeroCta lang="en" />
        </div>
      </section>

      {/* ── Bento tools ── */}
      <section className="section-padding">
        <div className="container">
          <h2 className="section-title reveal">
            AI platform to{" "}
            <span className="text-accent">create, produce and decide</span>
          </h2>

          <div className="bento-grid">
            {/* 1 · Chat — large */}
            <div className="bento-card b-large glass-card reveal">
              <div className="card-content">
                <span className="card-note">Chat</span>
                <h3 className="card-title">
                  Intelligent chat with continuous reasoning
                </h3>
                <p className="card-desc">
                  Speak as you think. ContinuumAI organizes your intent and
                  responds with clear direction.
                </p>
              </div>
            </div>

            {/* 2 · Docs — medium */}
            <div className="bento-card b-medium glass-card reveal">
              <div className="card-content">
                <span className="card-note">Docs</span>
                <h3 className="card-title">
                  Turn documents into decisions
                </h3>
                <p className="card-desc">
                  Upload PDFs and files. Extract key points, summarize, compare
                  and detect information without mental fatigue.
                </p>
              </div>
            </div>

            {/* 3 · Images — medium */}
            <div className="bento-card b-medium glass-card reveal">
              <div className="card-content">
                <span className="card-note">Images</span>
                <h3 className="card-title">
                  Premium images ready to publish
                </h3>
                <p className="card-desc">
                  Create visuals for branding, campaigns or products.
                </p>
              </div>
            </div>

            {/* 4 · Video — large */}
            <div className="bento-card b-large glass-card reveal">
              <div className="card-content">
                <span className="card-note">Video</span>
                <h3 className="card-title">Create videos with structured AI</h3>
                <p className="card-desc">
                  From concept to final clip. Real creative control without
                  leaving the platform.
                </p>
              </div>
            </div>

            {/* 5 · Analyzer — medium */}
            <div className="bento-card b-medium glass-card reveal">
              <div className="card-content">
                <span className="card-note">Analyzer</span>
                <h3 className="card-title">Network &amp; Web Analyzer</h3>
                <p className="card-desc">
                  Integrate links, social profiles or entire domains.
                </p>
              </div>
            </div>

            {/* 6 · Audio — large */}
            <div className="bento-card b-large glass-card reveal">
              <div className="card-content">
                <span className="card-note">Audio</span>
                <h3 className="card-title">
                  Audio, narration and voice by intent
                </h3>
                <p className="card-desc">
                  Generate voiceovers, narrations and versions by tone and
                  rhythm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
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

      <SiteFooter lang="en" />
    </>
  );
}
