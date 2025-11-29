import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { streamAssistantReply, getAssistantReply } from "@/lib/openai";
import { getUserContextForPrompt } from "@/lib/memory/user-context";
import { getUserPlanName } from "@/lib/subscription";

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
 * Generate comprehensive geocultural analysis
 */
async function generateGeoCulturalAnalysis(
    areaName: string,
    userMessage: string
): Promise<string> {
    const prompt = `MÓDULO GEOCULTURAL GLOBAL ACTIVADO

Eres un asistente geocultural experto que analiza territorios con profundidad histórica, cultural y social.

UBICACIÓN A ANALIZAR: ${areaName}
SOLICITUD DEL USUARIO: "${userMessage}"

GENERA UN INFORME COMPLETO EN TEXTO PLANO que incluya TODOS estos elementos:

1. IDENTIDAD HISTÓRICA PROFUNDA
   - Historia del territorio desde los primeros asentamientos humanos
   - Evolución a través de diferentes épocas hasta la actualidad
   - Eventos históricos clave que definieron el lugar

2. LENGUAS ORIGINARIAS
   - Lenguas que se hablaban/hablan en el área
   - Cuáles siguen vigentes
   - Cuáles están en riesgo de desaparecer
   - Cuáles ya desaparecieron

3. PATRIMONIO CULTURAL MATERIAL E INMATERIAL
   - Rituales y ceremonias tradicionales
   - Gastronomía típica y platillos emblemáticos
   - Tradiciones y festividades
   - Leyendas y mitos del lugar
   - Cosmovisiones y creencias
   - Prácticas comunitarias

4. NARRATIVA INTEGRADA PASADO-PRESENTE-FUTURO
   - Cómo el pasado moldea el presente
   - Continuidad cultural y social
   - Proyección hacia el futuro
   - Retos y oportunidades actuales

5. ANÁLISIS EDUCATIVO
   - Escuelas históricas y actuales
   - Universidades e instituciones de educación superior
   - Proyectos de conocimiento comunitario
   - Oportunidades de aprendizaje en el territorio

6. CONEXIONES TURÍSTICAS Y PATRIMONIO
   - Museos importantes
   - Zonas arqueológicas
   - Rutas históricas
   - Monumentos y puntos de interés patrimonial
   - Sitios declarados patrimonio

7. POTENCIAL ECONÓMICO LOCAL
   - Comercio tradicional y moderno
   - Artesanías características
   - Actividades económicas tradicionales
   - Turismo cultural
   - Servicios locales distintivos

8. ANÁLISIS TERRITORIAL AMPLIADO
   - Contexto de zonas vecinas
   - Conexiones regionales
   - Influencias culturales de áreas cercanas
   - Radio de influencia del territorio

9. LEYENDAS Y RELATOS LOCALES
   - Historias tradicionales del área
   - Personajes legendarios
   - Relatos basados en la tradición oral
   - Narrativas que definen la identidad local

10. ADAPTACIÓN DEL CONTENIDO
    - Ajusta el lenguaje según el contexto de la pregunta del usuario
    - Si es para niños: lenguaje simple y didáctico
    - Si es para académicos: profundidad y referencias
    - Si es para turistas: aspectos prácticos y atractivos

11. RESPETO CULTURAL Y PRECISIÓN
    - Mantén absoluto respeto por todas las culturas
    - Precisión histórica basada en fuentes confiables
    - Neutralidad en temas sensibles
    - Evita estereotipos o generalizaciones

12. CONTINUIDAD GEOCULTURAL
    - Este análisis debe reflejar comprensión profunda del territorio
    - Integra todos los elementos en una narrativa coherente

FORMATO DE RESPUESTA:
- Texto plano, bien estructurado con párrafos
- Usa títulos claros para cada sección (usa emojis apropiados para cada sección)
- Longitud: suficientemente detallado (800-1500 palabras)
- Tono: educativo, respetuoso, informativo
- NO uses formato JSON
- NO uses markdown complejo (solo títulos simples con ##)
- Texto organizado y fácil de leer

IMPORTANTE: Genera un análisis COMPLETO que cubra TODOS los 12 puntos anteriores de forma integrada y coherente.`;

    return await getAssistantReply(prompt, [], '');
}

// ============================================================================
// GEOCULTURAL MODE HANDLER
// ============================================================================

async function handleGeoCulturalMode(
    message: string,
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

    // Generate comprehensive geocultural analysis
    const analysis = await generateGeoCulturalAnalysis(areaName, message);

    // Return plain text response
    return NextResponse.json({
        reply: analysis,
        areaName: areaName,
        type: 'geocultural_analysis'
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
            return await handleGeoCulturalMode(message, geoCulturalContext);
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
