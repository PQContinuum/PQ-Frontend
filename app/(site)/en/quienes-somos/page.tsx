import { SiteHeader, SiteFooter, BgMesh } from "@/components/site";

export const metadata = {
  title: "About Us - ContinuumAI",
  description:
    "Meet the team and the vision behind ContinuumAI. Artificial intelligence with purpose, coherence and creative control.",
};

export default function AboutUsPage() {
  return (
    <>
      <BgMesh orbs={2} />
      <SiteHeader lang="en" />

      {/* ── About section ── */}
      <section className="section-padding">
        <div className="container">
          <h2 className="section-title reveal">
            About <span className="text-accent">Us</span>
          </h2>
          <p
            className="reveal"
            style={{
              textAlign: "center",
              maxWidth: 640,
              margin: "0 auto 48px",
              color: "var(--text-secondary)",
              fontSize: 18,
            }}
          >
            Meet the team and the vision behind ContinuumAI.
          </p>

          <div className="bento-grid">
            {/* 1 · Mission — large */}
            <div className="bento-card b-large glass-card reveal">
              <div className="card-content">
                <h3 className="card-title">Our Mission</h3>
                <p className="card-desc">
                  At ContinuumAI, we believe that artificial intelligence should
                  not just be a tool for generating isolated text or images. Our
                  goal is to create a continuous creative flow, where the
                  user&apos;s intent remains intact across all modalities: text,
                  image, video and audio.
                </p>
              </div>
            </div>

            {/* 2 · Vision — medium */}
            <div className="bento-card b-medium glass-card reveal">
              <div className="card-content">
                <h3 className="card-title">Global Vision</h3>
                <p className="card-desc">
                  To become the gold standard for creatives, entrepreneurs and
                  corporations that demand absolute control, privacy and
                  seamless integration into their AI workflows.
                </p>
              </div>
            </div>

            {/* 3 · Technology — medium */}
            <div className="bento-card b-medium glass-card reveal">
              <div className="card-content">
                <h3 className="card-title">
                  <span className="text-accent">Cutting-Edge Technology</span>
                </h3>
                <ul className="feature-list">
                  <li>Multi-modal cognitive models</li>
                  <li>High-performance parallel infrastructure</li>
                  <li>Scalable multi-tenant architecture</li>
                </ul>
              </div>
            </div>

            {/* 4 · Values — large */}
            <div className="bento-card b-large glass-card reveal">
              <div className="card-content">
                <h3 className="card-title">Core Values</h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 24,
                    marginTop: 16,
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: 16, marginBottom: 6 }}>
                      Privacy &amp; Ownership
                    </h4>
                    <p className="card-desc">
                      Your data and creations belong to you. No exceptions.
                    </p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, marginBottom: 6 }}>
                      Cognitive Precision
                    </h4>
                    <p className="card-desc">
                      Responses with direction, not random predictions.
                    </p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, marginBottom: 6 }}>
                      User Focus
                    </h4>
                    <p className="card-desc">
                      Every feature exists because it solves a real problem.
                    </p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, marginBottom: 6 }}>
                      Business Agility
                    </h4>
                    <p className="card-desc">
                      Fast and adaptable workflows for teams of any size.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter lang="en" />
    </>
  );
}
