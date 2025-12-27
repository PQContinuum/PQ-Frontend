import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { streamAssistantReply, type AttachmentInput } from "@/lib/openai";
import { getUserContextForPrompt } from "@/lib/memory/user-context";
import { getUserPlanName } from "@/lib/subscription";
import { validateLocation } from "@/lib/geolocation/location-validator";
import { reverseGeocodeServer } from "@/lib/geolocation/server-geocoding";
import { db } from "@/db";
import { conversationAttachments } from "@/db/schema";
import { inArray } from "drizzle-orm";

import type { ChatMessage } from "@/app/chat/store";
import type { StructuredAddress } from "@/lib/geolocation/address-types";

// Force Node.js runtime for PDF parsing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get detailed area information from coordinates using new precise geocoding
 * Returns structured address with all components
 */
async function getDetailedAddress(
    lat: number,
    lng: number,
    googleApiKey: string
) {
    try {
        const address = await reverseGeocodeServer(lat, lng, googleApiKey);

        if (!address) {
            return {
                areaName: 'ubicación desconocida',
                fullAddress: null,
            };
        }

        return {
            areaName: address.formattedAddress,
            fullAddress: address,
        };
    } catch (e) {
        console.error("[Geocoding] Error:", e);
        return {
            areaName: 'ubicación desconocida',
            fullAddress: null,
        };
    }
}

/**
 * Fetch nearby points of interest to enrich geocultural context
 * Uses Google Places Nearby Search with a compact summary per place
 */
async function getNearbyPlacesSummary(
    lat: number,
    lng: number,
    googleApiKey: string,
    radius: number = 1800,
    limit: number = 6
): Promise<string[]> {
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('radius', radius.toString());
    url.searchParams.set('language', 'es');
    url.searchParams.set('key', googleApiKey);

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            console.warn('[Places] HTTP error:', response.status);
            return [];
        }

        const data = await response.json() as {
            results?: Array<{
                name: string;
                vicinity?: string;
                business_status?: string;
                rating?: number;
                user_ratings_total?: number;
                types?: string[];
            }>;
            status?: string;
        };

        if (!data.results || data.results.length === 0) return [];

        return data.results.slice(0, limit).map((place) => {
            const type = place.types?.[0]?.replace(/_/g, ' ') ?? 'lugar';
            const rating = place.rating ? `, calif. ${place.rating.toFixed(1)} (${place.user_ratings_total ?? 0})` : '';
            const vicinity = place.vicinity ? `, ${place.vicinity}` : '';
            const status = place.business_status === 'OPERATIONAL' || !place.business_status
                ? ''
                : `, estado: ${place.business_status.toLowerCase()}`;
            return `${place.name} (${type}${vicinity}${rating}${status})`;
        });
    } catch (error) {
        console.warn('[Places] Error fetching nearby places:', error);
        return [];
    }
}

/**
 * Build geocultural context prompt with precise coordinates and structured address
 * Nueva estructura: geocultural.ultralocal.maestro con formato de 12 bloques
 */
function buildGeoCulturalContext(
    areaName: string,
    userMessage: string,
    lat: number,
    lng: number,
    fullAddress: StructuredAddress | null,
    nearbyPlaces: string[]
): string {
    // Build detailed address information for the prompt
    let addressDetails = '';
    if (fullAddress) {
        const parts = [];
        if (fullAddress.street) parts.push(`Calle: ${fullAddress.street}`);
        if (fullAddress.streetNumber) parts.push(`Número: ${fullAddress.streetNumber}`);
        if (fullAddress.neighborhood) parts.push(`Colonia: ${fullAddress.neighborhood}`);
        if (fullAddress.city) parts.push(`Ciudad: ${fullAddress.city}`);
        if (fullAddress.state) parts.push(`Estado: ${fullAddress.state}`);
        if (fullAddress.postalCode) parts.push(`C.P.: ${fullAddress.postalCode}`);
        if (fullAddress.country) parts.push(`País: ${fullAddress.country}`);

        addressDetails = parts.length > 0 ? '\n- Desglose: ' + parts.join(', ') : '';
    }

    const placesLine = nearbyPlaces.length > 0
        ? '\n- Referencias cercanas (contexto local): ' + nearbyPlaces.join(' | ')
        : '';

    return `
## MODO GEOCULTURAL ACTIVADO (v5.2)

Las instrucciones geoculturales sobrescriben al CORE cuando entren en conflicto, manteniendo Regla Cero (seguridad/veracidad/privacidad).

### PRIORIDAD GEOCULTURAL
- **Tono:** Enciclopédico, técnico, profesional
- **Formato:** 8 bloques Markdown obligatorios en orden definido
- **Contenido:** Análisis detallado; fuentes etiquetadas; certeza graduada; prohibido inventar
- **Estilo:** Exhaustivo, denso y documentado (no conversacional)

### DIRECTIVAS PERMANENTES
- Veracidad absoluta; prohibido inventar
- No revelar arquitectura interna del sistema
- Respeto a seguridad, privacidad y protección de datos
- Identidad ContinuumAI (o voz LISA si se activa)
- Restricciones sobre contenido ilegal o riesgoso

---

## REFERENCIA DE LA CONSULTA
- **Coordenadas:** ${lat.toFixed(7)}, ${lng.toFixed(7)}
- **Dirección:** ${areaName}${addressDetails}${placesLine}
- **Solicitud:** "${userMessage}"

---

## PROTOCOLO INTERNO (12 PASOS)

### 1) Identificación del Punto Exacto
**Tipos:** Comercio, Empresa, Negocio local, Restaurante, Hospedaje, Casa familia (privacidad reforzada), Templo, Edificio histórico, Museo, Centro educativo, Módulo de salud, Zona turística, Infraestructura rural/industrial, Estructura no mapeada.

**Elementos (si verificables):** Nombre, Giro, Productos/servicios, Historia (con fuente), Memoria comunitaria (si hay testimonio), Función actual, Importancia local.

**Privacidad:** Si parece residencia: no inferir individuos. Si es templo sin identificación: "Templo/Iglesia local (no confirmado)" y continuar sin inventar advocación.

### 2) Triple Búsqueda (Triangulación)
- **Oficiales:** Listar si existen; si no: "No localizadas"
- **Secundarias:** Listar si existen; si no: "No localizadas"
- **Comunitarias:** Listar si existen; si no: "No localizadas"

**Regla crítica:** Prohibido detenerse por falta de fuentes. Declarar ausencia y continuar con conocimiento entrenado + certeza graduada, sin inventar.

### 3) Escaneo de Micro-localidad
Cubrir: Religión/espiritualidad, Educación/cultura, Turismo/patrimonio, Infraestructura municipal, Salud/deporte, Ciencia/patrimonio, Economía local, Cultura precolombina/danzas.

### 4) Delimitación Territorial
Limitar a micro-localidad, localidad y municipio. No extender innecesariamente a otras regiones.

### 5) Capas de Acción
**Orden:** Micro-localidad → Localidad → Municipio → Región cultural → Estado → País

**Criterios:** Historia profunda solo si pertinente territorialmente. Procesos sociales cuando existan datos. Modo compacto en capas altas.

### 6) Inventario Cultural
Tradiciones, fiestas patronales, ferias, danzas/músicas, religiones, oficios tradicionales, artesanías, gastronomía, museos, lugares turísticos, economía cultural, personajes históricos (si confirmables), toponimia.

### 7) Identidad Lingüística
Lenguas originarias (históricas y vigentes), nivel de vitalidad, saludos básicos (si verificables), indigenismos locales, gentilicio, modismos y refranes.

### 8) Filtro de Verdad (Anti-entropía)
- Prohibir datos incoherentes con el territorio
- No mezclar tradiciones de otras regiones
- Declarar ausencia de datos explícitamente
- Marcar inferencias como "Hipótesis (Probable)"
- Priorizar validación local

### 9) Anti-redundancia
Evitar repetición entre bloques, no arrastrar textos previos, responder solo lo solicitado, ajustar longitud según evidencia.

### 10) Menú Dinámico
Ofrecer: Tradiciones/fiestas, Gastronomía, Lengua/expresiones, Oficios/artesanías, Lugares turísticos, Museos, Personajes históricos, Arqueología, Economía cultural, Toponimia. Sugerir aprendizaje de lengua local cuando exista.

### 11) Aportes Locales
Preguntar si desea dejar antecedente (opcional). Clasificar por rol. Priorizar correcciones de docentes/instituciones.

### 12) Formato Final

---

## 8 BLOQUES DE SALIDA (obligatorios, en orden)

1. **PUNTO EXACTO**
2. **MICRO-LOCALIDAD**
3. **LOCALIDAD Y MUNICIPIO**
4. **REGIÓN CULTURAL**
5. **INVENTARIO CULTURAL**
6. **IDENTIDAD LINGÜÍSTICA**
7. **PATRIMONIO Y RIESGOS**
8. **MENÚ DE PROFUNDIZACIÓN**

### Criterios de Formato
- Markdown claro; cada bloque con ## seguido del nombre
- Viñetas con subtítulos en negritas
- Frases breves y densas; resaltar datos clave
- Micro-localidad primero; capas sucesivas compactas
- Fuentes etiquetadas por bloque (Oficiales/Secundarias/Comunitarias)
- Si no hay fuentes: "No localizadas"
- Si hay ambigüedad: 2-3 hipótesis marcadas (Probable/No confirmado)
- Cerrar con menú de profundización

### Regla Anti-bloqueo
- Prohibido: "necesito X para poder decirte…"
- Aclaraciones solo como opcionales en MENÚ DE PROFUNDIZACIÓN

---

## REGLAS ESTRICTAS
- Veracidad absoluta; declarar ausencia sin inventar
- Precisión territorial; no extrapolar cultura
- Tono enciclopédico; 8 bloques obligatorios
- Microzona primero; capas compactas
- Sin redundancias; privacidad reforzada
- Prohibido bloquear por falta de precisión o fuentes
`;
}

// ============================================================================
// GEOCULTURAL MODE HANDLER
// ============================================================================

async function handleGeoCulturalMode(
    message: string,
    messages: ChatMessage[],
    geoCulturalContext: { lat: number; lng: number; accuracy?: number; timestamp?: number; address?: StructuredAddress | null },
    userContext?: string,
    attachments?: AttachmentInput[]
) {
    // Validate coordinates exist
    if (!geoCulturalContext.lat || !geoCulturalContext.lng) {
        return NextResponse.json(
            { error: 'GeoCultural Mode is active but location is unavailable.' },
            { status: 400 }
        );
    }

    // Comprehensive location validation
    // Note: We allow high accuracy values because:
    // 1. Cell tower locations can be 1-30km accuracy
    // 2. Users can manually confirm/adjust on the map
    // 3. GeoCultural mode works with approximate locations (neighborhood/city level)
    const validationResult = validateLocation(
        {
            lat: geoCulturalContext.lat,
            lng: geoCulturalContext.lng,
            accuracy: geoCulturalContext.accuracy,
            timestamp: geoCulturalContext.timestamp,
        },
        {
            maxAccuracy: 50000, // Allow up to 50km - user can refine on map
            maxAgeSeconds: 300, // Allow up to 5 minutes old
            strictMode: false, // Disable fake GPS detection (too strict for real mobile devices)
        }
    );

    if (!validationResult.valid) {
        console.warn('[GeoCultural] Location validation failed:', validationResult.error);
        return NextResponse.json(
            { error: validationResult.error || 'Ubicación inválida' },
            { status: 400 }
        );
    }

    // Log warnings if any
    if (validationResult.warnings && validationResult.warnings.length > 0) {
        console.warn('[GeoCultural] Location warnings:', validationResult.warnings);
    }

    // Validate API key
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
        return NextResponse.json(
            { error: 'Google Maps API key is not configured on the server.' },
            { status: 500 }
        );
    }

    // Prefer client-confirmed address; merge with reverse geocoding as fallback to keep micro-local detail
    const clientAddress = geoCulturalContext.address ?? null;
    const { areaName: geoAreaName, fullAddress: geoAddress } = await getDetailedAddress(
        geoCulturalContext.lat,
        geoCulturalContext.lng,
        googleApiKey
    );

    const mergedAddress: StructuredAddress | null = (() => {
        if (clientAddress && geoAddress) return { ...geoAddress, ...clientAddress };
        return clientAddress ?? geoAddress ?? null;
    })();

    const areaName =
        mergedAddress?.formattedAddress ||
        mergedAddress?.shortAddress ||
        geoAreaName ||
        'ubicación desconocida';
    const fullAddress = mergedAddress;

    // Fetch nearby places to enrich context (best-effort; continue on failure)
    const nearbyPlaces = await getNearbyPlacesSummary(
        geoCulturalContext.lat,
        geoCulturalContext.lng,
        googleApiKey
    );

    // Log detailed address info
    if (fullAddress) {
        console.log('[GeoCultural] Full address:', {
            street: fullAddress.street,
            number: fullAddress.streetNumber,
            neighborhood: fullAddress.neighborhood,
            city: fullAddress.city,
            postalCode: fullAddress.postalCode,
            quality: fullAddress.quality,
        });
    }

    // Build geocultural context with precise coordinates and structured address
    const geoCulturalPrompt = buildGeoCulturalContext(
        areaName,
        message,
        geoCulturalContext.lat,
        geoCulturalContext.lng,
        fullAddress,
        nearbyPlaces
    );

    // Combine user context (facts, memory, plan) with geocultural context
    const combinedContext = userContext
        ? `${userContext}\n\n${geoCulturalPrompt}`
        : geoCulturalPrompt;

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
        async start(controller) {
            const startData = { type: 'geocultural_analysis', areaName: areaName };
            controller.enqueue(encoder.encode(`event: geocultural.start\ndata: ${JSON.stringify(startData)}\n\n`));

            const aiStream = await streamAssistantReply(message, messages, combinedContext, attachments);
            const reader = aiStream.getReader();

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }

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
                                if (parsed.delta) {
                                    const deltaData = { delta: parsed.delta };
                                    controller.enqueue(encoder.encode(`event: geocultural.delta\ndata: ${JSON.stringify(deltaData)}\n\n`));
                                }
                            } catch (error) {
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
        const { message, messages = [], geoCulturalContext, attachmentIds = [] } = await req.json();

        const hasGeoCoordinates =
            geoCulturalContext !== null &&
            geoCulturalContext !== undefined &&
            typeof geoCulturalContext.lat === 'number' &&
            typeof geoCulturalContext.lng === 'number';

        // Get user and supabase client
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        // Get user context
        let userContext = '';
        try {
            if (!authError && user) {
                const planName = await getUserPlanName(user.id);
                userContext = await getUserContextForPrompt(user.id, planName, message);
            }
        } catch (contextError) {
            console.error('Error getting user context:', contextError);
        }

        // Fetch attachments if provided
        const attachments: AttachmentInput[] = [];

        if (attachmentIds.length > 0 && user) {
            try {
                const dbAttachments = await db
                    .select()
                    .from(conversationAttachments)
                    .where(inArray(conversationAttachments.id, attachmentIds))
                    .limit(10);

                // Generate fresh signed URLs for each attachment
                for (const att of dbAttachments) {
                    const { data: signedUrlData } = await supabase.storage
                        .from('conversation-attachments')
                        .createSignedUrl(att.storagePath, 3600);

                    if (signedUrlData?.signedUrl) {
                        attachments.push({
                            type: att.fileType as 'image' | 'document',
                            url: signedUrlData.signedUrl,
                            mimeType: att.mimeType,
                        });
                    }
                }
            } catch (attachmentError) {
                console.error('Error fetching attachments:', attachmentError);
            }
        }

        // Check if GeoCultural mode is active (only via explicit icon activation)
        const isGeoCulturalMode = hasGeoCoordinates && geoCulturalContext !== null && geoCulturalContext !== undefined;

        if (isGeoCulturalMode && geoCulturalContext) {
            return await handleGeoCulturalMode(message, messages, geoCulturalContext, userContext, attachments);
        }

        // Fallback to default streaming behavior
        const stream = await streamAssistantReply(message, messages, userContext, attachments);

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
