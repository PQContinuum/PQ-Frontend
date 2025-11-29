import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { streamAssistantReply, getAssistantReply } from "@/lib/openai";
import { getUserContextForPrompt } from "@/lib/memory/user-context";
import { getUserPlanName } from "@/lib/subscription";
import { haversineDistance, estimateTravelTime, type Coords } from "@/lib/utils";

type Place = {
    name: string;
    description: string;
    lat: number;
    lng: number;
    detailedDescription?: string;
    historicalContext?: string;
    culturalSignificance?: string;
};

// Define interface for Google Geocoding API AddressComponent

interface AddressComponent {

    long_name: string;

    short_name: string; // Add if needed, but 'long_name' and 'types' are critical here

    types: string[];

}



export async function POST(req: NextRequest) {

    try {

        const { message, messages = [], geoCulturalContext } = await req.json();



        let userContext = '';

        try {

            const supabase = await createSupabaseServerClient();

            const { data: { user }, error: authError } = await supabase.auth.getUser();



            if (!authError && user) {

                const planName = await getUserPlanName(user.id);

                userContext = await getUserContextForPrompt(

                    user.id,

                    planName,

                    message

                );

            }

        } catch (contextError) {

            console.error('Error getting user context:', contextError);

        }



        const isGeoCulturalMode = geoCulturalContext !== null && geoCulturalContext !== undefined;



        if (isGeoCulturalMode) {

            if (!geoCulturalContext.lat || !geoCulturalContext.lng) {

                return NextResponse.json(

                    { error: 'GeoCultural Mode is active but location is unavailable.' },

                    { status: 400 }

                );

            }



            const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

            if (!googleApiKey) {

                return NextResponse.json(

                    { error: 'Google Maps API key is not configured on the server.' },

                    { status: 500 }

                );

            }



                        const userCoords: Coords = { lat: geoCulturalContext.lat, lng: geoCulturalContext.lng };



            



                        // 1. Get Area Name (for AI context)



                        let areaName = 'your current area';



                        try {



                            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${userCoords.lat},${userCoords.lng}&key=${googleApiKey}`;



                            const geocodeResponse = await fetch(geocodeUrl);



                            if(geocodeResponse.ok) {



                                const geocodeData = await geocodeResponse.json();



                                if (geocodeData.results && geocodeData.results[0]) {



                                    const addressComponents = geocodeData.results[0].address_components;



                                    const locality = addressComponents.find((c: AddressComponent) => c.types.includes('locality'))?.long_name;



                                    const sublocality = addressComponents.find((c: AddressComponent) => c.types.includes('sublocality_level_1'))?.long_name;



                                    const neighborhood = addressComponents.find((c: AddressComponent) => c.types.includes('neighborhood'))?.long_name;



                                    areaName = sublocality || neighborhood || locality || areaName;



                                }



                            }



                        } catch(e) {



                            console.error("Reverse geocoding failed:", e);



                        }



            



                                    // 2. Ask AI for CATEGORIES and NUMBER of places based on user intent



            



                                    const geoCulturalInstructions = `



            



                        ROLE: You are an AI assistant that understands user intent for location-based searches.



            



                        USER LOCATION: The user is in the **${areaName}** area.



            



                        USER'S REQUEST: "${message}"



            



                        TASK: Based on the user's request, identify relevant categories and the desired number of places.



            



                        VALID CATEGORIES: art_gallery, museum, park, tourist_attraction, landmark, cafe, library, church, historic_site.



            



                        CRITICAL: Output ONLY raw JSON, no markdown.



            



                        The JSON object must have this EXACT structure:



            



                        {



            



                          "reply": "A short, engaging reply acknowledging the user's request (e.g., '¡Claro! Buscando los 3 mejores museos cerca de ti en ${areaName}...')",



            



                          "categories": ["category1", "category2"],



            



                          "numberOfPlaces": 3 



            



                        }



            



                        RULES:



            



                        - Choose the most relevant categories from the valid list.



            



                        - **numberOfPlaces**: If the user specifies a number (e.g., "un lugar", "5 museos"), use that exact number. Otherwise, you MUST default to 3.



            



                        - **includeDescriptions**: Set to true if the user explicitly asks for descriptions, details, or information about the places (e.g., "descríbeme", "cuéntame sobre", "información de", "qué hay", "detalles de"). Otherwise, set to false.

                        - ALWAYS return a valid JSON object with "reply", "categories", "numberOfPlaces", and "includeDescriptions".



            



                        START YOUR RESPONSE WITH { AND END WITH }`;



            



                        



            



                                    userContext = userContext + geoCulturalInstructions;



            



                                    



            



                                    const aiResponseString = await getAssistantReply(message, [], userContext);



            



                                    



            



                                    let aiIdeas: { reply: string; categories: string[]; numberOfPlaces?: number; includeDescriptions?: boolean };



            



                                    try {



            



                                        aiIdeas = JSON.parse(aiResponseString);



            



                                    } catch (error) {



            



                                        console.error("Failed to parse AI category response:", error);



            



                                        return NextResponse.json({ error: "Failed to understand intent from the assistant." }, { status: 500 });



            



                                    }



            



                        

            



                                    // 3. Use Google "Nearby Search" to find hyper-local places for each category



            



                                    const searchRadius = 2500; // 2.5km radius



            



                                                                        const limit = aiIdeas.numberOfPlaces || 3; // Default to 3 places



            



                                    



            



                                                                        // 3. Use Google "Nearby Search" to find hyper-local places for each category



            



                                                                        const placesPromises = (aiIdeas.categories || ["tourist_attraction"]).map(async (category) => {



            



                                                                            const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${userCoords.lat},${userCoords.lng}&radius=${searchRadius}&type=${category}&fields=name,place_id,geometry,rating,types,editorial_summary&key=${googleApiKey}`;



            



                                                                            const searchResponse = await fetch(searchUrl);



            



                                                                            const searchData = await searchResponse.json();



            



                                                                            return searchData.results || [];



            



                                                                        });



            



                                    



            



                                                                        const resultsByCategory = await Promise.all(placesPromises);



            



                                                                        const allPlaces = resultsByCategory.flat();



            



                                    



            



                                                                        // Deduplicate places by place_id and select top results based on rating



            



                                                                        const uniquePlaces = Array.from(new Map(allPlaces.map(p => [p.place_id, p])).values());



            



                                                                        uniquePlaces.sort((a, b) => (b.rating || 0) - (a.rating || 0));



            



                                                                        const topPlaces = uniquePlaces.slice(0, limit);



            



                                                                        



            



                                                                        if (topPlaces.length === 0) {



            



                                                                             return NextResponse.json({



            



                                                                                reply: `No encontré lugares de interés en las categorías [${(aiIdeas.categories || []).join(', ')}] en un radio de 2.5km a tu alrededor en ${areaName}. ¡Intenta con otra búsqueda!`,



            



                                                                                places: [],



            



                                                                                userCoords: userCoords,



            



                                                                                userAreaName: areaName,



            



                                                                            });



            



                                                                        }



            



                                    



            



                                                                        // 4. Format places, create photo URLs, and calculate final distances



            



                                                                                                                                                const placesWithCalculations: Place[] = topPlaces.map(place => {



            



                                                                                                                                                    const placeCoords = { lat: place.geometry.location.lat, lng: place.geometry.location.lng };



            



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




                                                            // 5. Generate historical and cultural context
                                                            let areaHistoricalContext = '';
                                                            const placesWithContext = await Promise.all(
                                                                placesWithCalculations.map(async (place) => {
                                                                    try {
                                                                        const contextPrompt = `Genera un contexto histórico y cultural breve sobre "${place.name}" en ${areaName}.

                                                                        IMPORTANTE: Responde SOLO con un JSON válido sin markdown, con esta estructura exacta:
                                                                        {
                                                                          "historicalContext": "2-3 oraciones sobre la historia del lugar",
                                                                          "culturalSignificance": "2-3 oraciones sobre su importancia cultural"
                                                                        }

                                                                        Si no conoces el lugar específico, proporciona contexto general sobre ese tipo de lugar en ${areaName}.`;

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

                                                            // Generate area historical context
                                                            try {
                                                                const areaContextPrompt = `Genera un contexto histórico y cultural breve sobre ${areaName}.

                                                                Incluye:
                                                                - Historia relevante del área
                                                                - Importancia cultural
                                                                - Características únicas

                                                                Límite: 4-5 oraciones. Sé informativo pero conciso.`;

                                                                areaHistoricalContext = await getAssistantReply(areaContextPrompt, [], '');
                                                            } catch (error) {
                                                                console.error('Failed to get area context:', error);
                                                            }

                                                            const finalResponse = {



            



                                                                reply: aiIdeas.reply,



            



                                                                places: placesWithContext,



            



                                                                userCoords: userCoords,



            



                                                                userAreaName: areaName,




                                                                areaHistoricalContext: areaHistoricalContext,




                                                            };



            



                                    



            



                                                            return NextResponse.json(finalResponse);



            



                                                        }

        // Fallback to default streaming behavior if not in GeoCultural mode
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
