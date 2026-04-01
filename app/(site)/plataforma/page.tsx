import { Metadata } from "next";
import { SiteHeader, SiteFooter, BgMesh, AuthCta } from "@/components/site";

export const metadata: Metadata = {
  title: "Plataforma - ContinuumAI",
  description: "Chat, imagenes, video, audio, documentos y analisis web en un solo flujo inteligente.",
};

export default function PlataformaPage() {
  return (
    <>
      <BgMesh orbs={3} />
      <SiteHeader lang="es" />

      <main>
        {/* ── Hero ── */}
        <section className="hero">
          <div className="container hero-content">
            <h1 className="hero-title reveal">
              Todo lo que creas.{" "}
              <span className="text-gradient">Un solo lugar.</span>
            </h1>
            <p className="hero-subheadline reveal">
              Chat, imagenes, video, audio, documentos y analisis web
              integrados en un flujo que no se rompe.
            </p>
          </div>
        </section>

        {/* ── Tools Grid ── */}
        <section className="section-padding">
          <div className="container">
            <h2 className="section-title reveal">
              Herramientas que{" "}
              <span className="text-accent">trabajan juntas</span>
            </h2>

            <div className="bento-grid">
              {/* 1 ── Chat ── */}
              <div className="bento-card b-large reveal">
                <div className="card-content">
                  <span className="card-note">Chat</span>
                  <h3 className="card-title">
                    Razonamiento continuo, no respuestas sueltas
                  </h3>
                  <p className="card-desc">
                    Habla como piensas. ContinuumAI organiza tu intencion y
                    responde con direccion clara: estrategia, redaccion,
                    decisiones o planificacion.
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
                    <span className="badge">Memoria persistente</span>
                    <span className="badge" style={{ background: "var(--accent)" }}>
                      Sesiones largas
                    </span>
                    <span className="badge">Contexto acumulado</span>
                  </div>
                </div>
              </div>

              {/* 2 ── Docs ── */}
              <div className="bento-card b-medium reveal">
                <div className="card-content">
                  <span className="card-note">Documentos</span>
                  <h3 className="card-title">
                    De archivo a decision en segundos
                  </h3>
                  <p className="card-desc">
                    Sube PDFs y archivos. Extrae puntos clave, resume, compara y
                    detecta informacion sin fatiga mental.
                  </p>
                </div>
              </div>

              {/* 3 ── Images ── */}
              <div className="bento-card b-medium reveal">
                <div className="card-content">
                  <span className="card-note">Imagenes</span>
                  <h3 className="card-title">
                    Visuales listos para publicar
                  </h3>
                  <p className="card-desc">
                    Genera imagenes para marca, campanas o productos.
                    Multiples estilos y calidades en un click.
                  </p>
                </div>
              </div>

              {/* 4 ── Video ── */}
              <div className="bento-card b-large reveal">
                <div className="card-content">
                  <span className="card-note">Video</span>
                  <h3 className="card-title">
                    Del prompt al clip final
                  </h3>
                  <p className="card-desc">
                    Genera videos con audio sincronizado. Control creativo real
                    sin salir de la plataforma.
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
                    <span className="badge">4s clips</span>
                    <span className="badge" style={{ background: "var(--accent)" }}>
                      12s produccion
                    </span>
                    <span className="badge">Audio integrado</span>
                  </div>
                </div>
              </div>

              {/* 5 ── Analyzer ── */}
              <div className="bento-card b-medium reveal">
                <div className="card-content">
                  <span className="card-note">Analisis</span>
                  <h3 className="card-title">
                    Auditoria web y redes en segundos
                  </h3>
                  <p className="card-desc">
                    Integra links, perfiles sociales o dominios completos.
                    Extrae contexto, tono y estructura automaticamente.
                  </p>
                </div>
              </div>

              {/* 6 ── Audio ── */}
              <div className="bento-card b-large reveal">
                <div className="card-content">
                  <span className="card-note">Audio</span>
                  <h3 className="card-title">
                    Voz, narracion y locuciones por intencion
                  </h3>
                  <p className="card-desc">
                    Genera voces naturales con control de tono y ritmo.
                    Ideal para cursos, podcasts y anuncios.
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
              No son herramientas separadas.{" "}
              <span className="text-accent">Es un flujo.</span>
            </h2>
            <p className="hero-subtitle" style={{ marginBottom: "2.5rem" }}>
              Otras plataformas te dan una herramienta por pestaña.
              ContinuumAI conecta todo en una misma conversacion:
              pides un texto, generas la imagen, produces el video y narras el audio
              sin cambiar de ventana.
            </p>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="section-padding">
          <div className="container" style={{ textAlign: "center" }}>
            <h2 className="section-title reveal">
              Empieza a crear con{" "}
              <span className="text-gradient">ContinuumAI</span>
            </h2>
            <div className="reveal" style={{ marginTop: 32 }}>
              <AuthCta lang="es" size="large" fallbackLabel="Probar gratis &rarr;" className="btn-primary large" />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter lang="es" />
    </>
  );
}
