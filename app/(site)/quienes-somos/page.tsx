import { SiteHeader, SiteFooter, BgMesh } from "@/components/site";

export const metadata = {
  title: "Quienes Somos - ContinuumAI",
  description:
    "Conoce el equipo y la vision detras de ContinuumAI. Inteligencia artificial con proposito, coherencia y control creativo.",
};

export default function QuienesSomosPage() {
  return (
    <>
      <BgMesh orbs={2} />
      <SiteHeader lang="es" />

      {/* ── About section ── */}
      <section className="section-padding">
        <div className="container">
          <h2 className="section-title reveal">
            Sobre <span className="text-accent">Nosotros</span>
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
            Conoce el equipo y la vision detras de ContinuumAI.
          </p>

          <div className="bento-grid">
            {/* 1 · Mission — large */}
            <div className="bento-card b-large glass-card reveal">
              <div className="card-content">
                <h3 className="card-title">Nuestra Mision</h3>
                <p className="card-desc">
                  En ContinuumAI, creemos que la inteligencia artificial no debe
                  ser solo una herramienta para generar texto o imagenes
                  aisladas. Nuestro objetivo es crear un flujo creativo continuo,
                  donde la intencion del usuario se mantenga intacta a traves de
                  todas las modalidades: texto, imagen, video y audio.
                </p>
              </div>
            </div>

            {/* 2 · Vision — medium */}
            <div className="bento-card b-medium glass-card reveal">
              <div className="card-content">
                <h3 className="card-title">Vision Global</h3>
                <p className="card-desc">
                  Convertirnos en el estandar de oro para creativos,
                  emprendedores y corporaciones que exigen control absoluto,
                  privacidad e integracion perfecta en sus flujos de trabajo con
                  IA.
                </p>
              </div>
            </div>

            {/* 3 · Technology — medium */}
            <div className="bento-card b-medium glass-card reveal">
              <div className="card-content">
                <h3 className="card-title">
                  <span className="text-accent">Tecnologia de Vanguardia</span>
                </h3>
                <ul className="feature-list">
                  <li>Modelos cognitivos multi-modales</li>
                  <li>Infraestructura paralela de alto rendimiento</li>
                  <li>Arquitectura multi-tenant escalable</li>
                </ul>
              </div>
            </div>

            {/* 4 · Values — large */}
            <div className="bento-card b-large glass-card reveal">
              <div className="card-content">
                <h3 className="card-title">Valores Fundamentales</h3>
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
                      Privacidad y Propiedad
                    </h4>
                    <p className="card-desc">
                      Tus datos y creaciones te pertenecen. Sin excepciones.
                    </p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, marginBottom: 6 }}>
                      Precision Cognitiva
                    </h4>
                    <p className="card-desc">
                      Respuestas con direccion, no predicciones aleatorias.
                    </p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, marginBottom: 6 }}>
                      Foco en el Usuario
                    </h4>
                    <p className="card-desc">
                      Cada funcion existe porque resuelve un problema real.
                    </p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, marginBottom: 6 }}>
                      Agilidad Empresarial
                    </h4>
                    <p className="card-desc">
                      Flujos rapidos y adaptables para equipos de cualquier
                      tamano.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter lang="es" />
    </>
  );
}
