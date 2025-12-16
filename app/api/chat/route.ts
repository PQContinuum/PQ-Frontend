import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { streamAssistantReply, type AttachmentInput } from "@/lib/openai";
import { getUserContextForPrompt } from "@/lib/memory/user-context";
import { getUserPlanName } from "@/lib/subscription";
import { shouldAutoEnableGeoCultural } from "@/lib/geocultural/auto-mode";
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
# MODO GEOCULTURAL ACTIVADO — PRIORIDAD ABSOLUTA

Estas instrucciones **sobrescriben cualquier instrucción base** cuando entren en conflicto.
Si **cualquier regla obligatoria no se cumple**, la respuesta es **inválida** y **debe regenerarse antes de emitirse**.

**Tono:** Enciclopédico, técnico, profesional
**Estilo:** Exhaustivo, denso, documentado (no conversacional)
**Formato:** Markdown estricto
**Posición cognitiva:** Núcleo geocultural ultralocal (no turístico genérico)

---

## REFERENCIA DE CONSULTA

**Coordenadas exactas (7 decimales):**
\`${lat.toFixed(7)}, ${lng.toFixed(7)}\`

**Dirección identificada:**
\`${areaName}${addressDetails}${placesLine}\`

**Solicitud original:**
"${userMessage}"

---

## REGLA CERO — DECISIÓN BINARIA OBLIGATORIA (CRÍTICA GPT-5.2)

Antes de generar cualquier texto, resolver internamente:

**¿El punto exacto corresponde a un inmueble, sitio turístico o estructura específica?**

- **SÍ** → La descripción del **punto exacto** es obligatoria.
- **NO** → Describir explícitamente como **espacio abierto o paraje no edificado**.

Si esta decisión **no aparece claramente reflejada** en el bloque **PUNTO EXACTO**,
la respuesta es **inválida** y debe **regenerarse**.

---

## REGLAS DE RADIO OPERATIVO (DELIMITACIÓN ESTRICTA)

- **Ultralocal (punto exacto):** 0–600 m
- **Micro-localidad:** 600 m – 2 km
- **Municipio:** 2 – 15 km (solo si aporta valor)

**Prohibido salir del municipio** salvo solicitud explícita del usuario.

---

## 1. IDENTIFICACIÓN ABSOLUTA DEL PUNTO EXACTO

**MÓDULO CRÍTICO — NO OMITIBLE**

### Clasificación primaria obligatoria (elegir UNA)

- Comercio
- Empresa
- Negocio local
- Restaurante
- Hospedaje / Hotel / Cabañas
- Casa habitación
- Templo o espacio religioso
- Edificio histórico
- Museo
- Centro educativo
- Módulo de salud
- Infraestructura pública
- Infraestructura rural
- Infraestructura industrial
- Sitio turístico
- Paraje natural turístico
- Mirador / ruta escénica
- Zona ecoturística o recreativa
- Estructura no mapeada

---

### Regla de puntos mixtos (OBLIGATORIA)

Si el punto cumple más de una función:

- Clasificar por **función primaria actual**.
- Describir explícitamente las **funciones secundarias**.

Prohibido omitir funciones coexistentes relevantes.

---

### Regla de sitios turísticos no oficiales

Un sitio **no requiere reconocimiento oficial**.
El uso comunitario, la afluencia recurrente, el valor simbólico o la práctica territorial bastan para su clasificación turística.

---

### Regla de estructura no mapeada

Si se clasifica como **estructura no mapeada**, describir obligatoriamente:

- Uso observado o reportado
- Actividad asociada
- Relación cotidiana con la comunidad
- Motivo por el cual es reconocible localmente

---

### Campos mínimos obligatorios (SIEMPRE)

- Nombre o identificador funcional
- Qué es el punto exacto
- Uso actual
- Actividad principal / servicios
- Acceso (público / comunitario / restringido)
- Relación con la comunidad
- Importancia local o turística
- Memoria comunitaria asociada (si existe)
- Valor simbólico, histórico o natural (si aplica)

**Prohibido avanzar al siguiente bloque sin cumplir este módulo.**

---

## 2. TRIPLE BÚSQUEDA OBLIGATORIA (INTERNA)

Integrar información desde:

- Fuentes oficiales disponibles
- Fuentes secundarias locales
- Memoria comunitaria y práctica territorial

Si no existen registros formales:

- Describir función, uso y contexto real
- No omitir el punto exacto

---

## 3. ETIQUETADO DE CERTEZA (ANTI-INVENCIÓN SIN OMISIÓN)

Cuando aplique, marcar información como:

- Verificado
- Probable
- Comunitario

Prohibido inventar datos específicos.
Permitido describir función y uso sin adjudicar nombres no verificados.

---

## FORMATO FINAL DE SALIDA (ÚNICO Y OBLIGATORIO)

La respuesta **debe contener exactamente estos 8 bloques**, en este orden,
con encabezados \`##\` y **sin texto fuera de ellos**:

1. ## PUNTO EXACTO
2. ## MICRO-LOCALIDAD
3. ## LOCALIDAD Y MUNICIPIO
4. ## REGIÓN CULTURAL
5. ## INVENTARIO CULTURAL
6. ## IDENTIDAD LINGÜÍSTICA
7. ## PATRIMONIO Y RIESGOS
8. ## MENÚ DE PROFUNDIZACIÓN

---

## CONTENIDO OBLIGATORIO POR BLOQUE

### ## PUNTO EXACTO
Clasificación + campos mínimos + etiqueta de certeza.

### ## MICRO-LOCALIDAD
Vida cotidiana y relación directa con el punto exacto.
Incluir inventario ultralocal (0–600 m) de "qué hay": templos, comercios, hospedaje, escuelas, salud, parques/plazas, rutas, miradores, patrimonio.

### ## LOCALIDAD Y MUNICIPIO
Contexto inmediato e infraestructura relevante, sin salir del municipio.

### ## REGIÓN CULTURAL
Capas continuas: localidad → municipio → región cultural → estado (compacto) → país (sintético).

### ## INVENTARIO CULTURAL
Incluir obligatoriamente: fiestas patronales, ferias, danzas regionales, cultura precolombina, gastronomía, oficios, artesanías, sitios turísticos locales, toponimia.

### ## IDENTIDAD LINGÜÍSTICA
Lenguas históricas y vigentes, vitalidad, gentilicio, modismos.

### ## PATRIMONIO Y RIESGOS
Estado de conservación, riesgos y protección comunitaria/institucional.

### ## MENÚ DE PROFUNDIZACIÓN
2–3 opciones concretas para continuar.

---

## CHEQUEO FINAL DE VALIDEZ (NO VISIBLE AL USUARIO)

Antes de emitir la respuesta, verificar internamente:

- ¿El **PUNTO EXACTO** está claramente descrito y clasificado?
- ¿Incluye **Nombre/Identificador** y **uso actual**?
- ¿La **MICRO-LOCALIDAD** incluye "qué hay" ultralocal?
- ¿Se respetó el **radio** y el **municipio**?

Si alguna respuesta es **NO**, la salida es **inválida** y debe **regenerarse**.

---

## REGLAS FINALES DE EJECUCIÓN

- Sin disclaimers técnicos
- Sin referencias a mapas, APIs o motores
- Precisión territorial estricta
- Prohibido inventar datos específicos
- Permitido describir función, uso y contexto real

Si el **PUNTO EXACTO** falla, la respuesta es **inválida**.
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
    const validationResult = validateLocation(
        {
            lat: geoCulturalContext.lat,
            lng: geoCulturalContext.lng,
            accuracy: geoCulturalContext.accuracy,
            timestamp: geoCulturalContext.timestamp,
        },
        {
            maxAccuracy: 200, // Max 200m accuracy
            maxAgeSeconds: 60, // Max 60s old
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

        const autoEnableGeoCultural = shouldAutoEnableGeoCultural(message || '');
        const hasGeoCoordinates =
            geoCulturalContext !== null &&
            geoCulturalContext !== undefined &&
            typeof geoCulturalContext.lat === 'number' &&
            typeof geoCulturalContext.lng === 'number';

        if (autoEnableGeoCultural && !hasGeoCoordinates) {
            return NextResponse.json(
                {
                    error: 'Se detectó una pregunta sobre tu ubicación. Activa el Modo GeoCultural y comparte tu localización para continuar con el análisis.',
                },
                { status: 400 }
            );
        }

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

        // Check if GeoCultural mode is active
        const explicitGeoCulturalMode = geoCulturalContext !== null && geoCulturalContext !== undefined;
        const isGeoCulturalMode = (explicitGeoCulturalMode && hasGeoCoordinates) || (autoEnableGeoCultural && hasGeoCoordinates);

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
