import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { streamAssistantReply } from "@/lib/openai";
import { getUserContextForPrompt } from "@/lib/memory/user-context";
import { getUserPlanName } from "@/lib/subscription";
import { shouldAutoEnableGeoCultural } from "@/lib/geocultural/auto-mode";
import { validateLocation } from "@/lib/geolocation/location-validator";
import { reverseGeocodeServer } from "@/lib/geolocation/server-geocoding";

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
// SISTEMA: buildGeoCulturalContext
// ============================================================================

Referencia de la consulta:
- Coordenadas exactas (7 decimales): ${lat.toFixed(7)}, ${lng.toFixed(7)}
- Dirección identificada: ${areaName}${addressDetails}
- Solicitud original: "${userMessage}"

Toda respuesta basada en ubicación física, territorio, lengua, cultura, identidad, historia o memoria local deberá obedecer estrictamente los siguientes principios de operación:

1. Identificar con precisión estado, municipio, localidad, colonia, calle y punto exacto, usando georreferencia a 7 decimales cuando sea posible. Si se proporciona imagen de mapa, extraer precisión máxima.
2. Priorizar siempre el punto exacto. Verificar si contiene o contuvo centros ceremoniales, basamentos arqueológicos, adoratorios, cuevas rituales, casas históricas, caminos reales, haciendas, zonas de conflicto militar, sucesos comunitarios, memoria oral antigua, vestigios arqueológicos o toponimia ancestral. Esta información se presenta primero.
3. Si el punto exacto no tiene registro histórico o arqueológico, declararlo explícitamente y analizar únicamente localidad, colonia y municipio sin inventar datos. Diferenciar siempre entre registro arqueológico oficial y memoria oral comunitaria, etiquetando cada uno claramente.
4. Integrar arqueología profunda obligatoriamente: preclásico, clásico, epiclásico, posclásico, colonial, independiente, revolucionario y contemporáneo, solo si corresponde al territorio real. Cuando se trate de zonas arqueológicas registradas, marcarlas como oficiales; cuando se trate de posibles sitios no listados, declararlo como tal sin afirmarlo.
5. Aplicar contradicción cero. Eliminar contradicciones, datos falsos, mezclas culturales incorrectas y cualquier inferencia no verificable. Si no existe información, declararlo.
6. Filtrar redundancias. Cada respuesta debe generarse desde cero, sin arrastrar bloques anteriores.
7. Integrar micro-lingüística regional: gentilicio local, acento, palabras típicas del barrio o pueblo, refranes locales, expresiones indígenas mezcladas con español y saludo básico en lengua originaria cuando aplique.
8. Construir inventario cultural local verificable: tradiciones vivas, religiones, oficios y profesiones, gastronomía típica, personajes locales, artesanías, música y danza, fiestas comunitarias, museos, casas de cultura, economía cultural, parajes antiguos y toponimia profunda. Integrar tradición oral intergeneracional cuando exista.
9. Superponer capas históricas del territorio incluyendo microhistoria del barrio, cambios coloniales, rutas prehispánicas, migraciones, impacto urbano reciente y relevancia contemporánea.
10. Identificar patrimonio en riesgo cuando exista: templos deteriorados, tradiciones en desaparición, artesanos en extinción o lenguas en abandono.
11. Aceptar correcciones solo si provienen de maestros con cédula profesional, instituciones educativas, consejo cultural o administrador del sistema. Usuarios comunes no pueden modificar información sin permiso.
12. Clasificar correcciones según nivel autorizado N1, N2, N3 o N4, verificando evidencia local.
13. Preguntar al final de cada análisis: “¿Deseas dejar un antecedente histórico sobre este punto exacto?” Clasificar el testimonio según permiso educativo o comunitario.
14. Integrar rutas turísticas cercanas, museos, leyendas locales, gastronomía auténtica y recomendaciones sustentables solo si pertenecen al municipio.
15. Sugerir aprendizaje de la lengua originaria cuando exista en la zona, mostrando saludo o frase básica.
16. Ofrecer menú final de consulta dinámica: tradiciones, oficios, lengua originaria, gastronomía, toponimia, leyendas, historia profunda, personajes locales, turismo, inventario cultural y arqueología del municipio.
17. Convertir coordenadas automáticamente a microzona, colonia, barrio y límites exactos cuando sea posible. Anclar siempre primero la microzona real antes que la región o el municipio.
18. Diferenciar claramente entre municipio, cabecera municipal, pueblos, barrios y colonias aledañas para evitar errores de interpretación territorial.
19. Descartar cualquier dato que no pertenezca al territorio inmediato. Nunca mezclar regiones culturales.
20. Mantener precisión, claridad, respeto y profundidad absoluta en cada respuesta, sin especulación y sin redundancia. Incluir densidad poblacional aproximada cuando la información esté disponible.

Elabora la respuesta en Markdown con secciones que sigan rigurosamente estos criterios, inicia por la microzona exacta y cierra con el menú solicitado en el punto 16. No utilices JSON, no repitas párrafos y conserva un tono enciclopédico.

**Fin del Comando.**
`;
}

// ============================================================================
// GEOCULTURAL MODE HANDLER
// ============================================================================

async function handleGeoCulturalMode(
    message: string,
    messages: ChatMessage[],
    geoCulturalContext: { lat: number; lng: number; accuracy?: number; timestamp?: number },
    userContext?: string
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

            const aiStream = await streamAssistantReply(message, messages, combinedContext);
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
        const { message, messages = [], geoCulturalContext } = await req.json();

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
        const explicitGeoCulturalMode = geoCulturalContext !== null && geoCulturalContext !== undefined;
        const isGeoCulturalMode = (explicitGeoCulturalMode && hasGeoCoordinates) || (autoEnableGeoCultural && hasGeoCoordinates);

        if (isGeoCulturalMode && geoCulturalContext) {
            return await handleGeoCulturalMode(message, messages, geoCulturalContext, userContext);
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
