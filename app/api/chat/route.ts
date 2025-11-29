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

            // Reverse Geocode user's coordinates to get an area name
            let areaName = 'your current area'; // Default fallback name
            try {
                const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${userCoords.lat},${userCoords.lng}&key=${googleApiKey}`;
                const geocodeResponse = await fetch(geocodeUrl);
                const geocodeData = await geocodeResponse.json();
                if (geocodeData.results && geocodeData.results[0]) {
                    // Find a suitable name from the address components
                    const addressComponents = geocodeData.results[0].address_components;
                    const locality = addressComponents.find(c => c.types.includes('locality'))?.long_name;
                    const sublocality = addressComponents.find(c => c.types.includes('sublocality_level_1'))?.long_name;
                    const neighborhood = addressComponents.find(c => c.types.includes('neighborhood'))?.long_name;
                    areaName = sublocality || neighborhood || locality || areaName;
                }
            } catch(e) {
                console.error("Reverse geocoding failed:", e);
                // Non-critical error, proceed with the default area name
            }

            const geoCulturalInstructions = `
ROLE: You are a creative travel writer and an expert cultural concierge. Your task is to find culturally significant places near a user and respond in a warm, inspiring tone.
USER LOCATION: The user is in the **${areaName}** area. (Lat: ${userCoords.lat}, Lng: ${userCoords.lng})
CRITICAL: Output ONLY raw JSON, no markdown.
The JSON object must have this EXACT structure:
{
  "reply": "A warm, inspiring, and creative 2-3 sentence message for the user, starting with a mention of their specific area (${areaName}).",
  "places": [
    {
      "name": "Exact official name of the place",
      "description": "What makes this place special culturally (1-2 sentences)",
      "lat": PRECISE_LATITUDE_NUMBER,
      "lng": PRECISE_LONGITUDE_NUMBER
    }
  ]
}
REQUIREMENTS:
- Find 2-3 REAL, culturally significant places within a close radius (~5-7km) of the user.
- Prioritize interesting spots that are walkable or a very short drive away.
- Provide ACCURATE GPS coordinates.
- DO NOT include distance, time, or map URLs. The system calculates these.
START YOUR RESPONSE WITH { AND END WITH }`;

            userContext = userContext + geoCulturalInstructions;
            
            const aiResponseString = await getAssistantReply(message, messages, userContext);

            let aiData: GeoCulturalResponseFromAI;
            try {
                aiData = JSON.parse(aiResponseString);
            } catch (error) {
                console.error("Failed to parse AI JSON response:", error);
                return NextResponse.json({ error: "Failed to understand the assistant's response." }, { status: 500 });
            }

            const placesWithCalculations = aiData.places.map(place => {
                const distance = haversineDistance(userCoords, place);
                const travel_time = estimateTravelTime(distance);
                return {
                    ...place,
                    distance: `${distance.toFixed(1)} km`,
                    travel_time,
                };
            });

            const finalResponse = {
                reply: aiData.reply,
                places: placesWithCalculations,
                userCoords: userCoords, // Pass user coordinates to the frontend
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
