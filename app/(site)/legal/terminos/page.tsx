import { SiteHeader, SiteFooter, BgMesh } from "@/components/site";

export const metadata = {
  title: "Terminos y Condiciones - ContinuumAI",
  description:
    "Terminos y condiciones de uso de la plataforma ContinuumAI Technologies LLC.",
};

export default function TerminosPage() {
  return (
    <>
      <BgMesh orbs={2} />
      <SiteHeader lang="es" />

      <section className="section-padding">
        <div className="container reveal">
          <h1 className="section-title">
            Terminos y <span className="text-accent">Condiciones</span>
          </h1>

          <div
            className="glass-card"
            style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}
          >
            <div
              className="legal-content"
              style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}
            >
              <p style={{ marginBottom: 16 }}>
                Ultima actualizacion: marzo 2026
              </p>

              <p style={{ marginBottom: 16 }}>
                Estos Terminos y Condiciones (en adelante, los
                &quot;Terminos&quot;) regulan el acceso y uso de la plataforma
                ContinuumAI y todos los servicios asociados ofrecidos a traves
                de ella. Al acceder, registrarse o utilizar cualquier
                funcionalidad de ContinuumAI, el usuario acepta de forma
                integra y sin reservas los presentes Terminos.
              </p>

              {/* ── 1. IDENTIFICACION LEGAL ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                1. IDENTIFICACION LEGAL
              </h3>
              <p style={{ marginBottom: 16 }}>
                La plataforma ContinuumAI es propiedad y esta operada por:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Razon social:</strong> ContinuumAI Technologies LLC
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Jurisdiccion de constitucion:</strong> Estado de
                  Wyoming, Estados Unidos de America
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Direccion registrada:</strong> 1021 E Lincolnway 9440,
                  Cheyenne, WY 82001
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Tipo de entidad:</strong> Limited Liability Company
                  (LLC)
                </li>
              </ul>

              {/* ── 2. ACEPTACION DE LOS TERMINOS ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                2. ACEPTACION DE LOS TERMINOS
              </h3>
              <p style={{ marginBottom: 16 }}>
                Al crear una cuenta, acceder a la plataforma o utilizar
                cualquiera de los servicios de ContinuumAI, el usuario declara
                haber leido, comprendido y aceptado estos Terminos en su
                totalidad. Si el usuario no esta de acuerdo con alguna de las
                disposiciones aqui contenidas, debera abstenerse de utilizar la
                plataforma.
              </p>
              <p style={{ marginBottom: 16 }}>
                El uso continuado de la plataforma tras la publicacion de
                modificaciones a estos Terminos constituira la aceptacion
                tacita de dichas modificaciones.
              </p>

              {/* ── 3. NATURALEZA DEL SERVICIO ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                3. NATURALEZA DEL SERVICIO
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI es una plataforma de inteligencia artificial que
                ofrece multiples herramientas integradas en un unico entorno
                digital. Los servicios incluyen, de forma enunciativa pero no
                limitativa:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Conversacion inteligente:</strong> chat con
                  razonamiento continuo y contexto persistente.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Generacion de imagenes:</strong> creacion de
                  contenido visual mediante modelos de IA generativa.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Generacion de video:</strong> produccion de clips y
                  contenido audiovisual asistido por IA.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Generacion de audio:</strong> locuciones, narraciones
                  y produccion de voz sintetica.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Analisis de documentos:</strong> lectura, extraccion
                  de informacion clave, resumen y comparacion de archivos.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Personajes IA:</strong> creacion y personalizacion de
                  asistentes virtuales con personalidad y contexto definidos.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Galeria:</strong> repositorio de contenido generado
                  accesible para el usuario.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Herramientas adicionales:</strong> analizador web,
                  integraciones y funcionalidades complementarias que se
                  incorporen a la plataforma.
                </li>
              </ul>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI se reserva el derecho de modificar, ampliar o
                descontinuar cualquiera de estos servicios en cualquier
                momento, con o sin previo aviso.
              </p>

              {/* ── 4. RELACION CONTRACTUAL ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                4. RELACION CONTRACTUAL
              </h3>
              <p style={{ marginBottom: 16 }}>
                El uso de ContinuumAI no crea entre el usuario y ContinuumAI
                Technologies LLC ninguna relacion de caracter laboral, de
                agencia, de sociedad, de joint venture ni de representacion. El
                usuario actua de forma independiente y bajo su propia
                responsabilidad.
              </p>
              <p style={{ marginBottom: 16 }}>
                La relacion entre las partes se limita exclusivamente a la
                provision y uso de los servicios descritos en estos Terminos,
                bajo las condiciones aqui estipuladas.
              </p>

              {/* ── 5. ESTRUCTURA LEGAL Y LIMITACION DE RESPONSABILIDAD ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                5. ESTRUCTURA LEGAL Y LIMITACION DE RESPONSABILIDAD
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI Technologies LLC es una sociedad de
                responsabilidad limitada constituida bajo las leyes del Estado
                de Wyoming. La responsabilidad de sus miembros esta limitada a
                su participacion en la empresa, conforme a lo establecido en el
                Wyoming Limited Liability Company Act.
              </p>
              <p style={{ marginBottom: 16 }}>
                En la maxima medida permitida por la ley aplicable,
                ContinuumAI Technologies LLC, sus miembros, directores,
                empleados, agentes y proveedores no seran responsables por
                danos indirectos, incidentales, especiales, consecuentes o
                punitivos, incluyendo pero sin limitarse a la perdida de
                beneficios, datos, uso, fondo de comercio u otras perdidas
                intangibles, derivados del uso o la imposibilidad de uso de la
                plataforma.
              </p>

              {/* ── 6. USO PERMITIDO Y RESTRICCIONES ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                6. USO PERMITIDO Y RESTRICCIONES
              </h3>
              <p style={{ marginBottom: 16 }}>
                El usuario se compromete a utilizar la plataforma de forma
                licita, etica y conforme a estos Terminos. Queda estrictamente
                prohibido:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  Utilizar la plataforma para actividades ilegales o contrarias
                  al ordenamiento juridico aplicable.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Emplear los servicios con fines fraudulentos, enganosos o que
                  busquen perjudicar a terceros.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Generar, distribuir o almacenar contenido explicito,
                  pornografico o sexualmente sugestivo que involucre menores o
                  que infrinja la dignidad de las personas.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Crear contenido que promueva, incite o glorifique la
                  violencia, el odio, la discriminacion o el terrorismo.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Intentar realizar ingenieria inversa, descompilar,
                  desensamblar o descifrar el codigo fuente, los algoritmos o
                  los modelos subyacentes de la plataforma.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Interferir con la seguridad, integridad o rendimiento de la
                  plataforma o de sus sistemas asociados.
                </li>
              </ul>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI se reserva el derecho de suspender o cancelar de
                forma inmediata y sin previo aviso la cuenta de cualquier
                usuario que infrinja estas restricciones.
              </p>

              {/* ── 7. CONTENIDO GENERADO POR IA ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                7. CONTENIDO GENERADO POR IA
              </h3>
              <p style={{ marginBottom: 16 }}>
                El usuario reconoce y acepta que el contenido generado por los
                modelos de inteligencia artificial de ContinuumAI es producido
                de forma automatizada. ContinuumAI no garantiza:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  La exactitud, veracidad, precision o completitud de la
                  informacion generada.
                </li>
                <li style={{ marginBottom: 8 }}>
                  La originalidad absoluta del contenido producido ni la
                  ausencia de similitudes con obras preexistentes.
                </li>
                <li style={{ marginBottom: 8 }}>
                  La ausencia de errores, sesgos, imprecisiones o contenido
                  inapropiado en las respuestas generadas.
                </li>
              </ul>
              <p style={{ marginBottom: 16 }}>
                El usuario es el unico responsable de verificar, revisar y
                validar cualquier contenido generado antes de su uso, publicacion
                o distribucion. ContinuumAI no asume responsabilidad alguna por
                las decisiones tomadas en base al contenido generado por la
                plataforma.
              </p>

              {/* ── 8. PROPIEDAD INTELECTUAL ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                8. PROPIEDAD INTELECTUAL
              </h3>
              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>
                  8.1 Propiedad de la Plataforma.
                </strong>{" "}
                Todos los derechos de propiedad intelectual e industrial sobre
                la plataforma ContinuumAI, incluyendo pero sin limitarse al
                software, codigo fuente, algoritmos, modelos de IA, diseno,
                interfaz de usuario, marcas, logotipos, nombres comerciales y
                documentacion, pertenecen exclusivamente a ContinuumAI
                Technologies LLC o a sus licenciantes. Ningun derecho de
                propiedad sobre estos elementos es transferido al usuario por
                virtud de estos Terminos.
              </p>
              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>
                  8.2 Contenido del Usuario.
                </strong>{" "}
                El usuario conserva todos los derechos de propiedad intelectual
                sobre el contenido que introduce en la plataforma (textos,
                imagenes, documentos, etc.). Al utilizar la plataforma, el
                usuario otorga a ContinuumAI una licencia limitada, no
                exclusiva y revocable para procesar dicho contenido
                unicamente con el fin de prestar los servicios solicitados.
              </p>

              {/* ── 9. PROTECCION DE DATOS Y CONFIDENCIALIDAD ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                9. PROTECCION DE DATOS Y CONFIDENCIALIDAD
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI se compromete a proteger la privacidad y los datos
                personales de sus usuarios conforme a las leyes aplicables de
                proteccion de datos, incluyendo el Reglamento General de
                Proteccion de Datos (GDPR) de la Union Europea y la Ley de
                Privacidad del Consumidor de California (CCPA), en la medida en
                que resulten aplicables.
              </p>
              <p style={{ marginBottom: 16 }}>
                El tratamiento de datos personales se rige por nuestra Politica
                de Privacidad, que forma parte integrante de estos Terminos. Al
                aceptar estos Terminos, el usuario declara haber leido y
                aceptado la Politica de Privacidad.
              </p>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI implementa medidas tecnicas y organizativas
                apropiadas para proteger los datos personales contra el acceso
                no autorizado, la alteracion, la divulgacion o la destruccion.
              </p>

              {/* ── 10. SERVICIOS DE TERCEROS ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                10. SERVICIOS DE TERCEROS
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI puede integrar o utilizar servicios, APIs o
                modelos de inteligencia artificial proporcionados por terceros
                para la prestacion de sus funcionalidades. ContinuumAI no es
                responsable de las politicas de privacidad, terminos de
                servicio o practicas de dichos terceros.
              </p>
              <p style={{ marginBottom: 16 }}>
                El usuario reconoce que ciertos datos pueden ser procesados por
                proveedores externos conforme a sus propios terminos y
                condiciones. ContinuumAI se compromete a seleccionar
                proveedores que ofrezcan garantias adecuadas de seguridad y
                proteccion de datos.
              </p>

              {/* ── 11. PLANES, FACTURACION Y PAGOS ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                11. PLANES, FACTURACION Y PAGOS
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI ofrece diferentes planes de suscripcion, cada uno
                con caracteristicas, limites de uso y precios especificos. Los
                detalles de cada plan estan disponibles en la plataforma y
                pueden ser modificados por ContinuumAI con previo aviso.
              </p>
              <p style={{ marginBottom: 16 }}>
                Los pagos se procesan a traves de pasarelas de pago seguras de
                terceros. ContinuumAI no almacena directamente informacion de
                tarjetas de credito o datos financieros del usuario. Las
                suscripciones se renuevan automaticamente al final de cada
                periodo de facturacion, salvo que el usuario cancele antes de
                la fecha de renovacion.
              </p>
              <p style={{ marginBottom: 16 }}>
                Los reembolsos se gestionaran conforme a la politica de
                reembolsos vigente y a las leyes aplicables de proteccion al
                consumidor.
              </p>

              {/* ── 12. TERMINACION ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                12. TERMINACION
              </h3>
              <p style={{ marginBottom: 16 }}>
                El usuario puede cancelar su cuenta y dejar de utilizar la
                plataforma en cualquier momento. ContinuumAI se reserva el
                derecho de suspender o cancelar la cuenta del usuario en caso
                de incumplimiento de estos Terminos, sin perjuicio de las
                acciones legales que pudieran corresponder.
              </p>
              <p style={{ marginBottom: 16 }}>
                Tras la terminacion, ContinuumAI podra eliminar los datos del
                usuario conforme a su politica de retencion de datos y a las
                obligaciones legales aplicables. Las disposiciones que por su
                naturaleza deban sobrevivir a la terminacion (incluyendo
                propiedad intelectual, limitacion de responsabilidad e
                indemnizacion) permanenceran vigentes.
              </p>

              {/* ── 13. INDEMNIZACION ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                13. INDEMNIZACION
              </h3>
              <p style={{ marginBottom: 16 }}>
                El usuario acepta indemnizar, defender y mantener indemne a
                ContinuumAI Technologies LLC, sus miembros, directores,
                empleados, agentes y proveedores frente a cualquier
                reclamacion, demanda, dano, perdida, responsabilidad, costo o
                gasto (incluyendo honorarios razonables de abogados) que surja
                de o este relacionado con: (a) el uso de la plataforma por
                parte del usuario; (b) el incumplimiento de estos Terminos;
                (c) la violacion de derechos de terceros; o (d) el contenido
                generado, publicado o distribuido por el usuario a traves de la
                plataforma.
              </p>

              {/* ── 14. LEY APLICABLE Y JURISDICCION ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                14. LEY APLICABLE Y JURISDICCION
              </h3>
              <p style={{ marginBottom: 16 }}>
                Estos Terminos se regiran e interpretaran de conformidad con las
                leyes del Estado de Wyoming, Estados Unidos de America, sin
                tener en cuenta sus disposiciones sobre conflictos de leyes.
              </p>
              <p style={{ marginBottom: 16 }}>
                Cualquier controversia, disputa o reclamacion derivada de o
                relacionada con estos Terminos sera sometida a la jurisdiccion
                exclusiva de los tribunales competentes del Estado de Wyoming.
                Las partes renuncian a cualquier otro fuero que pudiera
                corresponderles por razon de su domicilio presente o futuro.
              </p>

              {/* ── 15. MODIFICACIONES ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                15. MODIFICACIONES
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI se reserva el derecho de modificar estos Terminos
                en cualquier momento. Las modificaciones entraran en vigor
                desde su publicacion en la plataforma. Se notificara a los
                usuarios sobre cambios sustanciales a traves de los medios de
                comunicacion disponibles en la plataforma.
              </p>
              <p style={{ marginBottom: 16 }}>
                El uso continuado de la plataforma despues de la publicacion de
                las modificaciones constituira la aceptacion de los Terminos
                actualizados. Si el usuario no esta de acuerdo con las
                modificaciones, debera cesar el uso de la plataforma y
                solicitar la cancelacion de su cuenta.
              </p>
              <p style={{ marginBottom: 16, marginTop: 32 }}>
                <em>
                  Si tiene preguntas sobre estos Terminos y Condiciones, puede
                  contactarnos a traves de los canales de soporte disponibles en
                  la plataforma.
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
