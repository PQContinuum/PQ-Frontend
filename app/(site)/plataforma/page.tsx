import { Metadata } from "next";
import { SiteHeader, SiteFooter, BgMesh } from "@/components/site";

export const metadata: Metadata = {
  title: "Herramientas - ContinuumAI",
};

export default function PlataformaPage() {
  return (
    <>
      <BgMesh orbs={3} />
      <SiteHeader lang="es" />

      <main>
        {/* ── Title Section ── */}
        <section className="section-padding text-center">
          <div className="container reveal">
            <h1 className="section-title">
              Una plataforma de IA para{" "}
              <span className="text-accent">crear, producir y decidir.</span>
            </h1>
            <p className="hero-subtitle">
              Todo lo que necesitas, integrado en un solo flujo inteligente.
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
                    Chat inteligente con razonamiento continuo
                  </h3>
                  <p className="card-desc">
                    Habla como piensas. ContinuumAI organiza tu intencion y
                    responde con direccion clara: estrategia, redaccion,
                    decisiones, soporte o planificacion.
                  </p>
                  <p className="card-note">
                    Ideal para sesiones largas sin perdida de coherencia.
                  </p>
                </div>
              </div>

              {/* 2 ── Docs ── */}
              <div className="bento-card b-medium reveal">
                <div className="card-content">
                  <h3 className="card-title">
                    Convierte documentos en decisiones
                  </h3>
                  <p className="card-desc">
                    Sube PDFs y archivos. Extrae puntos clave, resume, compara y
                    detecta informacion sin fatiga mental.
                  </p>
                  <p className="card-note">
                    Menos lectura innecesaria. Mas claridad ejecutiva.
                  </p>
                </div>
              </div>

              {/* 3 ── Images ── */}
              <div className="bento-card b-medium reveal">
                <div className="card-content">
                  <h3 className="card-title">
                    Imagenes premium listas para publicar
                  </h3>
                  <p className="card-desc">
                    Crea visuales para marca, campanas o productos. No necesitas
                    herramientas extra.
                  </p>
                  <p className="card-note">
                    Generador de imagenes generativas.
                  </p>
                </div>
              </div>

              {/* 4 ── Video ── */}
              <div className="bento-card b-large reveal">
                <div className="card-content">
                  <h3 className="card-title">
                    Crea videos con IA estructurada
                  </h3>
                  <p className="card-desc">
                    Del concepto al clip final. Control creativo real sin salir
                    de la plataforma.
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
                    <span className="badge">Seendance 1.5</span>
                    <span className="badge" style={{ background: "var(--accent)" }}>
                      Seendance 2.0
                    </span>
                    <span className="badge">KLIM 2.5</span>
                  </div>
                </div>
              </div>

              {/* 5 ── Analyzer ── */}
              <div className="bento-card b-medium reveal">
                <div className="card-content">
                  <h3 className="card-title" style={{ color: "var(--accent-secondary)" }}>
                    Analizador de Redes y Web
                  </h3>
                  <p className="card-desc">
                    Integra links, perfiles sociales o dominios enteros. La IA
                    extrae contexto, tono y estructura automaticamente.
                  </p>
                  <p className="card-note">
                    Auditoria competitiva en segundos.
                  </p>
                </div>
              </div>

              {/* 6 ── Audio ── */}
              <div className="bento-card b-large reveal">
                <div className="card-content">
                  <h3 className="card-title">
                    Audio, narracion y voz por intencion
                  </h3>
                  <p className="card-desc">
                    Genera locuciones, narraciones y versiones por tono y ritmo.
                    Perfecto para cursos y anuncios.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter lang="es" />
    </>
  );
}
