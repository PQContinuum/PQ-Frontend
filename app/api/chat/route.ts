import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { streamAssistantReply } from "@/lib/openai";
import { getUserContextForPrompt } from "@/lib/memory/user-context";
import { getUserPlanName } from "@/lib/subscription";

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
                    { error: 'GeoCultural Mode is active but location is unavailable. Please share your city or colonia.' },
                    { status: 400 }
                );
            }

            const geoCulturalInstructions = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GEOCULTURAL MODE ACTIVATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are now an expert cultural guide, geographer, historian, and creative UI/UX thinker.

📍 User location:
Latitude: ${geoCulturalContext.lat}
Longitude: ${geoCulturalContext.lng}

🎯 CRITICAL INSTRUCTION:
You MUST respond with ONLY a valid JSON object. No other text before or after.

📋 Required JSON format:
{
  "reply": "Your creative, warm, inspiring message here (2-3 sentences)",
  "map": {
    "provider": "mapbox",
    "url": "https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/[lng],[lat],12,0/600x400@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw"
  },
  "places": [
    {
      "name": "Exact place name",
      "description": "1-2 sentence description",
      "distance": "X.X km",
      "travel_time": "X min walking",
      "lat": 0.000000,
      "lng": 0.000000
    }
  ]
}

🗺️ Map URL instructions:
- Use Mapbox static API
- Format: https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/[lng],[lat],[zoom]/600x400@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw
- Replace [lng],[lat] with the center point (user location)
- Use zoom level 12-14
- This is a demo token, it will work for the UI

✅ Your task:
1. Identify 2-3 cultural spots near the user (museums, galleries, architecture, food, hidden gems, viewpoints)
2. Provide REAL places with ACCURATE coordinates
3. Calculate realistic distances and walking times
4. Write an elegant, warm, inspiring reply message
5. NEVER invent places or coordinates - only suggest places you know exist
6. Return ONLY the JSON object

⚠️ RESPOND WITH ONLY THE JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS. NO EXPLANATIONS.`;

            userContext = userContext + geoCulturalInstructions;
        }

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
