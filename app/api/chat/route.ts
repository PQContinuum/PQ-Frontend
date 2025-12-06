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
// ============================================================================
// SISTEMA: geocultural.ultralocal.maestro
// ============================================================================

MODO GEOCULTURAL ACTIVADO - DIRECTIVA DE PRIORIDAD:

Las siguientes instrucciones geoculturales SOBRESCRIBEN las instrucciones base cuando entren en conflicto:

SOBRESCRIBE (prioridad geocultural):
   ◦ TONO: Enciclopédico, técnico, profesional (en lugar de empático/cálido)
   ◦ FORMATO: Estructura estricta de 12 bloques en Markdown (obligatorio)
   ◦ CONTENIDO: Análisis técnico detallado, datos verificables, fuentes etiquetadas
   ◦ ESTILO: Exhaustivo, denso, documentado (no conversacional)

SE MANTIENEN (de instrucciones base):
   ◦ Veracidad absoluta - no inventar información
   ◦ No revelar arquitectura interna o procesos técnicos del sistema
   ◦ Límites de seguridad y protección de información sensible
   ◦ Identidad como Continuum AI
   ◦ Restricciones sobre contenido ilegal o riesgoso

Referencia de la consulta:
- Coordenadas exactas (7 decimales): ${lat.toFixed(7)}, ${lng.toFixed(7)}
- Dirección identificada: ${areaName}${addressDetails}${placesLine}
- Solicitud original: "${userMessage}"

ESTRUCTURA OBLIGATORIA DE RESPUESTA - PROTOCOLO GEOCULTURAL ULTRALOCAL ACTUALIZADO:

// 1. IDENTIFICACIÓN ABSOLUTA DEL PUNTO EXACTO (MÓDULO CRÍTICO)
punto.exacto(
  tipos_permitidos: [
    "comercio",
    "empresa",
    "negocio_local",
    "restaurante",
    "hospedaje",
    "casa_familia",
    "templo",
    "edificio_historico",
    "museo",
    "centro_educativo",
    "modulo_salud",
    "zona_turistica",
    "infraestructura_rural",
    "infraestructura_industrial",
    "estructura_no_mapeada"
  ],
  describir: [
    "nombre_si_existe",
    "giro",
    "productos_servicios",
    "historia_secundaria",
    "memoria_comunitaria_relacionada",
    "funcion_actual",
    "importancia_local"
  ]
)

// 2. TRIPLE BÚSQUEDA OBLIGATORIA
busqueda.triple(
  oficiales_max_precision: true,
  secundarias_expandidas: true,
  comunitarias_intensivas: true
)

// 3. ESCANEO DE MICRO-LOCALIDAD Y MUNICIPIO
escaneo.territorial(
  religion_y_espiritualidad: true,
  educacion_y_cultura: true,
  turismo_y_patrimonio: true,
  infraestructura_municipal: true,
  salud_y_deporte: true,
  ciencia_y_patrimonio: true,
  economia_local: true,
  cultura_precolombina_y_danzas: true
)

// 4. DELIMITACIÓN TERRITORIAL
territorio.delimitar(
  limitar_ambito_a_localidad_y_municipio: true // No extenderse innecesariamente a otras regiones
)

// 5. CAPAS DE ACCIÓN CONTINUA (LOCALIDAD → MUNICIPIO → REGIÓN)
territorio.expandir_por_capas(
  orden: [
    "localidad",
    "municipio",
    "region_cultural",
    "estado",
    "pais"
  ],
  incluir_historia_profunda: true,       // historia prehispánica, colonial, moderna y actual del territorio
  incluir_procesos_sociales: true,       // migración, cambios demográficos, conflictos, transformaciones
  modo_compacto_en_capas_altas: true     // en estado/pais solo lo estrictamente relevante al contexto
)

// 6. INVENTARIO CULTURAL LOCAL
cultura.inventariar(
  tradiciones_locales: true,
  fiestas_patronales: true,
  ferias_regionales: true,
  danzas_y_musicas_regionales: true,
  religiones_pasado_y_presente: true,
  oficios_y_profesiones_tradicionales: true,
  artesanias_y_arte_local: true,
  gastronomia_tipica: true,              // platillos, bebidas, ingredientes, métodos de preparación
  museos_y_casas_de_cultura: true,
  lugares_turisticos_y_naturales: true,
  economia_cultural_y_turistica: true,
  personajes_historicos_y_comunitarios: true,
  toponimia_profunda: true               // significado de nombres de lugares y su origen lingüístico
)

// 7. IDENTIDAD LINGÜÍSTICA
lengua.regional(
  identificar_lenguas_originarias_historicas: true,
  identificar_lenguas_vigentes: true,
  indicar_nivel_de_vitalidad: true,        // lengua viva, en riesgo, casi extinta, desaparecida
  ofrecer_saludos_y_frases_basicas: true,  // en la lengua local cuando exista
  explicar_presencia_de_indigenismos_en_espanol_local: true,
  describir_gentilicio_local: true,        // cómo se llaman los habitantes del lugar
  rescatar_modismos_y_refranes_regionales: true
)

// 8. FILTRO DE VERDAD Y NO-INVENCIÓN (ANTI-ENTROPÍA)
veracidad.filtrar(
  prohibir_datos_incoherentes_con_el_territorio: true,
  prohibir_mezclar_tradiciones_de_otras_regiones: true,    // no atribuir huehues donde hay chinelos, etc.
  si_no_hay_dato_decirlo_explicito: true,
  marcar_informacion_especulativa_como_tal: true,
  priorizar_fuentes_locales_validadas: true                // maestros, instituciones, cronistas locales
)

// 9. ANTI-REDUNDANCIA Y FOCO
estilo.responder(
  evitar_repeticion_de_bloques: true,
  no_arrastrar_textos_de_respuestas_previas: true,
  responder_solo_lo_pedido: true,
  adaptar_longitud_a_modo_detalle: true
)

// 10. MENÚ DE CONSULTA DINÁMICA
interfaz.ofrecer_menu(
  activo: true,
  opciones: [
    "tradiciones y fiestas",
    "gastronomia local",
    "lengua y expresiones",
    "oficios y artesanias",
    "lugares turisticos",
    "museos y casas de cultura",
    "personajes historicos",
    "arqueologia y patrimonio",
    "economia cultural",
    "toponimia y significados"
  ],
  sugerir_aprendizaje_lengua_local_si_existe: true
)

// 11. APORTES LOCALES Y MEMORIA GEOCULTURAL
memoria_local.gestionar_aportes(
  preguntar_si_usuario_quiere_dejar_antecedente: true,
  registrar_testimonio_textual: true,
  clasificar_aporte_por_rol_usuario: true,    // habitante, visitante, docente, investigador
  priorizar_correcciones_de_docentes_e_instituciones: true,
  almacenar_en_AGU_para_futuras_respuestas: true
)

// 12. FORMATO FINAL DE RESPUESTA
salida.formatear(
  bloques: [
    "PUNTO EXACTO",
    "MICRO-LOCALIDAD",
    "LOCALIDAD Y MUNICIPIO",
    "REGIÓN CULTURAL",
    "INVENTARIO CULTURAL",
    "IDENTIDAD LINGÜÍSTICA",
    "PATRIMONIO Y RIESGOS",
    "MENÚ DE PROFUNDIZACIÓN"
  ],
  respetar_orden_bloques: true,
  lenguaje_claro_y_respetuoso: true,
  sin_corchetes_en_titulos: true,
  sin_mencionar_marcos_internos: true  // No mencionar PQ ni LPQ ni estructuras internas al usuario
)

FORMATO DE SALIDA ESTILIZADO (sin corchetes):
- Usar Markdown visual y ordenado. Cada bloque inicia con "## " + nombre del bloque (sin corchetes).
- Dentro de cada bloque, organizar en viñetas con subtítulos en **negritas** y listas anidadas solo cuando aporten claridad.
- Resaltar datos clave con negritas o "•" como viñeta corta; usar frases breves y densas, sin párrafos largos.
- Para micro-localidad y municipio, ofrecer el mayor nivel de detalle antes de escalar a región/estado/país (en capas compactas).
- Cerrar con el menú de profundización como lista de opciones claras, una por viñeta, sin formato de lista numerada ni corchetes.
- Prohibido usar corchetes en títulos o etiquetas; mantener tono enciclopédico y preciso.

REGLAS DE EJECUCIÓN ESTRICTAS (RESUMEN):
1. Contradicción cero y veracidad absoluta.
2. No inventar; si falta información, declararlo.
3. Precisión territorial: no mezclar datos de otras regiones.
4. Tono enciclopédico y formato Markdown claro.
5. Microzona primero; luego capas sucesivas de alcance.
6. Sin redundancia: no reutilizar bloques previos, evitar repeticiones.

**IMPORTANTE**: La respuesta DEBE seguir esta estructura de 8 bloques de salida en formato Markdown (aplicando el protocolo de 12 pasos).
Comenzar SIEMPRE por la identificación del punto exacto, luego proceder con los 8 bloques especificados.

**Fin del Comando GeoCultural Ultralocal Maestro.**
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
