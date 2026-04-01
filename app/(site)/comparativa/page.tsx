"use client";

import { useState } from "react";
import { SiteHeader, SiteFooter, BgMesh } from "@/components/site";

const competitors = ["OpenAI (ChatGPT)", "Anthropic (Claude)", "DeepSeek", "Google Gemini"] as const;
type Competitor = (typeof competitors)[number];

/* ── ContinuumAI features (always visible) ── */
const continuumFeatures = [
  { name: "Enfoque principal", val: "Integracion multimodal + estructural" },
  { name: "Organizacion", val: "Prioridad logica antes de responder" },
  { name: "Coherencia a largo plazo", val: "Alta (orientado a continuidad)" },
  { name: "Suite integrada", val: "Nativa y estrictamente unificada" },
  { name: "Creador Personajes", val: "Si" },
  { name: "Inventario creativo", val: "Si, persistente" },
  { name: "Produccion de Video", val: "Si, asistida / multilinea" },
  { name: "Chat Integrado", val: "Nativo junto a documentos y media" },
  { name: "Colaboracion multiusuario", val: "Si, sincronizacion en tiempo real" },
];

/* ── Competitor data ── */
interface CompetitorData {
  badge: string;
  features: { name: string; val: string; muted?: boolean }[];
}

const competitorData: Record<Competitor, CompetitorData> = {
  "OpenAI (ChatGPT)": {
    badge: "Plataforma Generalista",
    features: [
      { name: "Enfoque principal", val: "Generalista conversacional" },
      { name: "Organizacion", val: "Basada en prompt del usuario", muted: true },
      { name: "Coherencia a largo plazo", val: "Media (reset por sesion)", muted: true },
      { name: "Suite integrada", val: "Parcial (plugins externos)", muted: true },
      { name: "Creador Personajes", val: "No nativo", muted: true },
      { name: "Inventario creativo", val: "No", muted: true },
      { name: "Produccion de Video", val: "Limitada (Sora)", muted: true },
      { name: "Chat Integrado", val: "Si, pero aislado de media", muted: true },
      { name: "Colaboracion multiusuario", val: "Solo en planes Team", muted: true },
    ],
  },
  "Anthropic (Claude)": {
    badge: "Analisis Textual Fuerte",
    features: [
      { name: "Enfoque principal", val: "Texto largo y analisis" },
      { name: "Organizacion", val: "Contextual por ventana", muted: true },
      { name: "Coherencia a largo plazo", val: "Alta en texto, limitada en media", muted: true },
      { name: "Suite integrada", val: "Solo texto y documentos", muted: true },
      { name: "Creador Personajes", val: "No", muted: true },
      { name: "Inventario creativo", val: "No", muted: true },
      { name: "Produccion de Video", val: "No", muted: true },
      { name: "Chat Integrado", val: "Si, solo texto", muted: true },
      { name: "Colaboracion multiusuario", val: "No nativo", muted: true },
    ],
  },
  DeepSeek: {
    badge: "Tecnico / Codigo",
    features: [
      { name: "Enfoque principal", val: "Codigo y razonamiento tecnico" },
      { name: "Organizacion", val: "Lineal por prompt", muted: true },
      { name: "Coherencia a largo plazo", val: "Media (orientado a tareas)", muted: true },
      { name: "Suite integrada", val: "No", muted: true },
      { name: "Creador Personajes", val: "No", muted: true },
      { name: "Inventario creativo", val: "No", muted: true },
      { name: "Produccion de Video", val: "No", muted: true },
      { name: "Chat Integrado", val: "Basico", muted: true },
      { name: "Colaboracion multiusuario", val: "No", muted: true },
    ],
  },
  "Google Gemini": {
    badge: "Ecosistema Google",
    features: [
      { name: "Enfoque principal", val: "Ecosistema Google + multimodal" },
      { name: "Organizacion", val: "Dependiente de contexto Google", muted: true },
      { name: "Coherencia a largo plazo", val: "Variable", muted: true },
      { name: "Suite integrada", val: "Via Google Workspace", muted: true },
      { name: "Creador Personajes", val: "No", muted: true },
      { name: "Inventario creativo", val: "Parcial (Drive)", muted: true },
      { name: "Produccion de Video", val: "Experimental (Veo)", muted: true },
      { name: "Chat Integrado", val: "Si, dentro de Workspace", muted: true },
      { name: "Colaboracion multiusuario", val: "Via Google Docs", muted: true },
    ],
  },
};

/* ── Accordion items ── */
const advantages = [
  { num: "01", title: "Menos iteraciones para el resultado correcto" },
  { num: "02", title: "Reduccion de contradicciones" },
  { num: "03", title: "Coherencia en conversaciones extensas" },
  { num: "04", title: "Velocidad perceptible con contexto acumulado" },
  { num: "05", title: "Experiencia fluida y consistente" },
];

export default function ComparativaPage() {
  const [active, setActive] = useState<Competitor>("OpenAI (ChatGPT)");
  const comp = competitorData[active];

  return (
    <>
      <BgMesh orbs={2} />
      <SiteHeader lang="es" />

      <main>
        {/* ── Title ── */}
        <section className="section-padding content-section text-center">
          <div className="container reveal">
            <h1 className="section-title">
              Comparativa <span className="text-accent">Estrategica</span>
            </h1>
            <p className="hero-subtitle">
              La tabla compara el enfoque de plataforma y la experiencia, no
              solo la potencia del modelo base.
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
                  <span className="comp-badge">Flujo Continuo</span>
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

        {/* ── Diferencia clave ── */}
        <section className="section-padding content-section">
          <div className="container reveal" style={{ textAlign: "center" }}>
            <h2 className="section-title">
              Diferencia <span className="text-accent">clave</span>
            </h2>
            <p className="hero-subtitle" style={{ marginBottom: "2.5rem" }}>
              La mayoria de plataformas funcionan con un ciclo simple:{" "}
              <strong style={{ color: "var(--text-primary)" }}>Pregunta &rarr; Respuesta</strong>.<br />
              ContinuumAI opera con un flujo estructurado:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
              {["Intencion", "Organizacion", "Produccion", "Reutilizacion", "Continuidad"].map((step, i) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span
                    style={{
                      padding: "8px 20px",
                      borderRadius: "999px",
                      background: "rgba(255,139,61,0.08)",
                      border: "1px solid rgba(255,139,61,0.2)",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "var(--accent-primary)",
                    }}
                  >
                    {step}
                  </span>
                  {i < 4 && (
                    <span style={{ color: "var(--text-tertiary)", fontSize: "1.1rem" }}>&rarr;</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Accordion: Ventajas ── */}
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

      <SiteFooter lang="es" />
    </>
  );
}
