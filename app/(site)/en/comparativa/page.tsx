"use client";

import { useState } from "react";
import { SiteHeader, SiteFooter, BgMesh } from "@/components/site";

const competitors = ["OpenAI (ChatGPT)", "Anthropic (Claude)", "DeepSeek", "Google Gemini"] as const;
type Competitor = (typeof competitors)[number];

/* ── ContinuumAI features (always visible) ── */
const continuumFeatures = [
  { name: "Main focus", val: "Multimodal + structural integration" },
  { name: "Organization", val: "Logical priority before responding" },
  { name: "Long-term coherence", val: "High (continuity-oriented)" },
  { name: "Integrated suite", val: "Native and strictly unified" },
  { name: "Character Creator", val: "Yes" },
  { name: "Creative inventory", val: "Yes, persistent" },
  { name: "Video Production", val: "Yes, assisted / multi-line" },
  { name: "Integrated Chat", val: "Native alongside documents and media" },
  { name: "Multi-user collaboration", val: "Yes, real-time sync" },
];

/* ── Competitor data ── */
interface CompetitorData {
  badge: string;
  features: { name: string; val: string; muted?: boolean }[];
}

const competitorData: Record<Competitor, CompetitorData> = {
  "OpenAI (ChatGPT)": {
    badge: "Generalist Platform",
    features: [
      { name: "Main focus", val: "Conversational generalist" },
      { name: "Organization", val: "Based on user prompt", muted: true },
      { name: "Long-term coherence", val: "Medium (reset per session)", muted: true },
      { name: "Integrated suite", val: "Partial (external plugins)", muted: true },
      { name: "Character Creator", val: "Not native", muted: true },
      { name: "Creative inventory", val: "No", muted: true },
      { name: "Video Production", val: "Limited (Sora)", muted: true },
      { name: "Integrated Chat", val: "Yes, but isolated from media", muted: true },
      { name: "Multi-user collaboration", val: "Only on Team plans", muted: true },
    ],
  },
  "Anthropic (Claude)": {
    badge: "Strong Textual Analysis",
    features: [
      { name: "Main focus", val: "Long text and analysis" },
      { name: "Organization", val: "Contextual by window", muted: true },
      { name: "Long-term coherence", val: "High in text, limited in media", muted: true },
      { name: "Integrated suite", val: "Text and documents only", muted: true },
      { name: "Character Creator", val: "No", muted: true },
      { name: "Creative inventory", val: "No", muted: true },
      { name: "Video Production", val: "No", muted: true },
      { name: "Integrated Chat", val: "Yes, text only", muted: true },
      { name: "Multi-user collaboration", val: "Not native", muted: true },
    ],
  },
  DeepSeek: {
    badge: "Technical / Code",
    features: [
      { name: "Main focus", val: "Code and technical reasoning" },
      { name: "Organization", val: "Linear by prompt", muted: true },
      { name: "Long-term coherence", val: "Medium (task-oriented)", muted: true },
      { name: "Integrated suite", val: "No", muted: true },
      { name: "Character Creator", val: "No", muted: true },
      { name: "Creative inventory", val: "No", muted: true },
      { name: "Video Production", val: "No", muted: true },
      { name: "Integrated Chat", val: "Basic", muted: true },
      { name: "Multi-user collaboration", val: "No", muted: true },
    ],
  },
  "Google Gemini": {
    badge: "Google Ecosystem",
    features: [
      { name: "Main focus", val: "Google ecosystem + multimodal" },
      { name: "Organization", val: "Dependent on Google context", muted: true },
      { name: "Long-term coherence", val: "Variable", muted: true },
      { name: "Integrated suite", val: "Via Google Workspace", muted: true },
      { name: "Character Creator", val: "No", muted: true },
      { name: "Creative inventory", val: "Partial (Drive)", muted: true },
      { name: "Video Production", val: "Experimental (Veo)", muted: true },
      { name: "Integrated Chat", val: "Yes, within Workspace", muted: true },
      { name: "Multi-user collaboration", val: "Via Google Docs", muted: true },
    ],
  },
};

/* ── Accordion items ── */
const advantages = [
  { num: "01", title: "Fewer iterations to the right result" },
  { num: "02", title: "Reduction of contradictions" },
  { num: "03", title: "Coherence in extended conversations" },
  { num: "04", title: "Perceivable speed with accumulated context" },
  { num: "05", title: "Smooth and consistent experience" },
];

export default function ComparisonPageEN() {
  const [active, setActive] = useState<Competitor>("OpenAI (ChatGPT)");
  const comp = competitorData[active];

  return (
    <>
      <BgMesh orbs={2} />
      <SiteHeader lang="en" />

      <main>
        {/* ── Title ── */}
        <section className="section-padding content-section text-center">
          <div className="container reveal">
            <h1 className="section-title">
              Strategic <span className="text-accent">Comparison</span>
            </h1>
            <p className="hero-subtitle">
              The table compares the platform approach and experience, not just
              the base model&apos;s power.
            </p>
          </div>
        </section>

        {/* ── Competitor Tabs ── */}
        <section className="section-padding content-section">
          <div className="container reveal">
            <div className="competitor-selector">
              {competitors.map((c) => (
                <button
                  key={c}
                  className={`comp-btn${active === c ? " active" : ""}`}
                  onClick={() => setActive(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* ── Head-to-Head Grid ── */}
            <div className="h2h-grid">
              {/* ContinuumAI Card (always visible) */}
              <div className="h2h-card continuum-card" style={{ borderTop: "3px solid var(--accent)" }}>
                <div className="comp-header">
                  <h3 className="comp-title">ContinuumAI</h3>
                  <span className="comp-badge">Continuous Flow</span>
                </div>
                <ul className="h2h-list">
                  {continuumFeatures.map((f) => (
                    <li key={f.name}>
                      <span className="feat-name">{f.name}</span>
                      <span className="feat-val">{f.val}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Competitor Card */}
              <div className="h2h-card glass-card">
                <div className="comp-header">
                  <h3 className="comp-title">{active}</h3>
                  <span className="comp-badge">{comp.badge}</span>
                </div>
                <ul className="h2h-list">
                  {comp.features.map((f) => (
                    <li key={f.name}>
                      <span className="feat-name">{f.name}</span>
                      <span className={`feat-val${f.muted ? " text-muted" : ""}`}>
                        {f.val}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Key difference ── */}
        <section className="section-padding content-section">
          <div className="container reveal">
            <div className="split-layout">
              <div className="text-content">
                <h2 className="section-title">
                  Key <span className="text-accent">Difference</span>
                </h2>
                <p className="hero-subtitle">
                  Most platforms operate with a simple cycle:{" "}
                  <strong>Question &rarr; Answer</strong>. ContinuumAI operates
                  with a structured flow:
                </p>
              </div>
              <div className="visual-content">
                <p>
                  <strong>
                    Intent &rarr; Organization &rarr; Production &rarr;
                    Reuse &rarr; Continuity
                  </strong>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Accordion: Advantages ── */}
        <section className="section-padding content-section">
          <div className="container reveal">
            <div className="custom-accordion">
              {advantages.map((a) => (
                <details key={a.num}>
                  <summary>
                    <span className="accordion-icon">{a.num}</span>
                    {a.title}
                  </summary>
                  <div className="accordion-content">
                    <p>{a.title}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter lang="en" />
    </>
  );
}
