import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { streamAssistantReply, getAssistantReply } from "@/lib/openai";
import { getUserContextForPrompt } from "@/lib/memory/user-context";
import { getUserPlanName } from "@/lib/subscription";
import { haversineDistance, estimateTravelTime, type Coords } from "@/lib/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type Place = {
    name: string;
    description: string;
    lat: number;
    lng: number;
    detailedDescription?: string;
    historicalContext?: string;
    culturalSignificance?: string;
};

interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}

interface AIIdeas {
    reply: string;
    categories: string[];
    numberOfPlaces?: number;
    includeDescriptions?: boolean;
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

                return sublocality || neighborhood || locality || 'your current area';
            }
        }
    } catch (e) {
        console.error("Reverse geocoding failed:", e);
    }

    return 'your current area';
}

/**
 * Build GeoCultural instructions prompt for AI
 */
function buildGeoCulturalPrompt(areaName: string, message: string): string {
    return `
MÓDULO GEOCULTURAL GLOBAL ACTIVADO

ROLE: You are an AI geocultural assistant that provides deep territorial analysis combining history, culture, education, and tourism.

USER LOCATION: The user is in the **${areaName}** area.

USER'S REQUEST: "${message}"

GEOCULTURAL ANALYSIS FRAMEWORK:
Cuando analices cualquier ubicación, debes proporcionar un informe completo que incluya:

1. IDENTIDAD HISTÓRICA PROFUNDA: Historia del territorio desde los primeros asentamientos humanos hasta la actualidad.

2. LENGUAS ORIGINARIAS: Identificar lenguas del área, cuáles siguen vigentes, cuáles están en riesgo y cuáles desaparecieron.

3. PATRIMONIO CULTURAL: Material e inmaterial - rituales, gastronomía, tradiciones, leyendas, cosmovisiones y prácticas comunitarias.

4. NARRATIVA INTEGRADA: Conexión pasado-presente-futuro del lugar, explicando la continuidad cultural y social.

5. ANÁLISIS EDUCATIVO: Escuelas, universidades, proyectos de conocimiento y oportunidades de aprendizaje del territorio.

6. CONEXIONES TURÍSTICAS: Museos, zonas arqueológicas, rutas históricas y puntos de interés.

7. POTENCIAL ECONÓMICO LOCAL: Comercio, artesanías, actividades tradicionales, turismo y servicios.

8. ANÁLISIS TERRITORIAL AMPLIADO: Contexto de zonas vecinas para comprender el área mayor.

9. LEYENDAS LOCALES: Relatos y narrativas basadas en la tradición del área.

10. ADAPTACIÓN DE CONTENIDO: Ajustar según audiencia (niños, jóvenes, adultos, docentes, turistas, investigadores).

11. RESPETO CULTURAL: Precisión histórica absoluta y neutralidad cultural.

12. CONTINUIDAD: Mantener análisis geocultural activo en toda interacción con ubicaciones.

TASK: Based on the user's request, identify relevant categories and desired number of places.

VALID CATEGORIES: art_gallery, museum, park, tourist_attraction, landmark, cafe, library, church, historic_site.

CRITICAL: Output ONLY raw JSON, no markdown.

The JSON object must have this EXACT structure:

{
  "reply": "Una respuesta breve y culturalmente rica que refleje el contexto histórico del área (ej: '¡Claro! ${areaName} tiene una rica herencia cultural. Explorando los mejores museos...')",
  "categories": ["category1", "category2"],
  "numberOfPlaces": 3,
  "includeDescriptions": false
}

RULES:
- Choose the most relevant categories from the valid list.
- **numberOfPlaces**: If the user specifies a number (e.g., "un lugar", "5 museos"), use that exact number. Otherwise, default to 3.
- **includeDescriptions**: Set to true if the user explicitly asks for descriptions, details, or information (e.g., "descríbeme", "cuéntame sobre", "información de", "qué hay", "detalles de").
- Integrate geocultural awareness in your reply (mention historical/cultural significance of ${areaName}).
- ALWAYS return a valid JSON object with "reply", "categories", "numberOfPlaces", and "includeDescriptions".

START YOUR RESPONSE WITH { AND END WITH }`;
}

/**
 * Search for nearby places using Google Places API
 */
async function searchNearbyPlaces(
    userCoords: Coords,
    categories: string[],
    searchRadius: number,
    googleApiKey: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
    const placesPromises = (categories || ["tourist_attraction"]).map(async (category) => {
        const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${userCoords.lat},${userCoords.lng}&radius=${searchRadius}&type=${category}&fields=name,place_id,geometry,rating,types,editorial_summary&key=${googleApiKey}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        return searchData.results || [];
    });

    const resultsByCategory = await Promise.all(placesPromises);
    return resultsByCategory.flat();
}

/**
 * Deduplicate and sort places by rating
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deduplicateAndSortPlaces(places: any[], limit: number) {
    const uniquePlaces = Array.from(
        new Map(places.map(p => [p.place_id, p])).values()
    );
    uniquePlaces.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return uniquePlaces.slice(0, limit);
}

/**
 * Format places with distance calculations
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatPlacesWithDistances(places: any[], userCoords: Coords): Place[] {
    return places.map(place => {
        const placeCoords = {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
        };
        const distance = haversineDistance(userCoords, placeCoords);
        const travel_time = estimateTravelTime(distance);

        return {
            name: place.name,
            description: `${place.types?.[0]?.replace(/_/g, ' ') || 'Place'} `,
            lat: placeCoords.lat,
            lng: placeCoords.lng,
            rating: place.rating || 0,
            distance: `${distance.toFixed(1)} km`,
            travel_time,
        };
    });
}

/**
 * Generate historical and cultural context for places
 */
async function generatePlacesContext(
    places: Place[],
    areaName: string
): Promise<Place[]> {
    return Promise.all(
        places.map(async (place) => {
            try {
                const contextPrompt = `
Analiza "${place.name}" en ${areaName} con profundidad histórica y cultural.

Proporciona:
- Historia desde los orígenes hasta hoy
- Conexiones con pueblos originarios y lenguas del área
- Patrimonio cultural y tradiciones asociadas
- Importancia educativa, turística y económica
- Narrativa que conecte pasado, presente y futuro
- Leyendas o relatos históricos relevantes

IMPORTANTE: Responde SOLO con un JSON válido sin markdown, con esta estructura exacta:
{
  "historicalContext": "3-4 oraciones sobre la historia profunda del lugar, incluyendo primeros asentamientos y evolución",
  "culturalSignificance": "3-4 oraciones sobre importancia cultural, patrimonio, tradiciones y conexión con la comunidad actual"
}

Si no conoces el lugar específico, proporciona contexto general rico sobre ese tipo de lugar en ${areaName}.`;

                const contextResponse = await getAssistantReply(contextPrompt, [], '');
                const contextData = JSON.parse(contextResponse);

                return {
                    ...place,
                    historicalContext: contextData.historicalContext,
                    culturalSignificance: contextData.culturalSignificance,
                };
            } catch (error) {
                console.error(`Failed to get context for ${place.name}:`, error);
                return place;
            }
        })
    );
}

/**
 * Generate comprehensive historical and cultural context for the area
 */
async function generateAreaContext(areaName: string): Promise<string> {
    try {
        const areaContextPrompt = `
Genera un análisis territorial completo de ${areaName} que incluya:

1. IDENTIDAD HISTÓRICA: Primeros asentamientos humanos hasta la actualidad
2. LENGUAS ORIGINARIAS: Cuáles se hablan, están en riesgo o desaparecieron
3. PATRIMONIO CULTURAL: Rituales, gastronomía, tradiciones, leyendas, cosmovisiones
4. NARRATIVA INTEGRADA: Conexión pasado-presente-futuro
5. EDUCACIÓN: Instituciones educativas importantes y proyectos de conocimiento
6. TURISMO: Museos, zonas arqueológicas, rutas históricas
7. ECONOMÍA LOCAL: Artesanías, comercio tradicional, actividades características
8. CONTEXTO TERRITORIAL: Zonas vecinas y conexiones regionales
9. LEYENDAS Y RELATOS: Narrativas tradicionales del área

Formato: 6-8 oraciones bien estructuradas que integren estos elementos de forma coherente y educativa.

Mantén precisión histórica, respeto cultural y neutralidad absoluta.`;

        return await getAssistantReply(areaContextPrompt, [], '');
    } catch (error) {
        console.error('Failed to get area context:', error);
        return '';
    }
}

// ============================================================================
// GEOCULTURAL MODE HANDLER
// ============================================================================

async function handleGeoCulturalMode(
    message: string,
    geoCulturalContext: { lat: number; lng: number },
    userContext: string
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

    const userCoords: Coords = {
        lat: geoCulturalContext.lat,
        lng: geoCulturalContext.lng
    };

    // Step 1: Get area name
    const areaName = await getAreaName(userCoords.lat, userCoords.lng, googleApiKey);

    // Step 2: Get AI suggestions for categories and places
    const geoCulturalInstructions = buildGeoCulturalPrompt(areaName, message);
    const fullContext = userContext + geoCulturalInstructions;
    const aiResponseString = await getAssistantReply(message, [], fullContext);

    let aiIdeas: AIIdeas;
    try {
        aiIdeas = JSON.parse(aiResponseString);
    } catch (error) {
        console.error("Failed to parse AI category response:", error);
        return NextResponse.json(
            { error: "Failed to understand intent from the assistant." },
            { status: 500 }
        );
    }

    // Step 3: Search for nearby places
    const searchRadius = 2500; // 2.5km radius
    const limit = aiIdeas.numberOfPlaces || 3;

    const allPlaces = await searchNearbyPlaces(
        userCoords,
        aiIdeas.categories,
        searchRadius,
        googleApiKey
    );

    // Deduplicate and sort
    const topPlaces = deduplicateAndSortPlaces(allPlaces, limit);

    // Handle no results
    if (topPlaces.length === 0) {
        return NextResponse.json({
            reply: `No encontré lugares de interés en las categorías [${(aiIdeas.categories || []).join(', ')}] en un radio de 2.5km a tu alrededor en ${areaName}. ¡Intenta con otra búsqueda!`,
            places: [],
            userCoords: userCoords,
            userAreaName: areaName,
        });
    }

    // Step 4: Format places with distance calculations
    const placesWithCalculations = formatPlacesWithDistances(topPlaces, userCoords);

    // Step 5: Generate historical and cultural context
    const placesWithContext = await generatePlacesContext(
        placesWithCalculations,
        areaName
    );

    const areaHistoricalContext = await generateAreaContext(areaName);

    // Build final response
    const finalResponse = {
        reply: aiIdeas.reply,
        places: placesWithContext,
        userCoords: userCoords,
        userAreaName: areaName,
        areaHistoricalContext: areaHistoricalContext,
    };

    return NextResponse.json(finalResponse);
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
            return await handleGeoCulturalMode(message, geoCulturalContext, userContext);
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
