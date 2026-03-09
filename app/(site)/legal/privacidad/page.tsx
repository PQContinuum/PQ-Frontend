import { SiteHeader, SiteFooter, BgMesh } from "@/components/site";

export const metadata = {
  title: "Politica de Privacidad - ContinuumAI",
  description: "Politica de privacidad de ContinuumAI Technologies LLC.",
};

export default function PrivacidadPage() {
  return (
    <>
      <BgMesh orbs={2} />
      <SiteHeader lang="es" />

      <section className="section-padding">
        <div className="container reveal">
          <h1 className="section-title">
            Politica de <span className="text-accent">Privacidad</span>
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
                La presente Politica de Privacidad describe como ContinuumAI
                Technologies LLC (en adelante, &quot;ContinuumAI&quot;,
                &quot;nosotros&quot; o &quot;nuestro&quot;) recopila, utiliza,
                almacena y protege los datos personales de los usuarios de
                nuestra plataforma. Al acceder o utilizar ContinuumAI, el
                usuario acepta las practicas descritas en esta politica.
              </p>

              {/* ── 1. IDENTIFICACION DEL RESPONSABLE ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                1. IDENTIFICACION DEL RESPONSABLE
              </h3>
              <p style={{ marginBottom: 16 }}>
                El responsable del tratamiento de los datos personales es:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Razon social:</strong> ContinuumAI Technologies LLC
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Jurisdiccion:</strong> Estado de Wyoming, Estados
                  Unidos de America
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Direccion registrada:</strong> 1021 E Lincolnway 9440,
                  Cheyenne, WY 82001
                </li>
              </ul>

              {/* ── 2. DATOS QUE RECOPILAMOS ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                2. DATOS QUE RECOPILAMOS
              </h3>
              <p style={{ marginBottom: 16 }}>
                En el marco de la prestacion de nuestros servicios, podemos
                recopilar las siguientes categorias de datos:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Datos de registro:</strong> nombre, direccion de correo
                  electronico y cualquier otra informacion proporcionada al crear
                  una cuenta.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Datos de uso:</strong> informacion sobre como el
                  usuario interactua con la plataforma, incluyendo
                  funcionalidades utilizadas, frecuencia de uso y preferencias.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Contenido generado:</strong> textos, imagenes,
                  documentos y cualquier otro contenido introducido o generado
                  por el usuario a traves de la plataforma.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Datos tecnicos:</strong> direccion IP, tipo de
                  navegador, sistema operativo, dispositivo utilizado, paginas
                  visitadas y datos de conexion.
                </li>
              </ul>

              {/* ── 3. FINALIDAD DEL TRATAMIENTO ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                3. FINALIDAD DEL TRATAMIENTO
              </h3>
              <p style={{ marginBottom: 16 }}>
                Los datos personales recopilados se utilizan para las siguientes
                finalidades:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Prestacion de servicios:</strong> gestionar la cuenta
                  del usuario y proporcionar acceso a las funcionalidades de la
                  plataforma.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Mejora de la plataforma:</strong> analizar el uso de
                  los servicios para optimizar la experiencia del usuario y
                  desarrollar nuevas funcionalidades.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Seguridad:</strong> detectar, prevenir y abordar
                  actividades fraudulentas, abusos o amenazas a la seguridad de
                  la plataforma.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Comunicaciones:</strong> enviar notificaciones
                  relacionadas con el servicio, actualizaciones y, cuando el
                  usuario lo autorice, comunicaciones comerciales.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Cumplimiento legal:</strong> cumplir con obligaciones
                  legales, regulatorias o requerimientos de autoridades
                  competentes.
                </li>
              </ul>

              {/* ── 4. BASE LEGAL DEL TRATAMIENTO ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                4. BASE LEGAL DEL TRATAMIENTO
              </h3>
              <p style={{ marginBottom: 16 }}>
                El tratamiento de los datos personales se fundamenta en las
                siguientes bases legales:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Consentimiento:</strong> el usuario otorga su
                  consentimiento al aceptar esta Politica de Privacidad y al
                  utilizar la plataforma.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Ejecucion contractual:</strong> el tratamiento es
                  necesario para la prestacion de los servicios contratados por
                  el usuario.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Interes legitimo:</strong> mejorar nuestros servicios,
                  garantizar la seguridad de la plataforma y prevenir el fraude.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Obligacion legal:</strong> cumplir con las leyes y
                  regulaciones aplicables.
                </li>
              </ul>

              {/* ── 5. ALMACENAMIENTO Y SEGURIDAD ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                5. ALMACENAMIENTO Y SEGURIDAD
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI implementa medidas tecnicas y organizativas
                apropiadas para proteger los datos personales contra el acceso
                no autorizado, la alteracion, la divulgacion o la destruccion.
                Estas medidas incluyen:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Cifrado:</strong> los datos se protegen mediante
                  cifrado TLS en transito y AES-256 en reposo.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Controles de acceso:</strong> acceso restringido a los
                  datos personales, limitado al personal autorizado que necesite
                  acceder para el desempeno de sus funciones.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Monitorizacion:</strong> sistemas de deteccion y
                  prevencion de intrusiones para identificar y responder a
                  posibles amenazas de seguridad.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Evaluaciones periodicas:</strong> auditorias y
                  evaluaciones regulares de seguridad para garantizar la
                  eficacia de las medidas implementadas.
                </li>
              </ul>

              {/* ── 6. COMPARTICION DE DATOS CON TERCEROS ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                6. COMPARTICION DE DATOS CON TERCEROS
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI no vende datos personales de sus usuarios. Sin
                embargo, podemos compartir datos con terceros en las siguientes
                circunstancias:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Proveedores de infraestructura:</strong> servicios de
                  alojamiento, almacenamiento en la nube y procesamiento de datos
                  necesarios para la operacion de la plataforma.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Procesadores de pago:</strong> pasarelas de pago
                  seguras para gestionar las transacciones de los usuarios.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Obligaciones legales:</strong> cuando sea requerido por
                  ley, orden judicial o requerimiento de autoridades competentes.
                </li>
              </ul>
              <p style={{ marginBottom: 16 }}>
                Todos los terceros con los que compartimos datos estan obligados
                contractualmente a proteger la informacion y a utilizarla
                unicamente para los fines especificados.
              </p>

              {/* ── 7. TRANSFERENCIAS INTERNACIONALES ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                7. TRANSFERENCIAS INTERNACIONALES
              </h3>
              <p style={{ marginBottom: 16 }}>
                Dado que ContinuumAI opera a nivel global, los datos personales
                pueden ser transferidos y procesados en paises distintos al del
                usuario. En estos casos, ContinuumAI garantiza que se aplican
                mecanismos de proteccion adecuados, tales como:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  Clausulas Contractuales Tipo (CCT) aprobadas por las
                  autoridades competentes.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Adhesion a marcos de privacidad reconocidos, como el EU-U.S.
                  Data Privacy Framework.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Decisiones de adecuacion emitidas por las autoridades de
                  proteccion de datos.
                </li>
              </ul>

              {/* ── 8. DERECHOS DEL USUARIO ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                8. DERECHOS DEL USUARIO
              </h3>
              <p style={{ marginBottom: 16 }}>
                El usuario tiene los siguientes derechos en relacion con sus
                datos personales:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Acceso:</strong> derecho a obtener confirmacion de si
                  se estan tratando sus datos y a acceder a los mismos.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Rectificacion:</strong> derecho a solicitar la
                  correccion de datos inexactos o incompletos.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Supresion:</strong> derecho a solicitar la eliminacion
                  de sus datos personales cuando ya no sean necesarios para la
                  finalidad para la que fueron recogidos.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Portabilidad:</strong> derecho a recibir sus datos en
                  un formato estructurado, de uso comun y lectura mecanica.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Oposicion:</strong> derecho a oponerse al tratamiento
                  de sus datos en determinadas circunstancias.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Limitacion:</strong> derecho a solicitar la restriccion
                  del tratamiento de sus datos en determinados supuestos.
                </li>
              </ul>
              <p style={{ marginBottom: 16 }}>
                Para ejercer cualquiera de estos derechos, el usuario puede
                contactarnos a traves de los canales de soporte disponibles en
                la plataforma. Responderemos a las solicitudes en el plazo
                legalmente establecido.
              </p>

              {/* ── 9. COOKIES Y TECNOLOGIAS SIMILARES ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                9. COOKIES Y TECNOLOGIAS SIMILARES
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI utiliza cookies y tecnologias similares para mejorar
                la experiencia del usuario y analizar el uso de la plataforma.
                Las categorias de cookies que utilizamos incluyen:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Cookies esenciales:</strong> necesarias para el
                  funcionamiento basico de la plataforma, como la autenticacion
                  y la seguridad.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Cookies analiticas:</strong> nos permiten comprender
                  como los usuarios interactuan con la plataforma para mejorar
                  su rendimiento y funcionalidad.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Cookies funcionales:</strong> permiten recordar las
                  preferencias del usuario y personalizar su experiencia.
                </li>
              </ul>
              <p style={{ marginBottom: 16 }}>
                El usuario puede gestionar sus preferencias de cookies a traves
                de la configuracion de su navegador.
              </p>

              {/* ── 10. RETENCION DE DATOS ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                10. RETENCION DE DATOS
              </h3>
              <p style={{ marginBottom: 16 }}>
                Los datos personales se conservaran mientras dure la relacion
                contractual con el usuario y, posteriormente, durante el periodo
                necesario para cumplir con las obligaciones legales aplicables.
              </p>
              <p style={{ marginBottom: 16 }}>
                Una vez transcurrido el periodo de retencion, los datos seran
                eliminados o anonimizados de forma segura, utilizando metodos de
                destruccion que garanticen la imposibilidad de su recuperacion.
              </p>

              {/* ── 11. MENORES DE EDAD ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                11. MENORES DE EDAD
              </h3>
              <p style={{ marginBottom: 16 }}>
                La plataforma ContinuumAI no esta dirigida a menores de 18 anos.
                No recopilamos intencionalmente datos personales de menores de
                edad. Si tenemos conocimiento de que hemos recopilado datos de
                un menor sin el consentimiento verificable de su padre, madre o
                tutor legal, procederemos a eliminar dicha informacion de forma
                inmediata.
              </p>

              {/* ── 12. MODIFICACIONES ── */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                12. MODIFICACIONES
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI se reserva el derecho de modificar esta Politica de
                Privacidad en cualquier momento. Las modificaciones entraran en
                vigor desde su publicacion en la plataforma. Se notificara a los
                usuarios sobre cambios sustanciales a traves de los medios de
                comunicacion disponibles en la plataforma.
              </p>
              <p style={{ marginBottom: 16 }}>
                El uso continuado de la plataforma despues de la publicacion de
                las modificaciones constituira la aceptacion de la Politica de
                Privacidad actualizada.
              </p>

              <p style={{ marginBottom: 16, marginTop: 32 }}>
                <em>
                  Si tiene preguntas sobre esta Politica de Privacidad, puede
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
