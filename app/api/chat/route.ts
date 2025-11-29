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
};

type GeoCulturalResponseFromAI = {
    reply: string;
    places: Place[];
};

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

                                    const locality = addressComponents.find(c => c.types.includes('locality'))?.long_name;

                                    const sublocality = addressComponents.find(c => c.types.includes('sublocality_level_1'))?.long_name;

                                    const neighborhood = addressComponents.find(c => c.types.includes('neighborhood'))?.long_name;

                                    areaName = sublocality || neighborhood || locality || areaName;

                                }

                            }

                        } catch(e) {

                            console.error("Reverse geocoding failed:", e);

                        }

            

                        // 2. Ask AI for CATEGORIES based on user intent

                        const geoCulturalInstructions = `

            ROLE: You are an AI assistant that understands user intent and categorizes it for a location-based search.

            USER LOCATION: The user is in the **${areaName}** area.

            USER'S REQUEST: "${message}"

            TASK: Based on the user's request, identify up to 2 relevant categories from the following list to perform a search.

            VALID CATEGORIES: art_gallery, museum, park, tourist_attraction, landmark, cafe, library, church, historic_site.

            CRITICAL: Output ONLY raw JSON, no markdown.

            The JSON object must have this EXACT structure:

            {

              "reply": "A short, engaging reply acknowledging the user's request and what you're looking for (e.g., '¡Entendido! Buscando museos y parques fascinantes cerca de ti en ${areaName}...')",

              "categories": ["category1", "category2"]

            }

            RULES:

            - Choose the most relevant categories. If the user asks for "lugares para caminar", choose ["park", "tourist_attraction"]. For "arte", choose ["museum", "art_gallery"].

            - If the user's request is generic (e.g., "qué hay cerca?"), a good default is ["tourist_attraction", "historic_site"].

            - ALWAYS return a valid JSON object with the "reply" and "categories" keys.

            START YOUR RESPONSE WITH { AND END WITH }`;

            

                        userContext = userContext + geoCulturalInstructions;

                        

                        const aiResponseString = await getAssistantReply(message, [], userContext); // Use empty history for this specialized prompt

                        

                        let aiIdeas: { reply: string; categories: string[] };

                        try {

                            aiIdeas = JSON.parse(aiResponseString);

                        } catch (error) {

                            console.error("Failed to parse AI category response:", error);

                            return NextResponse.json({ error: "Failed to understand intent from the assistant." }, { status: 500 });

                        }

            

                        // 3. Use Google "Nearby Search" to find hyper-local places for each category

                        const searchRadius = 2500; // 2.5km radius for a balance of options and proximity

                        const placesPromises = aiIdeas.categories.map(async (category) => {

                            const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${userCoords.lat},${userCoords.lng}&radius=${searchRadius}&type=${category}&key=${googleApiKey}`;

                            const searchResponse = await fetch(searchUrl);

                            const searchData = await searchResponse.json();

                            return searchData.results || [];

                        });

            

                        const resultsByCategory = await Promise.all(placesPromises);

                        const allPlaces = resultsByCategory.flat();

            

                        // Deduplicate places by place_id and select top 3-4 based on rating

                        const uniquePlaces = Array.from(new Map(allPlaces.map(p => [p.place_id, p])).values());

                        uniquePlaces.sort((a, b) => (b.rating || 0) - (a.rating || 0));

                        const topPlaces = uniquePlaces.slice(0, 3);

                        

                        if (topPlaces.length === 0) {

                             return NextResponse.json({

                                reply: `No encontré lugares de interés en las categorías [${aiIdeas.categories.join(', ')}] en un radio de ${searchRadius/1000}km a tu alrededor en ${areaName}. ¡Intenta con otra búsqueda!`,

                                places: [],

                                userCoords: userCoords,

                            });

                        }

            

                        // 4. Format places and calculate final distances

                        const placesWithCalculations = topPlaces.map(place => {

                            const placeCoords = { lat: place.geometry.location.lat, lng: place.geometry.location.lng };

                            const distance = haversineDistance(userCoords, placeCoords);

                            const travel_time = estimateTravelTime(distance);

                            return {

                                name: place.name,

                                description: `Rating: ${place.rating || 'N/A'} ★ • ${place.types?.[0]?.replace(/_/g, ' ') || 'Place'}`,

                                lat: placeCoords.lat,

                                lng: placeCoords.lng,

                                distance: `${distance.toFixed(1)} km`,

                                travel_time,

                            };

                        });

            

                        const finalResponse = {

                            reply: aiIdeas.reply,

                            places: placesWithCalculations,

                            userCoords: userCoords,

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
