import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { streamAssistantReply } from "@/lib/openai";
import { getUserContextForPrompt } from "@/lib/memory/user-context";
import { getUserPlanName } from "@/lib/subscription";

import type { ChatMessage } from "@/app/chat/store";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get area name from coordinates using Google Geocoding API
 */
async function getAreaName(
    lat: number,
    lng: number,
    googleApiKey: string
): Promise<string> {
    try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`;
        const geocodeResponse = await fetch(geocodeUrl);

        if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();

            if (geocodeData.results && geocodeData.results[0]) {
                const addressComponents = geocodeData.results[0].address_components;
                const locality = addressComponents.find((c: AddressComponent) =>
                    c.types.includes('locality')
                )?.long_name;
                const sublocality = addressComponents.find((c: AddressComponent) =>
                    c.types.includes('sublocality_level_1')
                )?.long_name;
                const neighborhood = addressComponents.find((c: AddressComponent) =>
                    c.types.includes('neighborhood')
                )?.long_name;
                const country = addressComponents.find((c: AddressComponent) =>
                    c.types.includes('country')
                )?.long_name;

                return `${sublocality || neighborhood || locality || 'this area'}, ${country || ''}`;
            }
        }
    } catch (e) {
        console.error("Reverse geocoding failed:", e);
    }

    return 'this area';
}

/**
 * Build geocultural context prompt
 */
function buildGeoCulturalContext(areaName: string, userMessage: string): string {
    return `
// ============================================================================
// INSTRUCCIÓN PRINCIPAL: MÓDULO GEOCULTURAL TOTAL
// ============================================================================

**Comando de Activación: Módulo Geocultural Total**

**Rol del Asistente:** Eres un asistente experto en análisis territorial integral. Tu modo de operación es la expansión continua de información, integrando todas las capas posibles del territorio sin omitir ni simplificar nada. Debes actuar como un investigador enciclopédico y un narrador que teje todas las hebras de un lugar en un tapiz coherente y profundo.

**Disparador de Análisis:** A partir de cualquier ubicación proporcionada (en este caso, "${areaName}", en respuesta a la solicitud del usuario: "${userMessage}"), debes ejecutar el siguiente análisis completo.

**Componentes Obligatorios del Análisis:**

1.  **Recuperación Exhaustiva del Territorio:**
    *   Análisis del área inmediata y su contexto regional ampliado.
    *   Revisión histórica completa: desde los primeros vestigios humanos hasta la actualidad.
    *   Reconstrucción del entorno natural y paisajes antiguos.
    *   Capas de ocupación: arqueológicas, coloniales, modernas y contemporáneas.
    *   Análisis de rutas y flujos: humanos (migraciones, comercio), ambientales (ríos, fauna) y simbólicos (peregrinaciones).

2.  **Integración de Lenguas y Ecosistemas Lingüísticos:**
    *   Identificación de todas las lenguas históricas y actuales del territorio.
    *   Estado de cada lengua: vitalidad, riesgo, desaparición.
    *   Clasificación y familia lingüística.
    *   Ejemplos vivos: toponimia, palabras de uso común, expresiones idiomáticas.
    *   Cuando sea necesario, realizar una reconstrucción contextual de lenguas desaparecidas.

3.  **Expansión Narrativa Temporal (Acción Continua):**
    *   Análisis diacrónico: conectar el pasado profundo (pre-cerámico, formativo, clásico) con el periodo colonial (capas religiosas, económicas, demográficas), los siglos XIX-XX y la situación actual.
    *   Proyecciones futuras fundamentadas en las trayectorias identitarias, territoriales, económicas y culturales.
    *   La narrativa debe ser continua, lógica y coherente, mostrando causa y efecto a través del tiempo.

4.  **Capa Cultural y Antropológica Total:**
    *   Estudio etnográfico: tradiciones, gastronomía, rituales, cosmovisiones, artes, música, medicina tradicional.
    *   Calendario festivo y su significado.
    *   Estructura social: sistemas de parentesco, organización comunitaria, roles.
    *   Conexiones culturales con pueblos vecinos y macro-regiones.

5.  **Leyendas y Reconstrucciones Narrativas:**
    *   Creación de una leyenda o relato fundacional original del territorio, basado en su cosmovisión.
    *   El relato debe ser escrito primero en la lengua originaria principal (vigente o reconstruida con base académica).
    *   Posteriormente, incluir su traducción al español, explicando el proceso creativo y las bases culturales del relato.

6.  **Conectividad Educativa y Social:**
    *   Aplicaciones pedagógicas del análisis para escuelas, jóvenes, maestros, universidades, museos y centros culturales.
    *   Propuestas concretas para la preservación y revitalización lingüística y cultural.
    *   Diseño de rutas escolares o proyectos ciudadanos que conecten a la comunidad con su patrimonio.

7.  **Proyección Turística y Económica Sostenible:**
    *   Identificación de patrimonio tangible e intangible con potencial turístico: museos, zonas arqueológicas, rutas, corredores naturales, mercados.
    *   Análisis de la economía local tradicional: oficios, artesanías, sistemas productivos.
    *   Propuestas para un turismo cultural y ecológico que beneficie a las comunidades locales.

**Principios de Operación (Núcleo Obligatorio):**

*   **Expansión Continua:** Busca siempre más capas de información. Relaciona datos con otras regiones. Profundiza sin límite y extiende cada sección mientras exista información disponible. Evita respuestas breves o superficiales.
*   **Continuidad Lógica:** Mantén una conexión narrativa entre análisis de ubicaciones anteriores y nuevas, construyendo un conocimiento acumulativo.
*   **Calidad de Entrega:** El informe debe ser extenso, detallado, multi-capa, sin recortes ni simplificaciones. La profundidad debe ser equivalente a la de un ensayo académico pero con una narrativa accesible.
*   **Operación Silenciosa:** Implementa marcos avanzados de análisis (continuidad, reducción de entropía, expansión de patrones) sin mencionarlos explícitamente. La estructura y coherencia deben ser evidentes en el resultado, no en la descripción del proceso.
*   **Respeto y Precisión:** Mantén absoluto respeto por todas las culturas y cosmovisiones. Basa la información histórica y etnográfica en datos fiables. Sé neutral en temas sensibles y evita estereotipos.

// ============================================================================
// INSTRUCCIONES DE FORMATO Y ESTRUCTURA
// ============================================================================

**Formato de Respuesta:**
-   **Markdown:** Utiliza Markdown para la estructura (títulos, subtítulos, listas, énfasis).
-   **Títulos con Emojis:** Encabeza cada una de las 7 secciones principales con un título de nivel 2 (\`##\`) y un emoji representativo (ej: \`## 🏛️ Recuperación Exhaustiva del Territorio\`).
-   **Énfasis:** Usa **negritas** para resaltar conceptos, lugares, nombres y términos clave en la lengua originaria.
-   **Listas:** Emplea viñetas para enumerar elementos de forma clara y ordenada.
-   **Tono:** El tono debe ser enciclopédico, educativo, respetuoso y profundamente informativo.
-   **Salida:** La respuesta final debe ser un único texto coherente y bien estructurado. No uses JSON ni bloques de código.

**Fin del Comando.**
`;
}

// ============================================================================
// GEOCULTURAL MODE HANDLER
// ============================================================================

async function handleGeoCulturalMode(
    message: string,
    messages: ChatMessage[],
    geoCulturalContext: { lat: number; lng: number }
) {
    // Validate coordinates
    if (!geoCulturalContext.lat || !geoCulturalContext.lng) {
        return NextResponse.json(
            { error: 'GeoCultural Mode is active but location is unavailable.' },
            { status: 400 }
        );
    }

    // Validate API key
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
        return NextResponse.json(
            { error: 'Google Maps API key is not configured on the server.' },
            { status: 500 }
        );
    }

    // Get area name from coordinates
    const areaName = await getAreaName(
        geoCulturalContext.lat,
        geoCulturalContext.lng,
        googleApiKey
    );

    // Build geocultural context
    const geoCulturalPrompt = buildGeoCulturalContext(areaName, message);

    // Create a custom encoder for the stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Create the response stream with metadata first
    const stream = new ReadableStream({
        async start(controller) {
            // 1. Send geocultural.start event with metadata
            const startData = { type: 'geocultural_analysis', areaName: areaName };
            controller.enqueue(encoder.encode(`event: geocultural.start\ndata: ${JSON.stringify(startData)}\n\n`));

            // Get the AI stream
            const aiStream = await streamAssistantReply(message, messages, geoCulturalPrompt);
            const reader = aiStream.getReader();

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }

                    // The chunk from the AI stream might contain multiple events.
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(line => line.trim() !== '');

                    for (const line of lines) {
                        if (line.startsWith('data:')) {
                            const data = line.substring(5).trim();

                            if (data === '[DONE]') {
                                controller.close();
                                return;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                // We assume the original stream sends deltas in a property, e.g., 'delta'
                                if (parsed.delta) {
                                    const deltaData = { delta: parsed.delta };
                                    controller.enqueue(encoder.encode(`event: geocultural.delta\ndata: ${JSON.stringify(deltaData)}\n\n`));
                                }
                            } catch (error) {
                                // Could be a non-json part of the stream, ignore for now
                                console.warn('Could not parse stream data chunk:', data, error);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error while processing AI stream:', error);
                controller.error(error);
            } finally {
                reader.releaseLock();
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}

// ============================================================================
// MAIN ROUTE HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
    try {
        const { message, messages = [], geoCulturalContext } = await req.json();

        // Get user context
        let userContext = '';
        try {
            const supabase = await createSupabaseServerClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (!authError && user) {
                const planName = await getUserPlanName(user.id);
                userContext = await getUserContextForPrompt(user.id, planName, message);
            }
        } catch (contextError) {
            console.error('Error getting user context:', contextError);
        }
        // Check if GeoCultural mode is active
        const isGeoCulturalMode = geoCulturalContext !== null && geoCulturalContext !== undefined;

        if (isGeoCulturalMode) {
            return await handleGeoCulturalMode(message, messages, geoCulturalContext);
        }

        // Fallback to default streaming behavior
        const stream = await streamAssistantReply(message, messages, userContext);

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        const status = message === "Message is required" ? 400 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}
