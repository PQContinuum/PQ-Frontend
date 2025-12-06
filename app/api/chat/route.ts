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
import { eq, inArray } from "drizzle-orm";

import type { ChatMessage } from "@/app/chat/store";
import type { StructuredAddress } from "@/lib/geolocation/address-types";

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
 * Build geocultural context prompt with precise coordinates and structured address
 * Nueva estructura: geocultural.ultralocal.maestro con formato de 12 bloques
 */
function buildGeoCulturalContext(
    areaName: string,
    userMessage: string,
    lat: number,
    lng: number,
    fullAddress: StructuredAddress | null
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
- Dirección identificada: ${areaName}${addressDetails}
- Solicitud original: "${userMessage}"

ESTRUCTURA OBLIGATORIA DE RESPUESTA - MODO GEOCULTURAL ULTRALOCAL MAESTRO:

## **IDENTIFICACIÓN ABSOLUTA DEL PUNTO EXACTO (MÓDULO CRÍTICO)**

OBLIGATORIO: Antes de analizar colonia o municipio, IDENTIFICAR el tipo de inmueble/punto exacto:

Punto exacto:
   ◦ comercio (tiendas, restaurantes, talleres, hoteles, fábricas)
   ◦ empresa (corporativos, oficinas, industrias)
   ◦ negocio_local (fondas, puestos, servicios personales)
   ◦ restaurante (menús, especialidades, categorías)
   ◦ hospedaje (hoteles, posadas, cabañas, hostales)
   ◦ casa_familia (vivienda habitual, familias reconocidas públicamente)
   ◦ templo (iglesias, capillas, centros de oración)
   ◦ edificio_historico (cascos antiguos, ruinas, arquitectura relevante)
   ◦ museo (si aplica)
   ◦ centro_educativo (si el punto cae dentro de una escuela)
   ◦ modulo_salud (consultorio, clínica)
   ◦ zona_turistica (cascada, mirador, parque)
   ◦ infraestructura_rural (corrales, parcelas, bodegas)
   ◦ infraestructura_industrial (talleres, naves, almacenes)
   ◦ estructura_no_mapeada (lo que no aparece en mapas oficiales pero existe)

Descripción del punto exacto:
   ◦ nombre_si_existe
   ◦ giro
   ◦ productos_servicios
   ◦ historia_secundaria
   ◦ memoria_comunitaria_relacionada
   ◦ funcion_actual
   ◦ importancia_local

## **TRIPLE BÚSQUEDA OBLIGATORIA**

Triple búsqueda:
   ◦ oficiales.max_precision (fuentes verificables, institucionales)
   ◦ secundarias.expandidas (registros académicos, libros, estudios)
   ◦ comunitarias.intensivas (memoria oral, tradición local, testimonios)

## **ESCANEO COLONIA/LOCALIDAD/MUNICIPIO**

Escaneo colonia/localidad/municipio:

   RELIGIÓN Y ESPIRITUALIDAD:
   ◦ religion.templos_capillas_fiestas
   ◦ religion.devociones_regionales

   EDUCACIÓN Y CULTURA:
   ◦ escuelas.todos_los_niveles
   ◦ centros_culturales
   ◦ talleres_academias
   ◦ bibliotecas

   TURISMO Y PATRIMONIO:
   ◦ turistica.parques_senderos
   ◦ turistica.cascadas_rios
   ◦ turistica.balnearios_parajes
   ◦ turistica.museos_plazas
   ◦ turistica.hoteles_comercios_clave
   ◦ turistica.restaurantes_emblematicos

   INFRAESTRUCTURA MUNICIPAL:
   ◦ municipal.delegaciones
   ◦ municipal.plazas_explanadas
   ◦ municipal.unidades_comunitarias

   SALUD Y DEPORTE:
   ◦ salud.clinicas_hospitales
   ◦ deporte.unidades_deportivas

   CIENCIA Y PATRIMONIO:
   ◦ ciencia.estaciones_y_laboratorios
   ◦ patrimonio.conventos_casas_antiguas

   ECONOMÍA LOCAL:
   ◦ economia.tianguis_comercios
   ◦ economia.artesanias_industrias_locales

   CULTURA PRECOLOMBINA Y DANZAS (BLOQUE PERMANENTE):
   ◦ cultura_precolombina.pueblos_originarios
   ◦ cultura_precolombina.rutas_antiguas
   ◦ cultura_precolombina.toponimia_simbolismos
   ◦ danzas_regionales.tradicionales
   ◦ danzas_regionales.fiestas_patronales
   ◦ ferias_locales.gastronomicas_culturales

## **MODO NO OMISIÓN TOTAL**

Modo no omisión total:
   ◦ incluir_todo_lo_detectado
   ◦ aunque_no_aparezca_en_mapas
   ◦ incluir información de todas las fuentes:
      - Fuentes gubernamentales o institucionales
      - Registros académicos, libros, investigaciones
      - Tradición oral, testimonios locales

## **GENERAR SALIDA EN FORMATO DE 12 BLOQUES**

   TERRITORIO Y UBICACIÓN
   ◦ Estado, municipio, localidad, colonia, calle
   ◦ Coordenadas exactas (7 decimales)
   ◦ Dirección identificada completa

   PUNTO EXACTO
   ◦ Tipo de inmueble/estructura identificada
   ◦ Nombre, giro, función actual
   ◦ Historia del punto específico
   ◦ Memoria comunitaria relacionada
   ◦ Importancia local actual

   PUNTOS DE INTERÉS A-I
   (Categorías principales ordenadas alfabéticamente)
   A. Arqueología y vestigios
   B. Comercio y economía
   C. Cultura y tradiciones
   D. Deporte y recreación
   E. Educación
   F. Espiritualidad y religión
   G. Gastronomía
   H. Hospedaje y servicios
   I. Infraestructura y servicios públicos

   HISTORIA DOCUMENTADA
   ◦ Periodo precolombino (si aplica)
   ◦ Colonial
   ◦ Independencia
   ◦ Revolucionario
   ◦ Contemporáneo

   CULTURA Y TRADICIONES
   ◦ Cultura precolombina (pueblos originarios, rutas antiguas, toponimia)
   ◦ Danzas regionales (tradicionales, fiestas patronales)
   ◦ Fiestas patronales y celebraciones
   ◦ Ferias locales (gastronómicas, culturales)
   ◦ Artesanías y oficios tradicionales
   ◦ Música y expresiones artísticas

   LENGUA ORIGINARIA Y GENTILICIO
   ◦ Lengua(s) originaria(s) de la región
   ◦ Saludo básico en lengua local (si aplica)
   ◦ Gentilicio oficial
   ◦ Expresiones y palabras locales
   ◦ Refranes y dichos típicos

   GASTRONOMÍA TÍPICA
   ◦ Platillos emblemáticos de la zona
   ◦ Ingredientes locales característicos
   ◦ Bebidas tradicionales
   ◦ Mercados y tianguis gastronómicos
   ◦ Restaurantes y fondas emblemáticas

   ARQUEOLOGÍA Y PATRIMONIO
   ◦ Zonas arqueológicas oficiales cercanas
   ◦ Vestigios no oficiales (si existen, marcar como tales)
   ◦ Edificios históricos y monumentos
   ◦ Patrimonio en riesgo (si aplica)
   ◦ Museos y centros interpretativos

   SITUACIÓN ACTUAL
   ◦ Densidad poblacional aproximada
   ◦ Actividad económica principal
   ◦ Proyectos de desarrollo en curso
   ◦ Retos y oportunidades locales
   ◦ Conectividad y accesibilidad

   MEMORIA LOCAL
   ◦ Personajes destacados de la comunidad
   ◦ Leyendas y relatos locales
   ◦ Tradición oral intergeneracional
   ◦ Sucesos históricos comunitarios
   ◦ Toponimia profunda (origen de nombres)

   PREGUNTAS EXPLORATORIAS (PARTE 1)
   Ofrecer al usuario 3-4 preguntas para profundizar:
   - ¿Te gustaría conocer más sobre la historia arqueológica de esta zona?
   - ¿Quieres saber sobre las tradiciones y fiestas locales?
   - ¿Te interesa explorar la gastronomía típica del lugar?
   - ¿Deseas información sobre rutas turísticas cercanas?

   PREGUNTAS EXPLORATORIAS (PARTE 2)
   Preguntas adicionales:
   - ¿Quieres aprender el saludo básico en la lengua originaria?
   - ¿Te gustaría conocer los oficios y artesanías locales?
   - ¿Deseas información sobre el patrimonio en riesgo?
   - ¿Quieres dejar un antecedente histórico sobre este punto exacto?

## **REGLAS DE EJECUCIÓN ESTRICTAS**

1. CONTRADICCIÓN CERO: Eliminar datos contradictorios o sin verificar
2. NO INVENTAR: Si no existe información, declararlo explícitamente
3. VERACIDAD: Incluir información de fuentes gubernamentales, académicas y comunitarias
4. PRECISIÓN TERRITORIAL: No mezclar datos de municipios o regiones diferentes
5. RESPETO CULTURAL: Mantener exactitud en nombres, fechas y datos sensibles
6. FORMATO MARKDOWN: Usar encabezados, listas y formato claro
7. TONO ENCICLOPÉDICO: Profesional, informativo, sin especulación
8. MICROZONA PRIMERO: Iniciar siempre por el punto exacto, luego expandir
9. SIN REDUNDANCIA: Cada respuesta generada desde cero, sin arrastrar bloques
10. EXHAUSTIVIDAD: Incluir TODO lo detectado aunque no aparezca en mapas oficiales

**IMPORTANTE**: La respuesta DEBE seguir esta estructura de 12 bloques en formato Markdown.
Comenzar SIEMPRE por la identificación del punto exacto, luego proceder con los 12 bloques.

**Fin del Comando GeoCultural Ultralocal Maestro.**
`;
}

// ============================================================================
// GEOCULTURAL MODE HANDLER
// ============================================================================

async function handleGeoCulturalMode(
    message: string,
    messages: ChatMessage[],
    geoCulturalContext: { lat: number; lng: number; accuracy?: number; timestamp?: number },
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

    // Get detailed address from coordinates
    const { areaName, fullAddress } = await getDetailedAddress(
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
        fullAddress
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
        let attachments: AttachmentInput[] = [];

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
