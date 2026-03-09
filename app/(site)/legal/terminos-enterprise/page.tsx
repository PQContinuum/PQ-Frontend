import { SiteHeader, SiteFooter, BgMesh } from "@/components/site";

export const metadata = {
  title: "Terminos Enterprise y DPA - ContinuumAI",
  description:
    "Terminos de servicio Enterprise y Data Processing Agreement (DPA) de ContinuumAI Technologies LLC.",
};

export default function TerminosEnterprisePage() {
  return (
    <>
      <BgMesh orbs={2} />
      <SiteHeader lang="es" />

      <section className="section-padding">
        <div className="container reveal">
          <h1 className="section-title">
            Terminos Enterprise
            <br />y <span className="text-accent">Data Processing Agreement (DPA)</span>
          </h1>

          <div
            className="glass-card"
            style={{
              padding: 40,
              maxWidth: 900,
              margin: "0 auto",
              borderTop: "3px solid var(--accent-primary)",
            }}
          >
            <div
              className="legal-content"
              style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}
            >
              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>
                  Documento Legal Exclusivo para Clientes del Plan Enterprise -
                  ContinuumAI Technologies LLC
                </strong>
              </p>
              <p style={{ marginBottom: 16 }}>
                Ultima actualizacion: marzo 2026
              </p>
              <p style={{ marginBottom: 16 }}>
                El presente documento complementa los Terminos y Condiciones
                generales de ContinuumAI y establece las condiciones
                especificas aplicables a los clientes suscritos al Plan
                Enterprise, incluyendo el Acuerdo de Procesamiento de Datos
                (Data Processing Agreement, DPA) conforme a las normativas
                internacionales de proteccion de datos.
              </p>

              {/* ── 1. IDENTIFICACION Y MARCO LEGAL ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                1. IDENTIFICACION Y MARCO LEGAL
              </h3>
              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>Proveedor del Servicio:</strong>{" "}
                ContinuumAI Technologies LLC, sociedad de responsabilidad
                limitada constituida bajo las leyes del Estado de Wyoming,
                Estados Unidos de America, con direccion registrada en 1021 E
                Lincolnway 9440, Cheyenne, WY 82001.
              </p>
              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>Cliente Enterprise:</strong>{" "}
                La persona juridica o fisica que ha suscrito el Plan Enterprise
                de ContinuumAI y que actua como Responsable del Tratamiento de
                datos en el contexto del presente DPA.
              </p>
              <p style={{ marginBottom: 16 }}>
                Este documento se rige conjuntamente por las leyes del Estado
                de Wyoming y por las normativas internacionales aplicables en
                materia de proteccion de datos, incluyendo el Reglamento
                General de Proteccion de Datos (GDPR) de la Union Europea, la
                Ley de Privacidad del Consumidor de California (CCPA) y
                cualquier otra legislacion relevante segun la jurisdiccion del
                Cliente.
              </p>

              {/* ── 2. ACUERDO DE PROCESAMIENTO DE DATOS (DPA) ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                2. ACUERDO DE PROCESAMIENTO DE DATOS (DPA)
              </h3>
              <p style={{ marginBottom: 16 }}>
                El presente Acuerdo de Procesamiento de Datos forma parte
                integrante del contrato Enterprise y establece las obligaciones
                de ambas partes en relacion con el tratamiento de datos
                personales.
              </p>

              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>2.1 Roles y Responsabilidades.</strong>{" "}
                A los efectos del presente DPA, el Cliente actua como
                Responsable del Tratamiento (Data Controller) y ContinuumAI
                Technologies LLC actua como Encargado del Tratamiento (Data
                Processor). ContinuumAI procesara los datos personales
                unicamente conforme a las instrucciones documentadas del
                Cliente y para la prestacion de los servicios contratados.
              </p>

              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>2.2 Finalidad y Alcance del Tratamiento.</strong>{" "}
                ContinuumAI tratara los datos personales del Cliente
                exclusivamente para: (a) la provision de los servicios de la
                plataforma Enterprise contratados; (b) el mantenimiento y
                mejora de la seguridad y rendimiento del servicio; (c) el
                cumplimiento de obligaciones legales aplicables; y (d)
                cualquier otra finalidad expresamente autorizada por el
                Cliente mediante instrucciones escritas.
              </p>

              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>2.3 Medidas de Seguridad.</strong>{" "}
                ContinuumAI implementara y mantendra medidas tecnicas y
                organizativas apropiadas para proteger los datos personales
                contra el tratamiento no autorizado o ilicito, y contra su
                perdida, destruccion o dano accidental. Estas medidas
                incluyen, entre otras:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  Cifrado de datos en transito (TLS 1.2 o superior) y en reposo
                  (AES-256).
                </li>
                <li style={{ marginBottom: 8 }}>
                  Controles de acceso basados en roles con autenticacion
                  multifactor.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Aislamiento logico de datos entre clientes Enterprise.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Registros de auditoria y monitoreo continuo de accesos.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Evaluaciones periodicas de vulnerabilidades y pruebas de
                  penetracion.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Planes de respuesta ante incidentes y continuidad de negocio.
                </li>
              </ul>

              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>2.4 Subprocesadores.</strong>{" "}
                ContinuumAI podra recurrir a subprocesadores para el
                tratamiento de datos personales, siempre que: (a) se informe
                al Cliente con un minimo de 30 dias de antelacion antes de
                incorporar un nuevo subprocesador; (b) se formalicen contratos
                con los subprocesadores que ofrezcan garantias equivalentes a
                las contenidas en el presente DPA; y (c) ContinuumAI siga
                siendo plenamente responsable ante el Cliente de las
                actuaciones de sus subprocesadores.
              </p>

              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>
                  2.5 Transferencias Internacionales de Datos.
                </strong>{" "}
                En caso de que el tratamiento de datos implique transferencias
                internacionales fuera del Espacio Economico Europeo (EEE) o de
                jurisdicciones con regulaciones equivalentes, ContinuumAI
                garantizara la existencia de mecanismos de transferencia
                adecuados, tales como Clausulas Contractuales Tipo aprobadas
                por la Comision Europea, decisiones de adecuacion o cualquier
                otro mecanismo legalmente reconocido.
              </p>

              {/* ── 3. NIVELES DE SERVICIO Y SOPORTE (SLA) ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                3. NIVELES DE SERVICIO Y SOPORTE (SLA)
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI se compromete a mantener una disponibilidad minima
                del servicio del 99.9% mensual, calculada como el porcentaje de
                minutos en los que la plataforma esta operativa y accesible
                durante el periodo de facturacion, excluyendo ventanas de
                mantenimiento programado previamente comunicadas.
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Incidentes criticos (P1):</strong> tiempo de
                  respuesta maximo de 1 hora. Resolucion objetivo en 4 horas.
                  Servicio completamente inaccesible o perdida de datos.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Incidentes mayores (P2):</strong> tiempo de respuesta
                  maximo de 4 horas. Resolucion objetivo en 24 horas.
                  Funcionalidad significativamente degradada.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Incidentes menores (P3):</strong> tiempo de respuesta
                  maximo de 24 horas. Resolucion objetivo en 72 horas.
                  Problemas que no afectan la operacion critica.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Solicitudes generales (P4):</strong> tiempo de
                  respuesta maximo de 48 horas. Consultas, solicitudes de
                  informacion y mejoras.
                </li>
              </ul>
              <p style={{ marginBottom: 16 }}>
                En caso de incumplimiento del SLA, el Cliente podra solicitar
                creditos de servicio proporcionales al tiempo de inactividad
                excedente, conforme a la tabla de compensaciones establecida en
                el contrato Enterprise.
              </p>

              {/* ── 4. RETENCION Y DESTRUCCION DE DATOS ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                4. RETENCION Y DESTRUCCION DE DATOS
              </h3>
              <p style={{ marginBottom: 16 }}>
                Al finalizar la relacion contractual Enterprise, ContinuumAI
                procedera, a eleccion del Cliente, a: (a) devolver todos los
                datos personales del Cliente en un formato estructurado, de
                uso comun y lectura mecanica; o (b) destruir de forma segura
                e irreversible todos los datos personales en un plazo maximo
                de 30 dias naturales tras la terminacion del contrato.
              </p>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI emitira un certificado de destruccion de datos
                cuando el Cliente lo solicite. Se exceptuan de la obligacion
                de destruccion aquellos datos cuya conservacion sea exigida por
                obligaciones legales o regulatorias, los cuales seran
                mantenidos de forma aislada y protegida exclusivamente para
                dicho fin.
              </p>

              {/* ── 5. DERECHOS DE AUDITORIA ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                5. DERECHOS DE AUDITORIA
              </h3>
              <p style={{ marginBottom: 16 }}>
                El Cliente Enterprise tendra derecho a realizar o encargar
                auditorias para verificar el cumplimiento de las obligaciones
                establecidas en el presente documento y en el DPA, sujeto a las
                siguientes condiciones:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  Las auditorias se realizaran con un preaviso minimo de 30
                  dias naturales.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Se limitaran al ambito del tratamiento de datos del Cliente
                  y no interferiran con las operaciones de otros clientes.
                </li>
                <li style={{ marginBottom: 8 }}>
                  El auditor debera suscribir un acuerdo de confidencialidad
                  antes del inicio de la auditoria.
                </li>
                <li style={{ marginBottom: 8 }}>
                  ContinuumAI proporcionara acceso razonable a la
                  documentacion, instalaciones y personal relevante.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Se permite un maximo de una auditoria por ano natural, salvo
                  que exista un incidente de seguridad o un requerimiento
                  regulatorio que justifique auditorias adicionales.
                </li>
              </ul>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI pondra a disposicion del Cliente informes de
                cumplimiento, certificaciones de seguridad y resultados de
                auditorias independientes realizadas por terceros acreditados.
              </p>

              {/* ── 6. INDEMNIZACIONES ADICIONALES ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                6. INDEMNIZACIONES ADICIONALES
              </h3>
              <p style={{ marginBottom: 16 }}>
                Ademas de las indemnizaciones previstas en los Terminos y
                Condiciones generales, ContinuumAI indemnizara al Cliente
                Enterprise frente a cualquier reclamacion, sancion, multa o
                dano directo que resulte de: (a) un incumplimiento demostrable
                de las obligaciones del DPA por parte de ContinuumAI; (b) una
                brecha de seguridad causada por negligencia de ContinuumAI en
                la implementacion de las medidas de seguridad comprometidas; o
                (c) el tratamiento de datos personales fuera del alcance de las
                instrucciones documentadas del Cliente.
              </p>
              <p style={{ marginBottom: 16 }}>
                La responsabilidad total acumulada de ContinuumAI bajo esta
                clausula de indemnizacion no excedera el importe total pagado
                por el Cliente en concepto de servicios Enterprise durante los
                12 meses anteriores al evento que dio origen a la reclamacion,
                salvo en casos de dolo o negligencia grave.
              </p>

              {/* ── 7. TERMINACION, CUMPLIMIENTO LEGAL Y LEY APLICABLE ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                7. TERMINACION, CUMPLIMIENTO LEGAL Y LEY APLICABLE
              </h3>
              <p style={{ marginBottom: 16 }}>
                El contrato Enterprise podra ser terminado por cualquiera de
                las partes con un preaviso minimo de 90 dias naturales. En
                caso de incumplimiento material por cualquiera de las partes,
                la parte afectada podra resolver el contrato con efecto
                inmediato si el incumplimiento no es subsanado dentro de los
                30 dias siguientes a la notificacion por escrito.
              </p>
              <p style={{ marginBottom: 16 }}>
                Ambas partes se comprometen a cumplir con todas las leyes y
                regulaciones aplicables en relacion con la prestacion y el
                uso de los servicios Enterprise, incluyendo pero sin limitarse
                a las normativas de proteccion de datos, exportacion de
                tecnologia y anticorrupcion.
              </p>
              <p style={{ marginBottom: 16 }}>
                El presente documento se regira e interpretara de conformidad
                con las leyes del Estado de Wyoming, Estados Unidos de America.
                Cualquier controversia sera sometida a la jurisdiccion
                exclusiva de los tribunales del Estado de Wyoming, sin
                perjuicio del derecho de las partes a acudir a mecanismos de
                arbitraje conforme a las reglas de la American Arbitration
                Association (AAA).
              </p>
              <p style={{ marginBottom: 16 }}>
                Las disposiciones del DPA que por su naturaleza deban
                sobrevivir a la terminacion del contrato, incluyendo las
                relativas a confidencialidad, retencion y destruccion de datos,
                indemnizacion y limitacion de responsabilidad, permanenceran
                vigentes tras la finalizacion de la relacion contractual.
              </p>
              <p style={{ marginBottom: 16, marginTop: 32 }}>
                <em>
                  Para consultas relacionadas con el Plan Enterprise o el DPA,
                  contacte a nuestro equipo dedicado a traves de los canales de
                  soporte Enterprise disponibles en la plataforma.
                </em>
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter lang="es" />
    </>
  );
}
