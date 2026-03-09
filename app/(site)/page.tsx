import Link from "next/link";
import { SiteHeader, SiteFooter, BgMesh, HeroCta } from "@/components/site";

export const metadata = {
  title: "ContinuumAI - No es cualquier IA. Razona en continuo.",
  description:
    "Plataforma de inteligencia artificial para generar imagenes, crear videos con IA, producir audio, leer documentos y conversar con contexto.",
};

export default function HomePage() {
  return (
    <>
      <BgMesh orbs={3} />
      <SiteHeader lang="es" />

      {/* ── Hero ── */}
      <section className="hero">
        <div className="container hero-content">
          <h1 className="hero-title reveal">
            ContinuumAI no es cualquier IA.{" "}
            <span className="text-gradient">Razona en continuo.</span>
          </h1>

          <h2 className="hero-subheadline reveal">
            Convierte ideas desordenadas en resultados listos: chat con contexto,
            imagenes, video, audio y lectura de documentos en un solo flujo
            inteligente.
          </h2>

          <p className="hero-paragraph reveal">
            La mayoria de las herramientas de inteligencia artificial predicen
            palabras. ContinuumAI organiza intencion, mantiene coherencia y
            responde con velocidad real. Menos friccion. Mas claridad. Mas
            produccion.
          </p>

          <HeroCta lang="es" />
        </div>
      </section>

      {/* ── Bento tools ── */}
      <section className="section-padding">
        <div className="container">
          <h2 className="section-title reveal">
            Plataforma de IA para{" "}
            <span className="text-accent">crear, producir y decidir</span>
          </h2>

          <div className="bento-grid">
            {/* 1 · Chat — large */}
            <div className="bento-card b-large glass-card reveal">
              <div className="card-content">
                <span className="card-note">Chat</span>
                <h3 className="card-title">
                  Chat inteligente con razonamiento continuo
                </h3>
                <p className="card-desc">
                  Habla como piensas. ContinuumAI organiza tu intencion y
                  responde con direccion clara.
                </p>
              </div>
            </div>

            {/* 2 · Docs — medium */}
            <div className="bento-card b-medium glass-card reveal">
              <div className="card-content">
                <span className="card-note">Docs</span>
                <h3 className="card-title">
                  Convierte documentos en decisiones
                </h3>
                <p className="card-desc">
                  Sube PDFs y archivos. Extrae puntos clave, resume, compara y
                  detecta informacion sin fatiga mental.
                </p>
              </div>
            </div>

            {/* 3 · Images — medium */}
            <div className="bento-card b-medium glass-card reveal">
              <div className="card-content">
                <span className="card-note">Images</span>
                <h3 className="card-title">
                  Imagenes premium listas para publicar
                </h3>
                <p className="card-desc">
                  Crea visuales para marca, campanas o productos.
                </p>
              </div>
            </div>

            {/* 4 · Video — large */}
            <div className="bento-card b-large glass-card reveal">
              <div className="card-content">
                <span className="card-note">Video</span>
                <h3 className="card-title">Crea videos con IA estructurada</h3>
                <p className="card-desc">
                  Del concepto al clip final. Control creativo real sin salir de
                  la plataforma.
                </p>
              </div>
            </div>

            {/* 5 · Analyzer — medium */}
            <div className="bento-card b-medium glass-card reveal">
              <div className="card-content">
                <span className="card-note">Analyzer</span>
                <h3 className="card-title">Analizador de Redes y Web</h3>
                <p className="card-desc">
                  Integra links, perfiles sociales o dominios enteros.
                </p>
              </div>
            </div>

            {/* 6 · Audio — large */}
            <div className="bento-card b-large glass-card reveal">
              <div className="card-content">
                <span className="card-note">Audio</span>
                <h3 className="card-title">
                  Audio, narracion y voz por intencion
                </h3>
                <p className="card-desc">
                  Genera locuciones, narraciones y versiones por tono y ritmo.
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
            Empieza a crear con{" "}
            <span className="text-gradient">ContinuumAI</span>
          </h2>
          <div className="reveal" style={{ marginTop: 32 }}>
            <Link href="/chat" className="btn-primary large">
              Probar gratis &rarr;
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter lang="es" />
    </>
  );
}
